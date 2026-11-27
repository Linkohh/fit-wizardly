export const CONSENT_STORAGE_KEY = 'fitwizard_consent_v1';
export const CONSENT_RESOLVED_EVENT = 'fitwizard:consent-resolved';
export const CONSENT_REQUEST_EVENT = 'fitwizard:consent-request';
/** Product analytics opt-in: PostHog and Vercel Web Analytics. */
export const ANALYTICS_CONSENT_STORAGE_KEY = 'fitwizard_analytics_consent';
/**
 * Crash-report opt-in: Sentry. Added on Lane C Day 5, separate from analytics.
 * Nobody has it yet, so crash reporting starts off for everyone, including people
 * who opted in to analytics before this key existed.
 */
export const CRASH_REPORTS_CONSENT_STORAGE_KEY = 'fitwizard_crash_reports_consent';
export const NUTRITION_LOOKUP_CONSENT_STORAGE_KEY = 'fitwizard_nutrition_lookup_consent';

/** Reads a consent flag. Storage that is missing or blocked counts as "no". */
function readFlag(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function hasStoredConsent() {
  return Boolean(readFlag(CONSENT_STORAGE_KEY));
}

export function hasAnalyticsConsent() {
  return readFlag(ANALYTICS_CONSENT_STORAGE_KEY) === 'true';
}

export function hasCrashReportsConsent() {
  return readFlag(CRASH_REPORTS_CONSENT_STORAGE_KEY) === 'true';
}

export function hasNutritionLookupConsent() {
  return readFlag(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY) === 'true';
}

/**
 * Calls `listener` whenever consent may have changed: the consent modal saved in
 * this tab (CONSENT_RESOLVED_EVENT) or another tab changed storage. The listener
 * reads the flags itself. Returns an unsubscribe function.
 */
export function onConsentChange(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    // key is null when another tab cleared all storage.
    if (event.key === null || event.key.startsWith('fitwizard_')) {
      listener();
    }
  };

  window.addEventListener(CONSENT_RESOLVED_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CONSENT_RESOLVED_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function requestConsentModal() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(CONSENT_REQUEST_EVENT));
}
