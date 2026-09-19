import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeMode } from '../contexts/ThemeMode';

/**
 * Light/dark switch. Shows the icon of the mode you would switch TO, which is
 * the convention users expect: a moon while you are in the light.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = useThemeMode();
  const [hover, setHover] = useState(false);
  const dark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggleMode}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={`relative flex items-center justify-center flex-shrink-0 ${className ?? ''}`}
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '999px',
        background: 'var(--surface-2)',
        border: `1px solid ${hover ? 'var(--border-strong)' : 'var(--border)'}`,
        color: hover ? 'var(--text)' : 'var(--text-muted)',
        transition: 'border-color 150ms ease, color 150ms ease, background-color 200ms ease',
      }}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {/* Both icons stay mounted and cross-fade, so the swap does not jump. */}
      <Moon
        className="w-[17px] h-[17px] absolute"
        style={{ opacity: dark ? 0 : 1, transition: 'opacity 150ms ease' }}
        aria-hidden="true"
      />
      <Sun
        className="w-[17px] h-[17px] absolute"
        style={{ opacity: dark ? 1 : 0, transition: 'opacity 150ms ease' }}
        aria-hidden="true"
      />
    </button>
  );
}
