import React from 'react';
import { getRoleTheme, type RoleTheme } from '../lib/utils';

export const ThemeContext = React.createContext<RoleTheme>(getRoleTheme());

export const useTheme = () => React.useContext(ThemeContext);

/**
 * One light theme for everyone. Per-role colour worlds were removed —
 * `role` is accepted so existing call sites keep working, but ignored.
 */
export function ThemeProvider({ children }: { role?: string | undefined; children: React.ReactNode }) {
  const theme = React.useMemo(() => getRoleTheme(), []);

  // The body background is owned by CSS (`body { background-color: var(--bg) }`)
  // so it transitions with the theme. Setting it inline here would pin it.

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
