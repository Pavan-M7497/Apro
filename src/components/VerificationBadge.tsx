import { Shield, Check } from 'lucide-react';

interface Props {
  tier: number;
  size?: 'sm' | 'md';
}

const TIER_LABELS = ['', 'Email verified', 'Coach endorsed', 'Document verified'];

export default function VerificationBadge({ tier, size = 'sm' }: Props) {
  if (!tier) return null;

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (tier === 1) {
    return (
      <span title={TIER_LABELS[1]} className="inline-flex items-center justify-center text-text-muted" style={{ borderRadius: '3px' }}>
        <Check className={iconSize} />
      </span>
    );
  }
  if (tier === 2) {
    return (
      <span title={TIER_LABELS[2]} className="inline-flex items-center justify-center text-info" style={{ borderRadius: '3px' }}>
        <Shield className={iconSize} />
      </span>
    );
  }
  if (tier >= 3) {
    return (
      <span title={TIER_LABELS[3]} className="inline-flex items-center justify-center text-warning" style={{ borderRadius: '3px' }}>
        <Shield className={iconSize} />
      </span>
    );
  }
  return null;
}
