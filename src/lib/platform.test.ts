import { afterEach, describe, expect, it, vi } from 'vitest';

const originalUserAgent = navigator.userAgent;
const originalPlatform = navigator.platform;
const originalMaxTouchPoints = navigator.maxTouchPoints;
const originalVibrate = navigator.vibrate;

async function loadPlatformModule({
  native,
  userAgent,
  platform = 'MacIntel',
  maxTouchPoints = 0,
  vibrate,
}: {
  native: boolean;
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  vibrate?: Navigator['vibrate'];
}) {
  vi.resetModules();

  vi.doMock('@capacitor/core', () => ({
    Capacitor: {
      isNativePlatform: () => native,
      getPlatform: () => (native ? 'ios' : 'web'),
    },
  }));

  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: userAgent,
  });
  Object.defineProperty(navigator, 'platform', {
    configurable: true,
    value: platform,
  });
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    value: maxTouchPoints,
  });
  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: vibrate,
  });

  return import('./platform');
}

describe('platform haptic capabilities', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
    Object.defineProperty(navigator, 'platform', {
      configurable: true,
      value: originalPlatform,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: originalMaxTouchPoints,
    });
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: originalVibrate,
    });
  });

  it('allows web haptics on Android browsers with vibration support', async () => {
    const { canUseWebHaptics, getWebPlatform } = await loadPlatformModule({
      native: false,
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/145.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      vibrate: vi.fn(),
    });

    expect(getWebPlatform()).toBe('android');
    expect(canUseWebHaptics()).toBe(true);
  });

  it('disables web haptics on iPhone web even when vibrate exists', async () => {
    const { canUseWebHaptics, getWebPlatform } = await loadPlatformModule({
      native: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 Version/18.3 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
      vibrate: vi.fn(),
    });

    expect(getWebPlatform()).toBe('ios');
    expect(canUseWebHaptics()).toBe(false);
  });

  it('detects iOS web without haptics', async () => {
    const { isIOSWebWithoutHaptics } = await loadPlatformModule({
      native: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 Version/18.3 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });

    expect(isIOSWebWithoutHaptics()).toBe(true);
  });

  it('does not flag Android web as iOS without haptics', async () => {
    const { isIOSWebWithoutHaptics } = await loadPlatformModule({
      native: false,
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/145.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      vibrate: vi.fn(),
    });

    expect(isIOSWebWithoutHaptics()).toBe(false);
  });

  it('does not flag native iOS as iOS web without haptics', async () => {
    const { isIOSWebWithoutHaptics } = await loadPlatformModule({
      native: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });

    expect(isIOSWebWithoutHaptics()).toBe(false);
  });
});
