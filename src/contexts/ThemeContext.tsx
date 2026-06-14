import React from 'react';
import { getRoleTheme, type RoleTheme } from '../lib/utils';

export const ThemeContext = React.createContext<RoleTheme>(getRoleTheme('athlete'));

export const useTheme = () => React.useContext(ThemeContext);

function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function ThemeProvider({ role, children }: { role: string | undefined; children: React.ReactNode }) {
  const theme = React.useMemo(() => getRoleTheme(role), [role]);

  React.useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    // Drive the Tailwind accent utilities (text-accent, bg-accent, accent/<a>…)
    const channels = hexToRgbChannels(theme.accent);
    document.documentElement.style.setProperty('--accent-rgb', channels);
    document.documentElement.style.setProperty('--accent-hover-rgb', channels);
  }, [theme.bg, theme.accent]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
