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
  const isIOSDevice =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOSDevice) {
    if (/CriOS/i.test(userAgent)) {
      return 'ios-chrome';
    }

    const isSafari =
      /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/i.test(userAgent);

    return isSafari ? 'ios-safari' : 'unsupported';
  }

  const isAndroidChrome =
    /Android/i.test(userAgent) && /Chrome|Chromium/i.test(userAgent) && !/EdgA|OPR|SamsungBrowser/i.test(userAgent);

  return isAndroidChrome ? 'android-chrome' : 'unsupported';
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

export function canShareInstallShortcut() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || isNativeApp()) {
    return false;
  }

  const isSecureContext =
    typeof window.isSecureContext === 'boolean' ? window.isSecureContext : true;

  return isSecureContext && typeof navigator.share === 'function';
}
