import { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';

const IOS_DEVICE_REGEX = /iPhone|iPad|iPod/i;
const MACINTOSH_REGEX = /Macintosh/i;
const SAFARI_REGEX = /Safari/i;
const NON_SAFARI_IOS_BROWSERS_REGEX = /CriOS|FxiOS|EdgiOS|OPiOS/i;

function isIosOrIpadDesktopMode(userAgent: string, platform: string, maxTouchPoints: number) {
  if (IOS_DEVICE_REGEX.test(userAgent)) {
    return true;
  }

  return MACINTOSH_REGEX.test(userAgent) && platform === 'MacIntel' && maxTouchPoints > 1;
}

function isMobileSafari(userAgent: string) {
  return SAFARI_REGEX.test(userAgent) && !NON_SAFARI_IOS_BROWSERS_REGEX.test(userAgent);
}

export function detectAppleMobile() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === 'ios';
  }

  const { userAgent, platform, maxTouchPoints } = window.navigator;
  return isIosOrIpadDesktopMode(userAgent, platform, maxTouchPoints) && isMobileSafari(userAgent);
}

export function useAppleMobile() {
  return useMemo(() => detectAppleMobile(), []);
}

