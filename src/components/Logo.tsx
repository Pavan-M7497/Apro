interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

/** The Apro apex mark. Single path, inherits colour, scales cleanly to 16px. */
export function AproMark({ size = 32, color = 'var(--text)', className }: LogoProps) {
  return (
    <svg
      viewBox="8 2 60 82"
      height={size}
      className={className}
      role="img"
      aria-label="Apro"
      style={{ display: 'block' }}
    >
      <path
        d="M 15 50 L 34 10 L 61 80"
        fill="none"
        stroke={color}
        strokeWidth="15"
        strokeLinejoin="bevel"
        strokeLinecap="butt"
      />
    </svg>
  );
}

/** Mark + "Apro" wordmark, horizontally locked. */
export function AproLockup({ size = 28, color = 'var(--text)', className }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.42 }}
    >
      <AproMark size={size * 1.18} color={color} />
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
        Apro
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
