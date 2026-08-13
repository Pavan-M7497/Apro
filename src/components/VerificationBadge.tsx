import { BadgeCheck } from 'lucide-react';

interface Props {
  tier: number | null | undefined;
  size?: 'sm' | 'md';
}

/**
 * Tier 2 is a SELF-DECLARED id and must never read as a verified result.
 * It is therefore drawn as a hollow, neutral-grey outline — no lime, no fill.
 * Lime fill is reserved for tiers 3 and 4, which are backed by real evidence.
 */
export const TIER_META: Record<number, { name: string; tooltip: string }> = {
  1: { name: 'Email verified', tooltip: 'Email verified' },
  2: { name: 'ID on file', tooltip: 'ID on file — not yet result-verified' },
  3: { name: 'Result matched', tooltip: 'Verified from official meet results' },
  4: { name: 'Association confirmed', tooltip: 'Confirmed by association' },
};

export default function VerificationBadge({ tier, size = 'sm' }: Props) {
  const t = tier ?? 0;
  // Tiers 0 and 1 carry no badge.
  if (t < 2) return null;

  const px = size === 'sm' ? 18 : 22;
  const meta = TIER_META[t] ?? TIER_META[4];

  // Tier 2 — hollow outline, neutral grey.
  if (t === 2) {
    return (
      <span
        title={meta.tooltip}
        aria-label={meta.tooltip}
        className="inline-flex items-center justify-center flex-shrink-0 align-middle"
        style={{
          width: px,
          height: px,
          borderRadius: '999px',
          border: '1.5px solid var(--text-soft)',
          color: 'var(--text-soft)',
          background: 'transparent',
        }}
      >
        <BadgeCheck style={{ width: px * 0.6, height: px * 0.6 }} strokeWidth={2.5} />
      </span>
    );
  }

  // Tiers 3 and 4 — solid lime. Tier 4 adds a ring.
  return (
    <span
      title={meta.tooltip}
      aria-label={meta.tooltip}
      className="inline-flex items-center justify-center flex-shrink-0 align-middle"
      style={{
        width: px,
        height: px,
        borderRadius: '999px',
        background: 'var(--accent)',
        color: 'var(--on-accent)',
        boxShadow: t >= 4 ? '0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent)' : undefined,
      }}
    >
      <BadgeCheck style={{ width: px * 0.62, height: px * 0.62 }} strokeWidth={2.5} />
    </span>
  );
}
