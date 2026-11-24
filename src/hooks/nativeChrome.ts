/**
 * Native half of useStatusBarTheme(): loaded with a dynamic import() only on
 * native, so none of this is in the web startup bundle. See
 * src/hooks/useStatusBarTheme.ts.
 */
import { getNativePlatform, isNativeApp } from '@/lib/platform';

export type ResolvedTheme = 'light' | 'dark';

/** Matches the `theme-color` meta tags in index.html. */
export const STATUS_BAR_COLORS: Record<ResolvedTheme, string> = {
  dark: '#1A0B2E',
  light: '#F5F3FF',
};

type StatusBarModule = typeof import('@capacitor/status-bar');
type SplashScreenModule = typeof import('@capacitor/splash-screen');

let statusBarPromise: Promise<StatusBarModule | null> | null = null;
let splashScreenPromise: Promise<SplashScreenModule | null> | null = null;
let splashHidden = false;

function loadStatusBar(): Promise<StatusBarModule | null> {
  if (!statusBarPromise) {
    statusBarPromise = import('@capacitor/status-bar').catch(() => {
      statusBarPromise = null;
      return null;
    });
  }
  return statusBarPromise;
}

function loadSplashScreen(): Promise<SplashScreenModule | null> {
  if (!splashScreenPromise) {
    splashScreenPromise = import('@capacitor/splash-screen').catch(() => {
      splashScreenPromise = null;
      return null;
    });
  }
  return splashScreenPromise;
}

/** Sets the status bar style (and Android colour) for a theme. No-op on the web. */
export async function applyStatusBarTheme(theme: ResolvedTheme): Promise<void> {
  if (!isNativeApp()) return;
  const statusBarModule = await loadStatusBar();
  if (!statusBarModule) return;
  const { StatusBar, Style } = statusBarModule;

  try {
    // Style.Dark means light text, for dark backgrounds.
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
  } catch (error) {
    console.error('[StatusBar] setStyle failed:', error);
  }

  if (getNativePlatform() === 'android') {
    try {
      await StatusBar.setBackgroundColor({ color: STATUS_BAR_COLORS[theme] });
    } catch {
      // Not available on Android 15+ (edge to edge); the style above still applies.
    }
  }
}

/** Hides the splash screen once per app start. No-op on the web. */
export async function hideSplashScreen(): Promise<void> {
  if (splashHidden || !isNativeApp()) return;
  splashHidden = true;
  const splashModule = await loadSplashScreen();
  if (!splashModule) {
    splashHidden = false;
    return;
  }

  try {
    await splashModule.SplashScreen.hide({ fadeOutDuration: 200 });
  } catch (error) {
    splashHidden = false;
    console.error('[SplashScreen] hide failed:', error);
  }
}

/** Test helper: forget the cached plugins and the hidden flag. */
export function resetNativeChromeForTests(): void {
  statusBarPromise = null;
  splashScreenPromise = null;
  splashHidden = false;
}
