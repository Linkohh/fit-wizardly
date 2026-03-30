export const CONSENT_STORAGE_KEY = 'fitwizard_consent_v1';
export const CONSENT_RESOLVED_EVENT = 'fitwizard:consent-resolved';

export function hasStoredConsent() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem(CONSENT_STORAGE_KEY));
}
