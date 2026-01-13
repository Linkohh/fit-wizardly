import { useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalyticsStore } from '@/stores/analyticsStore';

interface AnalyticsProviderProps {
    children: ReactNode;
}

/**
 * Provider component that handles automatic analytics tracking.
 * - Starts session on mount
 * - Tracks page views on route changes
 * - Flushes events on visibility change (tab close/hide)
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
    const location = useLocation();
    const { startSession, trackPageView, flushEvents, hasConsented } = useAnalyticsStore();

    // Start session on mount
    useEffect(() => {
        startSession();
    }, [startSession]);

    // Track page views on route change
    useEffect(() => {
        if (hasConsented) {
            trackPageView(location.pathname);
        }
    }, [location.pathname, trackPageView, hasConsented]);

    // Flush events on visibility change (user leaving)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                flushEvents();
            }
        };

        const handleBeforeUnload = () => {
            flushEvents();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [flushEvents]);

    return <>{children}</>;
}
