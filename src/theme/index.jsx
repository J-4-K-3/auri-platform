import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { themeModeMap } from './tokens';

const ThemeContext = createContext(themeModeMap.dark);

export const ThemeProvider = ({ children }) => {
  const mode = useSelector((state) => state.ui.theme);
  const theme = useMemo(() => themeModeMap[mode] ?? themeModeMap.dark, [mode]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
