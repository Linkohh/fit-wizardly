import { useState, useCallback, useSyncExternalStore } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

/**
 * The app owns the global theme: `App.tsx` (and `main.tsx` before first paint)
 * toggle the `dark` class on `<html>` from `themeStore`. In `system` mode the
 * selector follows that class, so it picks up theme changes without a reload
 * (DEBT-021) and agrees with the rest of the app instead of reading the OS
 * preference on its own.
 */
const readDocumentTheme = (): ResolvedTheme =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';

const subscribeToDocumentTheme = (onChange: () => void): (() => void) => {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};

const getServerTheme = (): ResolvedTheme => 'light';

export const useTheme = (initialMode: ThemeMode = 'system') => {
  // A local override from the selector's own toggle. It is cleared whenever the
  // `theme` prop changes, so the app's theme always wins after a switch.
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const [lastPropMode, setLastPropMode] = useState<ThemeMode>(initialMode);
  if (lastPropMode !== initialMode) {
    // Reset during render (React's "adjust state when a prop changes" pattern).
    setLastPropMode(initialMode);
    setOverride(null);
  }
  const mode: ThemeMode = override ?? initialMode;

  const documentTheme = useSyncExternalStore(
    subscribeToDocumentTheme,
    readDocumentTheme,
    getServerTheme,
  );
  const resolvedTheme: ResolvedTheme = mode === 'system' ? documentTheme : mode;

  // IMPORTANT:
  // Do not mutate `document.documentElement` here.
  // The main app owns the global theme class; this hook is for MCL-local theming only.
  const themeClassName = resolvedTheme === 'dark' ? 'dark' : '';

  const setTheme = useCallback((newMode: ThemeMode) => {
    setOverride(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setOverride(resolvedTheme === 'light' ? 'dark' : 'light');
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
