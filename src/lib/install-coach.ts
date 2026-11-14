import { isNativeApp } from '@/lib/platform';

export type InstallCoachPlatform = 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'unsupported';

export type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

export const INSTALL_COACH_STORAGE_KEY = 'fitwizard-install-coach-v1';
export const INSTALL_COACH_OPEN_DELAY_MS = 1200;

function getUserAgent() {
  if (typeof navigator === 'undefined') {
    return '';
  }

  return navigator.userAgent ?? '';
}

export function getInstallCoachPlatform(): InstallCoachPlatform {
  if (typeof window === 'undefined' || isNativeApp()) {
    return 'unsupported';
  }

  const userAgent = getUserAgent();

  // Android first: a desktop browser emulating Android on a touch-capable Mac
  // would otherwise match the "Mac with touch = iPad" rule below.
  if (/Android/i.test(userAgent)) {
    const isAndroidChrome =
      /Chrome|Chromium/i.test(userAgent) && !/EdgA|OPR|SamsungBrowser/i.test(userAgent);

    return isAndroidChrome ? 'android-chrome' : 'unsupported';
  }

  const isIOSDevice =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isIOSDevice) {
    return 'unsupported';
  }

  if (/CriOS/i.test(userAgent)) {
    return 'ios-chrome';
  }

  const isSafari =
    /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/i.test(userAgent);

  return isSafari ? 'ios-safari' : 'unsupported';
}

export function isInstallCoachStandalone() {
  if (typeof window === 'undefined' || isNativeApp()) {
    return false;
  }

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;

  return displayModeStandalone || navigatorWithStandalone.standalone === true;
}

export function isInstallCoachEligiblePlatform(platform: InstallCoachPlatform) {
  return platform !== 'unsupported';
}

/** Visits needed before the prompt may open by itself on the home page. */
export const INSTALL_COACH_MIN_VISITS = 2;

type AutoPromptContext = {
  pathname: string;
  hasPlan: boolean;
  visitCount: number;
};

/**
 * The prompt opens by itself only at a moment when the user has seen some value:
 * right after their first plan exists, or when they come back for a second visit.
 * It never opens on the first page load and never on other pages.
 */
export function shouldAutoPromptInstallCoach({ pathname, hasPlan, visitCount }: AutoPromptContext): boolean {
  if (pathname === '/plan') {
    return hasPlan;
  }

  if (pathname === '/') {
    return visitCount >= INSTALL_COACH_MIN_VISITS;
  }

  return false;
}
