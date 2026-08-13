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

  React.useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
  }, [theme.bg]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
