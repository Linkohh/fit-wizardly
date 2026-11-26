import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  CONSENT_RESOLVED_EVENT,
  CRASH_REPORTS_CONSENT_STORAGE_KEY,
  hasAnalyticsConsent,
  hasCrashReportsConsent,
  onConsentChange,
} from './consent';

describe('consent flags', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('keeps crash reports and analytics on separate keys, both off by default', () => {
    expect(CRASH_REPORTS_CONSENT_STORAGE_KEY).not.toBe(ANALYTICS_CONSENT_STORAGE_KEY);
    expect(hasCrashReportsConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);

    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
    expect(hasAnalyticsConsent()).toBe(true);
    expect(hasCrashReportsConsent()).toBe(false);

    localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
    expect(hasCrashReportsConsent()).toBe(true);
  });

  it('treats blocked storage as no consent instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(hasCrashReportsConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('notifies on the modal event and on consent changes from other tabs only', () => {
    const listener = vi.fn();
    const unsubscribe = onConsentChange(listener);

    window.dispatchEvent(new Event(CONSENT_RESOLVED_EVENT));
    window.dispatchEvent(new StorageEvent('storage', { key: CRASH_REPORTS_CONSENT_STORAGE_KEY }));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'some-other-app-key' }));
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    window.dispatchEvent(new Event(CONSENT_RESOLVED_EVENT));
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
