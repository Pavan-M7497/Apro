import { supabase } from './supabase';
import type { AgeGroup, BaseTime, Gender } from './types';
import { ageGroupFromBirthYear } from './ageGroups';

/** Everything a leaderboard row needs about an athlete, keyed by profile id. */
export interface AthleteMeta {
  profileId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  stateCode: string | null;
  gender: Gender | null;
  clubName: string | null;
  /** Birth year only — exact dates are not readable by other users. */
  birthYear: number | null;
  verificationTier: number;
  isClaimed: boolean;
}

/** A ranked row, discipline-agnostic. */
export interface LeaderboardEntry {
  profileId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  clubName: string | null;
  /** Primary metric, already formatted for display. */
  metric: string;
  /** Muted detail beside the metric, e.g. "(48 in 20)". */
  metricSub?: string;
  /** Right-aligned secondary column, e.g. WA points or dive count. */
  secondary?: string;
  meetLevel?: string | null;
  verificationTier?: number | null;
  isClaimed?: boolean;
}

/**
 * World Aquatics points.
 * Returns null when no base time exists, so the caller can render an em dash
 * rather than an invented number.
 */
export function swimPoints(
  baseSeconds: number | null | undefined,
  resultSeconds: number | null | undefined,
): number | null {
  if (!baseSeconds || !resultSeconds || baseSeconds <= 0 || resultSeconds <= 0) return null;
  return Math.round(1000 * Math.pow(baseSeconds / resultSeconds, 3));
}

export const currentSeasonYear = () => new Date().getFullYear();

/** Key for the base-time lookup map. */
export const baseTimeKey = (event: string, course: string, gender: string) =>
  `${event}|${course}|${gender}`;

/** Fetch base times for a season into a lookup map. */
export async function fetchBaseTimes(seasonYear: number): Promise<Map<string, number>> {
  const { data } = await supabase
    .from('base_times')
    .select('*')
    .eq('season_year', seasonYear);
  const map = new Map<string, number>();
  ((data as BaseTime[]) || []).forEach((b) => {
    map.set(baseTimeKey(b.event, b.course, b.gender), Number(b.base_seconds));
  });
  return map;
}

/**
 * Load profile + club + athlete details for a set of profile ids.
 * Returns a map so callers can enrich result rows cheaply.
 */
export async function fetchAthleteMeta(profileIds: string[]): Promise<Map<string, AthleteMeta>> {
  const map = new Map<string, AthleteMeta>();
  if (profileIds.length === 0) return map;

  const unique = Array.from(new Set(profileIds));

  const [{ data: profiles }, { data: athletes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, state_code, gender, club_id, verification_tier, is_claimed')
      .in('id', unique),
    supabase
      .from('athlete_profiles')
      .select('profile_id, birth_year')
      .in('profile_id', unique),
  ]);

  const rows = (profiles as any[]) || [];
  const birthYearByProfile = new Map<string, number | null>(
    ((athletes as any[]) || []).map((a) => [a.profile_id, a.birth_year ?? null]),
  );

  // Resolve club names in one extra round trip.
  const clubIds = Array.from(new Set(rows.map((r) => r.club_id).filter(Boolean)));
  const clubNames = new Map<string, string>();
  if (clubIds.length > 0) {
    const { data: clubs } = await supabase.from('clubs').select('id, name, short_name').in('id', clubIds);
    ((clubs as any[]) || []).forEach((c) => clubNames.set(c.id, c.short_name || c.name));
  }

  rows.forEach((r) => {
    map.set(r.id, {
      profileId: r.id,
      username: r.username,
      fullName: r.full_name,
      avatarUrl: r.avatar_url ?? null,
      stateCode: r.state_code ?? null,
      gender: (r.gender as Gender) ?? null,
      clubName: r.club_id ? clubNames.get(r.club_id) ?? null : null,
      birthYear: birthYearByProfile.get(r.id) ?? null,
      verificationTier: r.verification_tier ?? 0,
      isClaimed: r.is_claimed ?? true,
    });
  });

  return map;
}

/** Shared gender / state / age-group filter applied to an enriched row. */
export function passesAthleteFilters(
  meta: AthleteMeta | undefined,
  filters: { gender?: string; stateCode?: string; ageGroup?: string; discipline: string },
  ageGroups: AgeGroup[],
  refDate: string,
): boolean {
  if (!meta) return false;
  if (filters.gender && meta.gender !== filters.gender) return false;
  if (filters.stateCode && meta.stateCode !== filters.stateCode) return false;
  if (filters.ageGroup) {
    if (meta.birthYear == null) return false;
    const label = ageGroupFromBirthYear(meta.birthYear, refDate, filters.discipline, ageGroups);
    if (label !== filters.ageGroup) return false;
  }
  return true;
}

/** Keep the single best row per athlete. `better(a, b)` returns true when a beats b. */
export function bestPerAthlete<T extends { profile_id: string }>(
  rows: T[],
  better: (candidate: T, incumbent: T) => boolean,
): T[] {
  const best = new Map<string, T>();
  rows.forEach((r) => {
    const cur = best.get(r.profile_id);
    if (!cur || better(r, cur)) best.set(r.profile_id, r);
  });
  return Array.from(best.values());
}
