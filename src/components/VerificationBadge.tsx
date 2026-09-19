import { VerifiedMark } from './Logo';

interface Props {
  tier: number | null | undefined;
  size?: 'sm' | 'md';
}

/**
 * Tier 2 is a SELF-DECLARED id and must never read as a verified result.
 * It renders as an outline-only variant — a lime-stroked circle with no fill
 * and an ink check. The solid lime mark is reserved for tiers 3 and 4, which
 * are backed by real evidence.
 */
export const TIER_META: Record<number, { name: string; tooltip: string }> = {
  1: { name: 'Email verified', tooltip: 'Email verified' },
  2: { name: 'ID on file', tooltip: 'ID on file — not yet result-verified' },
  3: { name: 'Result matched', tooltip: 'Verified from official meet results' },
  4: { name: 'Association confirmed', tooltip: 'Confirmed by association' },
};

/** Outline-only mark: lime stroke, no fill, ink check. Tier 2 only. */
function UnverifiedOutlineMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="#B8E62E" strokeWidth="5" />
      <path
        d="M 19 33 L 28 42 L 46 22"
        fill="none"
        stroke="#0E0E10"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VerificationBadge({ tier, size = 'sm' }: Props) {
  const t = tier ?? 0;
  // Tiers 0 and 1 carry no badge.
  if (t < 2) return null;

  const px = size === 'sm' ? 18 : 22;
  const meta = TIER_META[t] ?? TIER_META[4];

  if (t === 2) {
    return (
      <span
        title={meta.tooltip}
        aria-label={meta.tooltip}
        className="inline-flex items-center justify-center flex-shrink-0 align-middle"
      >
        <UnverifiedOutlineMark size={px} />
      </span>
    );
  }

  // Tier 4 adds a 1.5px ink ring around the solid mark.
  return (
    <span
      title={meta.tooltip}
      aria-label={meta.tooltip}
      className="inline-flex items-center justify-center flex-shrink-0 align-middle"
      style={
        t >= 4
          ? { borderRadius: '999px', border: '1.5px solid #0E0E10', padding: '1.5px' }
          : undefined
      }
    >
      <VerifiedMark size={px} />
    </span>
  );
}
