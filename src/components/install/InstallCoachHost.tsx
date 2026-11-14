import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useInstallCoachAutoPromptReady } from '@/hooks/use-install-coach-auto-prompt-ready';
import { shouldAutoPromptInstallCoach } from '@/lib/install-coach';
import { isNativeApp } from '@/lib/platform';
import { useInstallCoachStore } from '@/stores/installCoachStore';
import { usePlanStore } from '@/stores/planStore';
import { InstallCoachSheet } from './InstallCoachSheet';

export const INSTALL_COACH_VISIT_SESSION_KEY = 'fitwizard-install-coach-visit';

/** Counts this browser session as one visit, once, however often the app re-mounts. */
function recordVisitOncePerSession(): void {
  try {
    if (window.sessionStorage.getItem(INSTALL_COACH_VISIT_SESSION_KEY)) {
      return;
    }
    window.sessionStorage.setItem(INSTALL_COACH_VISIT_SESSION_KEY, '1');
  } catch {
    // Storage blocked (private mode): skip counting rather than count every mount.
    return;
  }

  useInstallCoachStore.getState().recordVisit();
}

/**
 * App-wide home for the Add to Home Screen prompt, so the menu entry works on
 * every page and the prompt can open at a good moment instead of on first load.
 */
export function InstallCoachHost() {
  const { pathname } = useLocation();
  const hasHydrated = useInstallCoachStore((state) => state.hasHydrated);
  const visitCount = useInstallCoachStore((state) => state.visitCount);
  const hasPlan = usePlanStore((state) => state.currentPlan !== null);
  const nativeApp = isNativeApp();

  useEffect(() => {
    if (hasHydrated && !nativeApp) {
      recordVisitOncePerSession();
    }
  }, [hasHydrated, nativeApp]);

  const autoPromptReady = useInstallCoachAutoPromptReady({
    engaged: shouldAutoPromptInstallCoach({ pathname, hasPlan, visitCount }),
  });

  if (nativeApp) {
    return null;
  }

  return <InstallCoachSheet enableAutoPrompt={autoPromptReady} />;
}
