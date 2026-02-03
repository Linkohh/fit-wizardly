import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

export const useTheme = (initialMode: ThemeMode = 'system') => {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Resolve the actual theme based on mode
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (mode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(mode);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes when in system mode
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateResolvedTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [mode]);

  // IMPORTANT:
  // Do not mutate `document.documentElement` here.
  // The main app owns the global theme class; this hook is for MCL-local theming only.
  const themeClassName = resolvedTheme === 'dark' ? 'dark' : '';

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return resolvedTheme === 'light' ? 'dark' : 'light';
    });
  }, [resolvedTheme]);

  return {
    mode,
    resolvedTheme,
    themeClassName,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
};

export default useTheme;
