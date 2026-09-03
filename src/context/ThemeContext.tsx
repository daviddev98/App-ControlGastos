import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { darkColors, lightColors, ThemeColors } from '../constants/themes';
import {
  getStoredTheme,
  setStoredTheme,
  ThemeMode,
} from '../services/storage';

type ThemeContextValue = {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  isReady: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: Props) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getStoredTheme()
      .then((storedTheme) => {
        setThemeState(storedTheme);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    void setStoredTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const nextTheme: ThemeMode = current === 'light' ? 'dark' : 'light';
      void setStoredTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = theme === 'dark';
    return {
      theme,
      colors: isDark ? darkColors : lightColors,
      isDark,
      isReady,
      setTheme,
      toggleTheme,
    };
  }, [theme, isReady, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}
