import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNativePlatform } from '@/lib/platform';

/**
 * Routes the Android system back gesture/button through in-app history.
 * On the first in-app page (or Home) it minimizes the app, matching platform convention,
 * instead of closing it.
 */
export function useAndroidBackButton(): void {
  const navigate = useNavigate();
  const location = useLocation();
  const stateRef = useRef({ canGoBack: false, isHome: true });

  useEffect(() => {
    stateRef.current = {
      canGoBack: location.key !== 'default',
      isHome: location.pathname === '/',
    };
  }, [location.key, location.pathname]);

  useEffect(() => {
    if (getNativePlatform() !== 'android') return;

    let removeListener: (() => void) | undefined;
    let isCancelled = false;

    void import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('backButton', () => {
          const { canGoBack, isHome } = stateRef.current;
          if (canGoBack) {
            navigate(-1);
          } else if (!isHome) {
            navigate('/', { replace: true });
          } else {
            void App.minimizeApp();
          }
        })
      )
      .then((handle) => {
        if (isCancelled) {
          void handle.remove();
        } else {
          removeListener = () => void handle.remove();
        }
      })
      .catch((error: unknown) => {
        console.error('[AndroidBack] Failed to register back button listener:', error);
      });

    return () => {
      isCancelled = true;
      removeListener?.();
    };
  }, [navigate]);
}
