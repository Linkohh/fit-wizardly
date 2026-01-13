import { useCallback, useRef } from 'react';
import { useAnalyticsStore } from '@/stores/analyticsStore';

/**
 * Hook for tracking analytics events in components.
 * All tracking respects user consent - no events are tracked without consent.
 */
export function useAnalytics() {
    const { hasConsented, trackEvent, trackPageView, trackTiming } = useAnalyticsStore();

    // Store timing start for performance tracking
    const timingStart = useRef<Map<string, number>>(new Map());

    /**
     * Track a custom event
     */
    const track = useCallback((name: string, properties?: Record<string, unknown>) => {
        trackEvent(name, properties);
    }, [trackEvent]);

    /**
     * Track a button click
     */
    const trackClick = useCallback((buttonName: string, properties?: Record<string, unknown>) => {
        trackEvent('click', { button: buttonName, ...properties });
    }, [trackEvent]);

    /**
     * Track form submission
     */
    const trackFormSubmit = useCallback((formName: string, properties?: Record<string, unknown>) => {
        trackEvent('form_submit', { form: formName, ...properties });
    }, [trackEvent]);

    /**
     * Start timing an operation
     */
    const startTiming = useCallback((name: string) => {
        timingStart.current.set(name, performance.now());
    }, []);

    /**
     * End timing and track the duration
     */
    const endTiming = useCallback((name: string) => {
        const start = timingStart.current.get(name);
        if (start) {
            const duration = performance.now() - start;
            trackTiming(name, Math.round(duration));
            timingStart.current.delete(name);
        }
    }, [trackTiming]);

    /**
     * Track wizard step completion
     */
    const trackWizardStep = useCallback((step: string, properties?: Record<string, unknown>) => {
        trackEvent('wizard_step_completed', { step, ...properties });
    }, [trackEvent]);

    /**
     * Track feature usage
     */
    const trackFeature = useCallback((feature: string, action: string, properties?: Record<string, unknown>) => {
        trackEvent('feature_usage', { feature, action, ...properties });
    }, [trackEvent]);

    return {
        // State
        hasConsented,

        // Core tracking
        track,
        trackPageView,
        trackClick,
        trackFormSubmit,

        // Timing
        startTiming,
        endTiming,

        // Specialized tracking
        trackWizardStep,
        trackFeature,
    };
}
