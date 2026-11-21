import { useSyncExternalStore } from 'react';
import { CONSENT_RESOLVED_EVENT, hasAnalyticsConsent } from '@/lib/consent';

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CONSENT_RESOLVED_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CONSENT_RESOLVED_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * The analytics opt-in from src/lib/consent.ts (`fitwizard_analytics_consent`),
 * kept current when the consent modal resolves or another tab changes it.
 */
export function useAnalyticsConsent(): boolean {
  return useSyncExternalStore(subscribe, hasAnalyticsConsent, () => false);
}
