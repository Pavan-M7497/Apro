/**
 * Matching imported meet rows to existing athletes.
 *
 * Deliberately conservative: an exact name match alone lands in the ambiguous
 * band, because two swimmers can share a name. Corroborating club or date of
 * birth is what pushes a row into auto-match territory.
 */

export interface MatchCandidate {
  profileId: string;
  fullName: string;
  clubName: string | null;
  dateOfBirth: string | null;
}

export interface MatchResult {
  profileId: string | null;
  confidence: number;
  /** Why this scored the way it did — surfaced in the review table. */
  reason: string;
}

export const MATCH_THRESHOLD = 0.9;
export const AMBIGUOUS_THRESHOLD = 0.6;

/** Lowercase, strip punctuation, collapse whitespace. */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const nameTokens = (name: string): string[] =>
  normaliseName(name).split(' ').filter(Boolean);

/** A single letter stands in for any token starting with that letter. */
const tokenMatches = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (a.length === 1 || b.length === 1) return a[0] === b[0];
  return false;
};

/**
 * Token-set name similarity, 0–1.
 * Order-insensitive so "Sharma Ananya" matches "Ananya Sharma".
 * Initial-only matches are discounted.
 */
export function nameSimilarity(a: string, b: string): number {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return 0;

  const used = new Set<number>();
  let exact = 0;
  let initial = 0;

  ta.forEach((t) => {
    // Prefer a full match before falling back to an initial match.
    let hit = tb.findIndex((o, i) => !used.has(i) && o === t);
    if (hit >= 0) { used.add(hit); exact++; return; }
    hit = tb.findIndex((o, i) => !used.has(i) && tokenMatches(t, o));
    if (hit >= 0) { used.add(hit); initial++; }
  });

  const matched = exact + initial * 0.75;
  // Divide by the longer list so extra unmatched tokens cost something.
  return matched / Math.max(ta.length, tb.length);
}

/** Loose club comparison — abbreviations and suffixes vary wildly in meet files. */
export function clubMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const na = normaliseName(a);
  const nb = normaliseName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Accepts yyyy-mm-dd, dd/mm/yyyy and dd-mm-yyyy. Returns yyyy-mm-dd or null. */
export function parseDob(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  return null;
}

/**
 * Times arrive as mm:ss.SS, ss.SS, or plain seconds. Returns seconds, or null
 * if the value cannot be read as a time.
 */
export function parseTimeToSeconds(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // mm:ss.SS (and h:mm:ss.SS for long open-water style entries)
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => p.trim());
    if (parts.some((p) => p === '' || Number.isNaN(Number(p)))) return null;
    const nums = parts.map(Number);
    const seconds = nums.reduce((acc, n) => acc * 60 + n, 0);
    return Number.isFinite(seconds) ? Math.round(seconds * 100) / 100 : null;
  }

  const n = Number(s);
  if (Number.isNaN(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Score an imported row against one candidate.
 * Name carries 0.8; club adds 0.1 and date of birth 0.15, capped at 1.
 */
export function scoreCandidate(
  row: { name: string; club?: string | null; dob?: string | null },
  candidate: MatchCandidate,
): { confidence: number; reason: string } {
  const nameScore = nameSimilarity(row.name, candidate.fullName);
  if (nameScore === 0) return { confidence: 0, reason: 'No name overlap' };

  const rowDob = parseDob(row.dob);
  const dobHit = !!(rowDob && candidate.dateOfBirth && rowDob === candidate.dateOfBirth);
  const clubHit = clubMatches(row.club, candidate.clubName);

  const confidence = Math.min(1, nameScore * 0.8 + (dobHit ? 0.15 : 0) + (clubHit ? 0.1 : 0));

  const bits = [`name ${(nameScore * 100).toFixed(0)}%`];
  if (dobHit) bits.push('DOB matches');
  else if (rowDob && candidate.dateOfBirth) bits.push('DOB differs');
  if (clubHit) bits.push('club matches');

  return { confidence: Math.round(confidence * 1000) / 1000, reason: bits.join(' · ') };
}

/** Best candidate for a row, or null when nothing scores above zero. */
export function bestMatch(
  row: { name: string; club?: string | null; dob?: string | null },
  candidates: MatchCandidate[],
): MatchResult {
  let best: MatchResult = { profileId: null, confidence: 0, reason: 'No candidate' };
  candidates.forEach((c) => {
    const { confidence, reason } = scoreCandidate(row, c);
    if (confidence > best.confidence) best = { profileId: c.profileId, confidence, reason };
  });
  return best;
}

export type RowAction = 'pending' | 'match' | 'create' | 'skip';

/** Default action implied by a confidence score. */
export function defaultAction(confidence: number): RowAction {
  if (confidence >= MATCH_THRESHOLD) return 'match';
  if (confidence >= AMBIGUOUS_THRESHOLD) return 'pending'; // needs a human
  return 'create';
}

export const isAmbiguous = (c: number) => c >= AMBIGUOUS_THRESHOLD && c < MATCH_THRESHOLD;

/** URL-safe token for claim links. */
export function generateClaimToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Unique-ish username for a placeholder profile. */
export function placeholderUsername(fullName: string): string {
  const base = normaliseName(fullName).replace(/\s+/g, '') || 'athlete';
  return `${base.slice(0, 18)}${Math.floor(Math.random() * 9000) + 1000}`;
}
