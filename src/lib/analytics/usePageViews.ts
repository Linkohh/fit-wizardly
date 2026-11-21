import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics/track';

/**
 * Sends one `$pageview` per route change (PostHog's own pageview capture is off).
 * PostHog reads the URL itself; `before_send` strips query strings and masks ids.
 * Must be called inside a router.
 */
export function usePageViews(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    track('$pageview');
  }, [pathname]);
}
