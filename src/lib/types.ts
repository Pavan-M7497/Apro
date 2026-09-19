export type UserRole = 'athlete' | 'brand' | 'coach' | 'agent';

export interface IndianState {
  code: string;
  name: string;
  type: 'state' | 'ut';
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  country: string;
  state_code: string | null;
  city: string | null;
  club_id: string | null;
  gender: Gender | null;
  role: UserRole;
  /**
   * Owner-only, like `phone`: withheld from the public column grant because it
   * is half of the claim check (migration 016). Read it with `my_contact()`;
   * off a profile row fetched normally it is always undefined.
   */
  sfi_id?: string | null;
  state_assoc_id: string | null;
  is_claimed?: boolean;
  /** Owner/admin only — not in the public column grant. */
  claim_token?: string | null;
  verification_tier?: number;
  verified_at?: string | null;
  /**
   * Account recovery only. Not readable by other users and never rendered on a
   * profile; present here only so the owner's editor can round-trip it.
   */
  phone?: string | null;
  /** Guardian consent — set at signup for under-18 accounts (migration 015). */
  parent_name?: string | null;
  parent_email?: string | null;
  consent_given_at?: string | null;
  /** Forced to 'limited' for under-18s by a database trigger. */
  profile_visibility?: 'public' | 'limited';
  allow_messages_from?: 'anyone' | 'verified' | 'nobody';
  /** Email digest switches (migration 017). */
  digest_weekly?: boolean;
  digest_meets?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AthleteProfile {
  id: string;
  profile_id: string;
  /** Aquatics discipline id — see DISCIPLINES. Reuses the legacy `sport` column. */
  sport: string;
  /**
   * Water polo: the playing position (see WATERPOLO_POSITIONS).
   * All other disciplines: comma-separated primary events (max MAX_PRIMARY_EVENTS).
   * Reuses the legacy `position` column.
   */
  position: string;
  /**
   * Readable only by the owner, via the `my_athlete_dob()` RPC. SELECT on this
   * column is revoked from anon and authenticated (migration 015), so a plain
   * `select('*')` on athlete_profiles will fail — list columns explicitly.
   */
  date_of_birth?: string | null;
  /** Public stand-in for the exact date. All age-group logic uses this. */
  birth_year: number | null;
  availability: 'available' | 'unavailable' | 'open_to_offers';
}

/** Columns of athlete_profiles that anon and authenticated may actually read. */
export const ATHLETE_PUBLIC_COLUMNS = 'id, profile_id, sport, position, birth_year, availability';

/**
 * Columns of `profiles` that anon and authenticated may read (migration 016).
 * `select('*')` fails against profiles now, because the table also holds a
 * phone number, a guardian's name and email, the claim token and the SFI id —
 * none of which are anyone else's business. Owners read their own back through
 * the `my_contact()` RPC.
 */
export const PROFILE_PUBLIC_COLUMNS =
  'id, user_id, username, full_name, avatar_url, cover_url, bio, ' +
  'country, state_code, city, club_id, gender, role, ' +
  'state_assoc_id, verification_tier, verified_at, is_claimed, ' +
  'profile_visibility, allow_messages_from, digest_weekly, digest_meets, ' +
  'created_at, updated_at';

export interface Highlight {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  sport: string;
  created_at: string;
}

export interface Stat {
  id: string;
  athlete_profile_id: string;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  clean_sheets: number | null;
  minutes_played: number;
}

export interface Achievement {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  date: string;
  icon: string | null;
  verified?: boolean;
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  proof_url?: string | null;
  flag_count?: number;
}

export interface ProfileView {
  id: string;
  profile_id: string;
  viewer_id: string | null;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FeedItem {
  id: string;
  type: 'highlight' | 'achievement' | 'profile_update';
  profile: Profile;
  highlight?: Highlight;
  achievement?: Achievement;
  created_at: string;
}

export const DISCIPLINES = [
  { id: 'swimming',  name: 'Swimming'   },
  { id: 'waterpolo', name: 'Water Polo' },
  { id: 'diving',    name: 'Diving'     },
] as const;

export type DisciplineId = typeof DISCIPLINES[number]['id'];

export const EVENTS: Record<DisciplineId, string[]> = {
  swimming: [
    '50m Freestyle','100m Freestyle','200m Freestyle','400m Freestyle','800m Freestyle','1500m Freestyle',
    '50m Backstroke','100m Backstroke','200m Backstroke',
    '50m Breaststroke','100m Breaststroke','200m Breaststroke',
    '50m Butterfly','100m Butterfly','200m Butterfly',
    '200m Individual Medley','400m Individual Medley',
  ],
  diving: ['1m Springboard','3m Springboard','10m Platform'],
  waterpolo: [],
};

export const DIVING_SYNCHRO = ['3m Synchronised','10m Synchronised','Mixed Synchronised'];

export const WATERPOLO_POSITIONS = [
  'Goalkeeper','Centre Forward','Centre Back','Driver','Wing','Point','Utility',
];

export function isDisciplineId(id: string | null | undefined): id is DisciplineId {
  return DISCIPLINES.some((d) => d.id === id);
}

/** Safe accessor — EVENTS is keyed by DisciplineId, call sites hold plain strings. */
export function eventsFor(discipline: string | null | undefined): string[] {
  return isDisciplineId(discipline) ? EVENTS[discipline] : [];
}

export const MEET_LEVELS = [
  { id: 'school',       name: 'School',            weight: 2 },
  { id: 'district',     name: 'District',          weight: 5 },
  { id: 'state',        name: 'State',             weight: 10 },
  { id: 'zonal',        name: 'Zonal / Inter-State', weight: 15 },
  { id: 'national',     name: 'National',          weight: 22 },
  { id: 'khelo_india',  name: 'Khelo India',       weight: 25 },
  { id: 'international',name: 'International',     weight: 30 },
] as const;

export type MeetLevelId = typeof MEET_LEVELS[number]['id'];
export type Course = 'SCM' | 'LCM' | 'NA';

/** Disciplines measured on the clock — course (SCM/LCM) is required. */
export const TIMED_DISCIPLINES = ['swimming'];
/** Disciplines scored by judges — results are points, not seconds. */
export const SCORED_DISCIPLINES = ['diving'];

export type Gender = 'male' | 'female' | 'other';

export const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

export interface AgeGroup {
  id: string;
  discipline: string;
  label: string;
  min_age: number;
  max_age: number | null;
  sort_order: number;
}

export interface Club {
  id: string;
  name: string;
  short_name: string | null;
  state_code: string | null;
  city: string | null;
  created_at: string;
}

export interface DivingResult {
  id: string;
  profile_id: string;
  event: string;
  total_score: number;
  dive_count: number | null;
  average_dd: number | null;
  meet_name: string | null;
  meet_level: string | null;
  meet_date: string | null;
  is_personal_best: boolean;
  verified: boolean;
  created_at: string;
}

export interface BaseTime {
  id: string;
  event: string;
  course: 'SCM' | 'LCM';
  gender: 'male' | 'female';
  base_seconds: number;
  season_year: number;
}

export const MAX_PRIMARY_EVENTS = 3;

export interface PerformanceRecord {
  id: string;
  profile_id: string;
  discipline: string;
  event: string;
  course: Course | null;
  result_seconds: number | null;
  result_points: number | null;
  meet_name: string | null;
  meet_level: MeetLevelId | null;
  meet_date: string | null;
  is_personal_best: boolean;
  verified: boolean;
  created_at: string;
}

export interface WaterpoloStat {
  id: string;
  profile_id: string;
  season: string;
  competition: string | null;
  matches: number;
  goals: number;
  assists: number;
  saves: number;
  exclusions_drawn: number;
  created_at: string;
}

export type ActivityType = 'running' | 'cycling' | 'swimming' | 'gym' | 'team_sport' | 'general';

export interface TrainingSession {
  id: string;
  profile_id: string;
  activity_type: ActivityType;
  session_date: string;
  duration_minutes: number;
  intensity_rpe: number | null;
  notes: string | null;
  is_public: boolean;
  created_at: string;
  run_data?: RunData | null;
  swim_data?: SwimData | null;
  strength_sets?: StrengthSet[];
}

export interface RunData {
  id: string;
  session_id: string;
  distance_km: number | null;
  pace_seconds_per_km: number | null;
  elevation_m: number | null;
}

export interface SwimData {
  id: string;
  session_id: string;
  pool_length_m: number;
  laps: number | null;
  total_distance_m: number | null;
  stroke_type: string | null;
}

export interface StrengthSet {
  id: string;
  session_id: string;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
}

export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'running',     label: 'Running',      icon: 'ti-run' },
  { value: 'cycling',     label: 'Cycling',      icon: 'ti-bike' },
  { value: 'swimming',    label: 'Swimming',     icon: 'ti-swimming' },
  { value: 'gym',         label: 'Gym / Strength', icon: 'ti-barbell' },
  { value: 'team_sport',  label: 'Team sport / Pool session', icon: 'ti-ball-football' },
  { value: 'general',     label: 'General fitness', icon: 'ti-heart-rate-monitor' },
];

