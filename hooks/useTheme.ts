import { useState, useEffect } from 'react';
import type { Theme } from '../types';

export const useTheme = (): [Theme, (theme: Theme) => void] => {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('scanSaveTheme') as Theme | null;
    if (storedTheme && ['light', 'dark', 'nebula'].includes(storedTheme)) {
        setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-default', 'theme-dusk', 'theme-minty', 'theme-light', 'theme-dark', 'theme-nebula');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('scanSaveTheme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  return [theme, setTheme];
};