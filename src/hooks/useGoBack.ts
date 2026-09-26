import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UseGoBackResult {
  /** Steps back through in-app history, or goes to `fallbackPath` when this is the first in-app page. */
  goBack: () => void;
  /** Whether there is an in-app page to return to. */
  canGoBack: boolean;
}

/**
 * Safe "back" for buttons and gestures. React Router gives the entry the app was opened on
 * the key "default"; stepping back from there would leave the app (or do nothing in a
 * native WebView), so we fall back to a known page instead.
 */
export function useGoBack(fallbackPath = '/'): UseGoBackResult {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.key !== 'default';

  const goBack = useCallback(() => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  }, [canGoBack, fallbackPath, navigate]);

  return { goBack, canGoBack };
}
