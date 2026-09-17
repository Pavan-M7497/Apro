import { supabase } from './supabase';
import type { UserRole } from './types';

/**
 * Query layer for the weekly email digest. Nothing here sends anything — it
 * returns the data one athlete's email would be built from.
 *
 * Two constraints shaped this:
 *
 * - Viewers are reported as role counts, never names. Who looked at a young
 *   athlete's profile is not something to put in an email, and an unclaimed or
 *   signed-out view has no identity to report anyway.
 * - `profile_views` is readable only by the profile's owner (migration 001), so
 *   this returns real numbers when the athlete runs it themselves, and a
 *   scheduled job must run it with the service role.
 */

export const DIGEST_VIEW_DAYS = 7;
export const DIGEST_MEET_DAYS = 30;

export interface DigestPersonalBest {
  discipline: string;
  event: string;
  course: string | null;
  /** Seconds for timed disciplines, points for diving. */
  value: number | null;
  unit: 'seconds' | 'points';
  meetName: string | null;
  achievedOn: string | null;
}

export interface DigestMeet {
  id: string;
  name: string;
  level: string;
  city: string | null;
  stateCode: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface WeeklyDigest {
  profileId: string;
  /** Inclusive start of the view window, ISO. */
  since: string;
  generatedAt: string;
  views: {
    total: number;
    /** Counts by viewer role. Never names. */
    byRole: Record<UserRole | 'signed_out', number>;
  };
  personalBests: DigestPersonalBest[];
  upcomingMeets: DigestMeet[];
  /** False when the athlete has nothing worth emailing about this week. */
  hasContent: boolean;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const emptyRoles = (): Record<UserRole | 'signed_out', number> => ({
  athlete: 0,
  brand: 0,
  coach: 0,
  agent: 0,
  signed_out: 0,
});

/**
 * Build one athlete's weekly digest.
 *
 * Every section degrades on its own: a failed query contributes nothing rather
 * than failing the digest, so one bad table does not cost the athlete the whole
 * email.
 */
export async function buildWeeklyDigest(profileId: string): Promise<WeeklyDigest> {
  const viewSince = daysAgo(DIGEST_VIEW_DAYS);
  const today = new Date();
  const meetCutoff = new Date(today);
  meetCutoff.setUTCDate(meetCutoff.getUTCDate() + DIGEST_MEET_DAYS);

  // The athlete's state decides which meets are relevant.
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('state_code')
    .eq('id', profileId)
    .maybeSingle();
  const stateCode = (profileRow as { state_code: string | null } | null)?.state_code ?? null;

  const [viewsRes, perfRes, divingRes, meetsRes] = await Promise.all([
    supabase
      .from('profile_views')
      .select('viewer_id')
      .eq('profile_id', profileId)
      .gte('created_at', viewSince.toISOString()),

    supabase
      .from('performance_records')
      .select('discipline, event, course, result_seconds, meet_name, meet_date')
      .eq('profile_id', profileId)
      .eq('is_personal_best', true)
      .gte('created_at', viewSince.toISOString()),

    supabase
      .from('diving_results')
      .select('event, total_score, meet_name, meet_date')
      .eq('profile_id', profileId)
      .eq('is_personal_best', true)
      .gte('created_at', viewSince.toISOString()),

    stateCode
      ? supabase
          .from('meets')
          .select('id, name, level, city, state_code, start_date, end_date')
          .eq('state_code', stateCode)
          .gte('start_date', isoDate(today))
          .lte('start_date', isoDate(meetCutoff))
          .order('start_date', { ascending: true })
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  // ── Views, resolved to role counts ──
  const viewRows = (viewsRes.data as { viewer_id: string | null }[] | null) ?? [];
  const byRole = emptyRoles();
  const viewerIds = Array.from(
    new Set(viewRows.map((v) => v.viewer_id).filter((id): id is string => !!id)),
  );

  byRole.signed_out = viewRows.filter((v) => !v.viewer_id).length;

  if (viewerIds.length > 0) {
    const { data: viewers } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', viewerIds);

    const roleById = new Map(
      ((viewers as { id: string; role: UserRole }[] | null) ?? []).map((v) => [v.id, v.role]),
    );
    viewRows.forEach((v) => {
      if (!v.viewer_id) return;
      const role = roleById.get(v.viewer_id);
      // A viewer whose profile has since been deleted still counted as a view.
      if (role && role in byRole) byRole[role] += 1;
      else byRole.signed_out += 1;
    });
  }

  // ── Personal bests ──
  const personalBests: DigestPersonalBest[] = [
    ...(((perfRes.data as any[] | null) ?? []).map((r) => ({
      discipline: r.discipline,
      event: r.event,
      course: r.course ?? null,
      value: r.result_seconds != null ? Number(r.result_seconds) : null,
      unit: 'seconds' as const,
      meetName: r.meet_name ?? null,
      achievedOn: r.meet_date ?? null,
    }))),
    ...(((divingRes.data as any[] | null) ?? []).map((r) => ({
      discipline: 'diving',
      event: r.event,
      course: null,
      value: r.total_score != null ? Number(r.total_score) : null,
      unit: 'points' as const,
      meetName: r.meet_name ?? null,
      achievedOn: r.meet_date ?? null,
    }))),
  ];

  // ── Upcoming meets ──
  const upcomingMeets: DigestMeet[] = (((meetsRes as any).data as any[] | null) ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    level: m.level,
    city: m.city ?? null,
    stateCode: m.state_code ?? null,
    startDate: m.start_date ?? null,
    endDate: m.end_date ?? null,
  }));

  return {
    profileId,
    since: viewSince.toISOString(),
    generatedAt: new Date().toISOString(),
    views: { total: viewRows.length, byRole },
    personalBests,
    upcomingMeets,
    hasContent:
      viewRows.length > 0 || personalBests.length > 0 || upcomingMeets.length > 0,
  };
}
