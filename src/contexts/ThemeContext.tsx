import React from 'react';
import { getRoleTheme, type RoleTheme } from '../lib/utils';

export const ThemeContext = React.createContext<RoleTheme>(getRoleTheme('athlete'));

export const useTheme = () => React.useContext(ThemeContext);

export function ThemeProvider({ role, children }: { role: string | undefined; children: React.ReactNode }) {
  const theme = React.useMemo(() => getRoleTheme(role), [role]);

  React.useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
  }, [theme.bg]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
