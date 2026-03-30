import { useEffect, useState } from 'react';
import { CONSENT_RESOLVED_EVENT, CONSENT_STORAGE_KEY, hasStoredConsent } from '@/lib/consent';

const INSTALL_COACH_AUTO_PROMPT_HOLD_MS = 350;

type UseInstallCoachAutoPromptReadyOptions = {
  delayMs?: number;
  heroReady: boolean;
};

export function useInstallCoachAutoPromptReady({
  delayMs = INSTALL_COACH_AUTO_PROMPT_HOLD_MS,
  heroReady,
}: UseInstallCoachAutoPromptReadyOptions) {
  const [consentResolved, setConsentResolved] = useState(() => hasStoredConsent());
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncConsent = () => {
      setConsentResolved(hasStoredConsent());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY) {
        syncConsent();
      }
    };

    syncConsent();
    window.addEventListener(CONSENT_RESOLVED_EVENT, syncConsent);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(CONSENT_RESOLVED_EVENT, syncConsent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!heroReady || !consentResolved) {
      setDelayElapsed(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setDelayElapsed(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [consentResolved, delayMs, heroReady]);

  return heroReady && consentResolved && delayElapsed;
}
