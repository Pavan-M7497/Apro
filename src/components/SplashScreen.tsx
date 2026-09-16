import { useEffect, useState } from 'react';
import { AproMark } from './Logo';

const FADE_MS = 250;
const MIN_VISIBLE_MS = 600;

/**
 * Launch screen shown while the initial auth session resolves.
 *
 * Two timings matter. A minimum visible time stops the screen flashing on a
 * fast connection, where the session resolves in tens of milliseconds and a
 * bare mount-then-unmount reads as a glitch. A fade covers the handover to the
 * app, which is what replaced the blank white gap on a slow one.
 *
 * It stays mounted through the fade and unmounts itself afterwards, so nothing
 * above it has to track the animation.
 */
export default function SplashScreen({ ready }: { ready: boolean }) {
  const [mountedAt] = useState(() => Date.now());
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;

    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - mountedAt));
    const startFade = setTimeout(() => setFading(true), remaining);
    const unmount = setTimeout(() => setGone(true), remaining + FADE_MS);

    return () => { clearTimeout(startFade); clearTimeout(unmount); };
  }, [ready, mountedAt]);

  if (gone) return null;

  return (
    <div
      aria-hidden={fading}
      role="status"
      aria-label="Loading Apro"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        background: '#0E0E10',
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        // The fade is decorative; without this the screen would linger at full
        // opacity for anyone who has asked for reduced motion.
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <AproMark size={72} color="#B8E62E" />
      <span
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: '38px',
          letterSpacing: '-0.01em',
          lineHeight: 1,
          color: '#FFFFFF',
        }}
      >
        Apro
      </span>
    </div>
  );
}
