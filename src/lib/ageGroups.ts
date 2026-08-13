import { supabase } from './supabase';
import type { AgeGroup } from './types';

/** Fallback when an athlete's age fits no configured band. */
export const OPEN_GROUP = 'Open';

/**
 * Whole years completed between `dob` and `refDate`.
 * Returns null when either date is missing or unparseable.
 */
export function ageAt(dob: string, refDate: string): number | null {
  if (!dob || !refDate) return null;
  const birth = new Date(dob);
  const ref = new Date(refDate);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) return null;

  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();
  // Birthday hasn't landed yet this year.
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) age--;
  return age < 0 ? null : age;
}

/**
 * Resolve an athlete's age group label for a discipline at a reference date.
 * Groups are matched in `sort_order`, so narrower bands should sort first.
 * Returns 'Open' when nothing matches.
 */
export function getAgeGroup(
  dob: string,
  refDate: string,
  discipline: string,
  groups: AgeGroup[],
): string {
  const age = ageAt(dob, refDate);
  if (age == null) return OPEN_GROUP;

  const match = groups
    .filter((g) => g.discipline === discipline)
    .sort((a, b) => a.sort_order - b.sort_order)
    .find((g) => age >= g.min_age && (g.max_age == null || age <= g.max_age));

  return match?.label ?? OPEN_GROUP;
}

// ── Cache ────────────────────────────────────────────────────────────────
// age_groups is small and changes rarely, so one fetch serves the session.
let cache: AgeGroup[] | null = null;
let inFlight: Promise<AgeGroup[]> | null = null;

/** Fetch all age groups, cached for the session. Concurrent calls share one request. */
export async function fetchAgeGroups(): Promise<AgeGroup[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const { data, error } = await supabase
      .from('age_groups')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      inFlight = null;
      return [];
    }
    cache = (data as AgeGroup[]) || [];
    inFlight = null;
    return cache;
  })();

  return inFlight;
}

/** Drop the cache — call after editing age groups. */
export function clearAgeGroupCache(): void {
  cache = null;
  inFlight = null;
}

/** Convenience: fetch groups then resolve the label in one call. */
export async function resolveAgeGroup(
  dob: string,
  refDate: string,
  discipline: string,
): Promise<string> {
  return getAgeGroup(dob, refDate, discipline, await fetchAgeGroups());
}
