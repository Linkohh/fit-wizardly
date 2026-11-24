import { useEffect } from 'react';
import { isNativeApp } from '@/lib/platform';
import { useStoresHydrated } from '@/hooks/useStoresHydrated';
import { useThemeStore } from '@/stores/themeStore';

/**
 * Native status bar and splash screen (contract #10, roadmap 2.4).
 *
 * - Keeps the status bar text readable for the current theme: light text on
 *   the dark theme, dark text on the light theme. On Android it also paints
 *   the bar to match the page (Android 14 and older; Android 15+ draws the app
 *   edge to edge and ignores the colour).
 * - Hides the splash screen once the persisted stores have loaded
 *   (`launchAutoHide: false` in capacitor.config.ts), so the first frame people
 *   see is the real app, not the loading screen.
 *
 * The plugins and the code that drives them (src/hooks/nativeChrome.ts) load
 * with a dynamic `import()` only on native, so none of it is in the web
 * startup bundle. On the web this hook does nothing.
 *
 * Mount once, in `src/App.tsx`.
 */

function loadNativeChrome() {
  return import('./nativeChrome').catch((error: unknown) => {
    console.error('[StatusBar] Failed to load native helpers:', error);
    return null;
  });
}

export function useStatusBarTheme(): void {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const storesHydrated = useStoresHydrated();

  useEffect(() => {
    if (!isNativeApp()) return;
    void loadNativeChrome().then((chrome) => chrome?.applyStatusBarTheme(resolvedTheme));
  }, [resolvedTheme]);

  useEffect(() => {
    if (!storesHydrated || !isNativeApp()) return;
    void loadNativeChrome().then((chrome) => chrome?.hideSplashScreen());
  }, [storesHydrated]);
}
