export const CONSENT_STORAGE_KEY = 'fitwizard_consent_v1';
export const CONSENT_RESOLVED_EVENT = 'fitwizard:consent-resolved';
export const CONSENT_REQUEST_EVENT = 'fitwizard:consent-request';
export const ANALYTICS_CONSENT_STORAGE_KEY = 'fitwizard_analytics_consent';
export const NUTRITION_LOOKUP_CONSENT_STORAGE_KEY = 'fitwizard_nutrition_lookup_consent';

export function hasStoredConsent() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem(CONSENT_STORAGE_KEY));
}

export function hasAnalyticsConsent() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY) === 'true';
}

export function hasNutritionLookupConsent() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY) === 'true';
}

export function requestConsentModal() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(CONSENT_REQUEST_EVENT));
}
