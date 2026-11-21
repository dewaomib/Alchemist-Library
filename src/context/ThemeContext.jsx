import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

export const THEME_STORAGE_KEY = 'alchemist_theme_preference';
export const VALID_THEMES = ['classic', 'modern'];

function readInitialTheme() {
  if (typeof window === 'undefined') return 'classic';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'modern' || saved === 'classic') return saved;
  } catch {
    // Abaikan jika localStorage tidak tersedia
  }
  const attr = document.documentElement?.getAttribute('data-theme');
  if (attr === 'modern' || attr === 'classic') return attr;
  return 'classic';
}

const ThemeContext = createContext({
  theme: 'classic',
  setTheme: () => {},
  toggleTheme: () => {},
  isModern: false,
  isClassic: true
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  const setTheme = (nextTheme) => {
    const normalized = nextTheme === 'modern' ? 'modern' : 'classic';
    setThemeState(normalized);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'modern' ? 'classic' : 'modern'));
  };

  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    if (root) {
      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme === 'modern' ? 'light' : 'dark';
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Abaikan jika penyimpanan dibatasi
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isModern: theme === 'modern',
      isClassic: theme === 'classic'
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
