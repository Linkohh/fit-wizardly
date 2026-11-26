import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { track, type AnalyticsEvent, type AnalyticsProps } from '@/lib/analytics/track';

/**
 * Thin wrapper over `track()` (contract #9). Events are no longer queued here:
 * they go straight to `track()`, which checks consent, the PostHog key and the
 * property allow-list. Prefer importing `track` from `@/lib/analytics/track`.
 *
 * `hasConsented` is a legacy copy of the analytics opt-in. The source of truth is
 * `fitwizard_analytics_consent` in src/lib/consent.ts (read it with
 * `hasAnalyticsConsent()` or `useAnalyticsConsent()`). This persisted copy is
 * retired on Lane C Day 5 (DEBT-061).
 */
interface AnalyticsState {
    hasConsented: boolean;
    setConsent: (consent: boolean) => void;
    trackEvent: (name: AnalyticsEvent, properties?: AnalyticsProps) => void;
    trackPageView: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
    persist(
        (set) => ({
            hasConsented: false,

            setConsent: (hasConsented) => set({ hasConsented }),

            trackEvent: (name, properties) => track(name, properties),

            trackPageView: () => track('$pageview'),
        }),
        {
            name: 'fitwizard-analytics',
            partialize: (state) => ({
                hasConsented: state.hasConsented,
            }),
        }
    )
);
