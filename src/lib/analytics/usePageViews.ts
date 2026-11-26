import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics/track';
import { useAnalyticsConsent } from '@/lib/analytics/useAnalyticsConsent';

/**
 * Sends one `$pageview` per route change (PostHog's own pageview capture is off).
 * PostHog reads the URL itself; `before_send` strips query strings and masks ids.
 *
 * The consent modal opens on the first page, so the effect also re-runs when consent
 * turns on: the page the user opted in on is counted once. Before consent, `track()`
 * sends nothing. Must be called inside a router.
 */
export function usePageViews(): void {
  const { pathname } = useLocation();
  const consented = useAnalyticsConsent();

  useEffect(() => {
    if (consented) {
      track('$pageview');
    }
  }, [pathname, consented]);
}
