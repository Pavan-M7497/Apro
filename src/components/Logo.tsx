interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * The Aevon mark: two stacked chevrons pointing up — ascent and progression.
 * Inherits colour and scales cleanly to 16px.
 */
export function AevonMark({ size = 32, color = 'var(--text)', className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      height={size}
      className={className}
      role="img"
      aria-label="Aevon"
      style={{ display: 'block' }}
    >
      <path
        d="M 12 30 L 32 10 L 52 30"
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
      <path
        d="M 12 52 L 32 32 L 52 52"
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}

/** Mark + "Aevon" wordmark, horizontally locked. */
export function AevonLockup({ size = 28, color = 'var(--text)', className }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.42 }}
    >
      <AevonMark size={size * 1.18} color={color} />
      <span
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: size * 1.28,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          color,
        }}
      >
        Aevon
      </span>
    </span>
  );
}

/** Solid lime circle with an ink checkmark. Verified state only. */
export function VerifiedMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Verified">
      <circle cx="32" cy="32" r="32" fill="#B8E62E" />
      <path d="M 19 33 L 28 42 L 46 22" fill="none" stroke="#0E0E10" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
