import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  canShareInstallShortcut,
  type DeferredInstallPromptEvent,
  getInstallCoachPlatform,
  INSTALL_COACH_OPEN_DELAY_MS,
  isInstallCoachEligiblePlatform,
  isInstallCoachStandalone,
} from '@/lib/install-coach';
import { useInstallCoachStore } from '@/stores/installCoachStore';

type UseInstallCoachOptions = {
  enableAutoPrompt?: boolean;
};

type InstallCoachShareResult = 'shared' | 'cancelled' | 'unsupported' | 'error';

function getShareResult(error: unknown): InstallCoachShareResult {
  if (
    error instanceof DOMException
    && error.name === 'AbortError'
  ) {
    return 'cancelled';
  }

  if (
    typeof error === 'object'
    && error !== null
    && 'name' in error
    && error.name === 'AbortError'
  ) {
    return 'cancelled';
  }

  return 'error';
}

export function useInstallCoach({ enableAutoPrompt = true }: UseInstallCoachOptions = {}) {
  const platform = useInstallCoachStore((state) => state.platform);
  const isStandalone = useInstallCoachStore((state) => state.isStandalone);
  const canNativeInstall = useInstallCoachStore((state) => state.canNativeInstall);
  const canShareShortcut = useInstallCoachStore((state) => state.canShareShortcut);
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

  const deferredPromptRef = useRef<DeferredInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncRuntimeState = () => {
      const nextPlatform = getInstallCoachPlatform();
      const standalone = isInstallCoachStandalone();

      setRuntimeState({
        platform: nextPlatform,
        isStandalone: standalone,
        canShareShortcut: canShareInstallShortcut(),
      });

      if (standalone) {
        markInstalled();
      }
    };

    syncRuntimeState();

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      syncRuntimeState();
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as DeferredInstallPromptEvent;
      promptEvent.preventDefault?.();
      deferredPromptRef.current = promptEvent;

      setRuntimeState({
        platform: getInstallCoachPlatform(),
        isStandalone: isInstallCoachStandalone(),
        canShareShortcut: canShareInstallShortcut(),
        canNativeInstall: true,
      });
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setRuntimeState({ canNativeInstall: false, isStandalone: true });
      markInstalled();
    };

    if (mediaQuery) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }

      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
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
    const deferredPrompt = deferredPromptRef.current;

    if (!deferredPrompt) {
      return false;
    }

    deferredPromptRef.current = null;
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

  const promptShareShortcut = useCallback(async () => {
    if (!canShareInstallShortcut()) {
      return 'unsupported' as const;
    }

    try {
      await navigator.share({
        title: 'FitWizard',
        text: 'Save FitWizard to your Home Screen for a cleaner app-style launch.',
        url: window.location.href,
      });
      return 'shared' as const;
    } catch (error) {
      return getShareResult(error);
    }
  }, []);

  return {
    canNativeInstall,
    canShareShortcut,
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
    promptShareShortcut,
    promptNativeInstall,
  };
}
