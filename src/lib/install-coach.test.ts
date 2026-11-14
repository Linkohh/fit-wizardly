import { afterEach, describe, expect, it } from 'vitest';
import { getInstallCoachPlatform, shouldAutoPromptInstallCoach } from './install-coach';

const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36';
const IPAD_DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

function setNavigator(values: { userAgent: string; platform: string; maxTouchPoints: number }) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(window.navigator, key, { value, configurable: true });
  }
}

describe('getInstallCoachPlatform', () => {
  const original = {
    userAgent: window.navigator.userAgent,
    platform: window.navigator.platform,
    maxTouchPoints: window.navigator.maxTouchPoints,
  };

  afterEach(() => setNavigator(original));

  it('treats an Android browser as Android even on a touch-capable Mac', () => {
    setNavigator({ userAgent: ANDROID_CHROME_UA, platform: 'MacIntel', maxTouchPoints: 5 });
    expect(getInstallCoachPlatform()).toBe('android-chrome');
  });

  it('still treats an iPad in desktop mode as iOS Safari', () => {
    setNavigator({ userAgent: IPAD_DESKTOP_UA, platform: 'MacIntel', maxTouchPoints: 5 });
    expect(getInstallCoachPlatform()).toBe('ios-safari');
  });

  it('does not treat a Mac without touch as a phone', () => {
    setNavigator({ userAgent: IPAD_DESKTOP_UA, platform: 'MacIntel', maxTouchPoints: 0 });
    expect(getInstallCoachPlatform()).toBe('unsupported');
  });
});

describe('shouldAutoPromptInstallCoach', () => {
  it('never prompts on the first visit to the home page', () => {
    expect(shouldAutoPromptInstallCoach({ pathname: '/', hasPlan: false, visitCount: 1 })).toBe(false);
    expect(shouldAutoPromptInstallCoach({ pathname: '/', hasPlan: false, visitCount: 0 })).toBe(false);
  });

  it('prompts on the home page from the second visit', () => {
    expect(shouldAutoPromptInstallCoach({ pathname: '/', hasPlan: false, visitCount: 2 })).toBe(true);
  });

  it('prompts on the plan page once a plan exists, even on the first visit', () => {
    expect(shouldAutoPromptInstallCoach({ pathname: '/plan', hasPlan: true, visitCount: 1 })).toBe(true);
    expect(shouldAutoPromptInstallCoach({ pathname: '/plan', hasPlan: false, visitCount: 1 })).toBe(false);
  });

  it('does not interrupt other pages', () => {
    expect(shouldAutoPromptInstallCoach({ pathname: '/wizard', hasPlan: true, visitCount: 5 })).toBe(false);
    expect(shouldAutoPromptInstallCoach({ pathname: '/nutrition', hasPlan: false, visitCount: 5 })).toBe(false);
  });
});