export const STROKE_TYPES = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Medley', 'Mixed'];

export function disciplineName(id: string | null | undefined): string {
  return DISCIPLINES.find((d) => d.id === id)?.name || '';
}

export function meetLevel(id: string | null | undefined) {
  return MEET_LEVELS.find((m) => m.id === id);
}

/**
 * Meet level badges. Always a soft background with readable text — never
 * saturated colour as text on white.
 */
export const MEET_LEVEL_STYLES: Record<string, { background: string; color: string }> = {
  school:        { background: 'var(--surface-2)',  color: 'var(--text-muted)' },
  district:      { background: 'var(--surface-2)',  color: 'var(--text-muted)' },
  state:         { background: 'var(--info-soft)',  color: 'var(--info)' },
  zonal:         { background: 'var(--info-soft)',  color: 'var(--info)' },
  national:      { background: 'var(--warning-soft)', color: 'var(--warning)' },
  khelo_india:   { background: 'var(--accent-soft)', color: 'var(--accent-ink)' },
  international: { background: 'var(--accent-soft)', color: 'var(--accent-ink)' },
};

export const meetLevelStyle = (id: string | null | undefined) =>
  MEET_LEVEL_STYLES[id ?? ''] ?? { background: 'var(--surface-2)', color: 'var(--text-muted)' };

