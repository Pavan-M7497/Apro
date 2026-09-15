import type { Profile } from './types';

/**
 * Age-related helpers for a platform whose athletes are mostly 10–17.
 *
 * None of this is a security boundary. Every rule here is also enforced in the
 * database (migration 015) — these functions exist so the UI agrees with what
 * the server will actually allow, not to do the enforcing.
 */

/** Whole years completed between `dob` and today. Null when unparseable. */
export function ageFrom(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age < 0 ? null : age;
}

/**
 * Under 18 today.
 *
 * An unknown date of birth returns false: it is not evidence of being a minor,
 * and treating it as one would silently lock adults out of their own settings.
 * The safe defaults come from consent at signup, not from this guess.
 */
export function isMinor(dateOfBirth: string | null | undefined): boolean {
  const age = ageFrom(dateOfBirth);
  return age != null && age < 18;
}

export type Visibility = 'public' | 'limited';
export type MessagePolicy = 'anyone' | 'verified' | 'nobody';

/** A profile is limited if it says so — the server forces this on for under-18s. */
export function isLimited(profile: Pick<Profile, 'profile_visibility'> | null): boolean {
  return profile?.profile_visibility === 'limited';
}

/**
 * What a visitor may see on someone else's profile.
 *
 * Name, discipline, state, club, results, achievements and the verification
 * badge are always public — they are the point of the platform. A limited
 * profile additionally withholds the exact city and the date of birth.
 *
 * Phone numbers are absent from every branch because the platform never
 * displays one at any age. There is deliberately no field for it.
 */
export interface PublicFields {
  showCity: boolean;
  showExactDob: boolean;
  showContact: boolean;
  /** Always false. Kept explicit so a future contact field cannot quietly appear. */
  showPhone: false;
}

export function publicFieldsFor(
  profile: Pick<Profile, 'profile_visibility'> | null,
  isOwnProfile: boolean,
): PublicFields {
  if (isOwnProfile) {
    return { showCity: true, showExactDob: true, showContact: true, showPhone: false };
  }
  const limited = isLimited(profile);
  return {
    showCity: !limited,
    showExactDob: false, // never shown to anyone but the owner, at any age
    showContact: !limited,
    showPhone: false,
  };
}

/**
 * Mirrors can_message() in migration 015. The database is the authority; this
 * only decides whether to show the button or the explanation.
 */
export function canMessage(
  sender: Pick<Profile, 'verification_tier' | 'club_id'> | null,
  recipient: Pick<Profile, 'allow_messages_from' | 'club_id'> | null,
  blocked: boolean,
): boolean {
  if (!sender || !recipient || blocked) return false;

  const policy = recipient.allow_messages_from ?? 'anyone';
  if (policy === 'nobody') return false;
  if (policy === 'anyone') return true;

  const verified = (sender.verification_tier ?? 0) >= 3;
  const sharedClub = !!sender.club_id && sender.club_id === recipient.club_id;
  return verified || sharedClub;
}

export const MESSAGE_GATE_NOTICE =
  'This athlete only accepts messages from verified coaches and clubs.';

export const MESSAGE_CLOSED_NOTICE =
  'This athlete is not accepting new messages.';

export const REPORT_REASONS = [
  { id: 'impersonation', label: 'Impersonation' },
  { id: 'inappropriate_messages', label: 'Inappropriate messages' },
  { id: 'fake_results', label: 'Fake results' },
  { id: 'other', label: 'Other' },
] as const;

export type ReportReason = typeof REPORT_REASONS[number]['id'];
