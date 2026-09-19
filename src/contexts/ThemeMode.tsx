import React from 'react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'aevon-theme';

interface ThemeModeValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeModeContext = React.createContext<ThemeModeValue>({
  mode: 'light',
  toggleMode: () => {},
});

export const useThemeMode = () => React.useContext(ThemeModeContext);

/** Read the stored choice. Null means the user has never picked one. */
function storedMode(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
  } catch {
    // Private mode, or site data blocked. Fall back to the OS preference.
    return null;
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

function applyMode(mode: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');

  // Colours the browser chrome itself (address bar on Android, status bar on
  // an installed PWA). Without this the app looks dark but the chrome stays
  // white, which reads as a rendering bug.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#0E0E10' : '#FFFFFF');
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  // Initialised from the same rule as the inline script in index.html, so the
  // first render matches the class that script already set. Doing this lazily
  // rather than in an effect is what keeps there from being a flash.
  const [mode, setMode] = React.useState<ThemeMode>(() =>
    storedMode() ?? (systemPrefersDark() ? 'dark' : 'light'),
  );

  React.useEffect(() => {
    applyMode(mode);
  }, [mode]);

  // Follow the OS, but only while the user has never made a choice. Once they
  // have, their choice wins and the OS no longer overrides it.
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const onChange = (e: MediaQueryListEvent) => {
      if (storedMode() !== null) return;
      setMode(e.matches ? 'dark' : 'light');
    };

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggleMode = React.useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Not persisting is survivable; the toggle still works for this visit.
      }
      applyMode(next);
      return next;
    });
  }, []);

  const value = React.useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}