/** Seconds -> mm:ss.SS (or ss.SS when under a minute). */
export function formatSwimTime(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const rest = seconds - mins * 60;
  const secStr = rest.toFixed(2).padStart(5, '0');
  return mins > 0 ? `${mins}:${secStr}` : rest.toFixed(2);
}

/** Primary events are stored comma-separated in athlete_profiles.position. */
export function parsePrimaryEvents(position: string | null | undefined): string[] {
  if (!position) return [];
  return position.split(',').map((e) => e.trim()).filter(Boolean);
}

export interface VerificationRequest {
  id: string;
  profile_id: string;
  requested_tier: number;
  sfi_id: string | null;
  document_url: string | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

/** What each verification tier means and what unlocks the next one. */
export const VERIFICATION_TIERS: { tier: number; name: string; earned: string }[] = [
  { tier: 0, name: 'Unverified',            earned: 'Confirm your email to reach tier 1.' },
  { tier: 1, name: 'Email verified',        earned: 'Automatic once you confirm your email.' },
  { tier: 2, name: 'ID on file',            earned: 'Add your SFI or state association number.' },
  { tier: 3, name: 'Result matched',        earned: 'Earned when one of your results is confirmed from an official meet import.' },
  { tier: 4, name: 'Association confirmed', earned: 'Approved by us after your club or association confirms you.' },
];
