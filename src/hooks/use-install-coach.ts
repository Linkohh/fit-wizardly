import { useCallback, useEffect, useMemo } from 'react';
import {
  getInstallCoachPlatform,
  INSTALL_COACH_OPEN_DELAY_MS,
  isInstallCoachEligiblePlatform,
  isInstallCoachStandalone,
} from '@/lib/install-coach';
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  startInstallPromptCapture,
  subscribeInstallPrompt,
} from '@/lib/install-prompt-capture';
import { useInstallCoachStore } from '@/stores/installCoachStore';

type UseInstallCoachOptions = {
  enableAutoPrompt?: boolean;
};

export function useInstallCoach({ enableAutoPrompt = true }: UseInstallCoachOptions = {}) {
  const platform = useInstallCoachStore((state) => state.platform);
  const isStandalone = useInstallCoachStore((state) => state.isStandalone);
  const canNativeInstall = useInstallCoachStore((state) => state.canNativeInstall);
  const hasSeenCoach = useInstallCoachStore((state) => state.hasSeenCoach);
  const dismissed = useInstallCoachStore((state) => state.dismissed);
  const installed = useInstallCoachStore((state) => state.installed);
  const isOpen = useInstallCoachStore((state) => state.isOpen);
  const hasHydrated = useInstallCoachStore((state) => state.hasHydrated);
  const setRuntimeState = useInstallCoachStore((state) => state.setRuntimeState);
  const openCoach = useInstallCoachStore((state) => state.openCoach);
  const closeCoach = useInstallCoachStore((state) => state.closeCoach);
  const dismissCoach = useInstallCoachStore((state) => state.dismissCoach);
  const markInstalled = useInstallCoachStore((state) => state.markInstalled);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    // main.tsx starts this at app launch; calling it again is harmless and
    // covers tests and any entry point that skipped it.
    startInstallPromptCapture();

    const syncRuntimeState = () => {
      const standalone = isInstallCoachStandalone();

      setRuntimeState({
        platform: getInstallCoachPlatform(),
        isStandalone: standalone,
        canNativeInstall: getDeferredInstallPrompt() !== null,
      });

      if (standalone) {
        markInstalled();
      }
    };

    syncRuntimeState();

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    mediaQuery?.addEventListener('change', syncRuntimeState);

    const unsubscribe = subscribeInstallPrompt((change) => {
      if (change === 'installed') {
        setRuntimeState({ canNativeInstall: false, isStandalone: true });
        markInstalled();
        return;
      }

      syncRuntimeState();
    });

    return () => {
      mediaQuery?.removeEventListener('change', syncRuntimeState);
      unsubscribe();
    };
  }, [markInstalled, setRuntimeState]);

  const isEligible = useMemo(
    () => hasHydrated && isInstallCoachEligiblePlatform(platform) && !isStandalone && !installed,
    [hasHydrated, installed, isStandalone, platform],
  );

  useEffect(() => {
    if (!enableAutoPrompt || !isEligible || isOpen || hasSeenCoach || dismissed) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      openCoach();
    }, INSTALL_COACH_OPEN_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dismissed, enableAutoPrompt, hasSeenCoach, isEligible, isOpen, openCoach]);

  const promptNativeInstall = useCallback(async () => {
    const deferredPrompt = getDeferredInstallPrompt();

    if (!deferredPrompt) {
      return false;
    }

    clearDeferredInstallPrompt();
    setRuntimeState({ canNativeInstall: false });

    await deferredPrompt.prompt();
    const userChoice = await deferredPrompt.userChoice;

    if (userChoice.outcome === 'accepted') {
      markInstalled();
      return true;
    }

    dismissCoach();
    return false;
  }, [dismissCoach, markInstalled, setRuntimeState]);

  return {
    canNativeInstall,
    closeCoach,
    dismissCoach,
    hasHydrated,
    hasSeenCoach,
    installed,
    isEligible,
    isOpen,
    isStandalone,
    markInstalled,
    openCoach,
    platform,
    promptNativeInstall,
  };
}
