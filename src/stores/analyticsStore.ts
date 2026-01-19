import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Analytics event types
export interface AnalyticsEvent {
    id: string;
    name: string;
    properties?: Record<string, unknown>;
    timestamp: Date;
    sessionId: string;
}

// Generate unique IDs using cryptographically secure random values
const generateId = () => crypto.randomUUID();

interface AnalyticsState {
    // Consent
    hasConsented: boolean;

    // Session tracking
    sessionId: string;
    sessionStart: Date | null;

    // Event queue (batch send)
    eventQueue: AnalyticsEvent[];

    // Page view tracking
    lastPageView: string | null;
    pageViewCount: number;

    // Actions
    setConsent: (consent: boolean) => void;
    startSession: () => void;
    trackEvent: (name: string, properties?: Record<string, unknown>) => void;
    trackPageView: (path: string) => void;
    trackTiming: (name: string, durationMs: number) => void;
    flushEvents: () => Promise<void>;
    clearEvents: () => void;

    // Helpers
    getSessionDuration: () => number | null;
}

export const useAnalyticsStore = create<AnalyticsState>()(
    persist(
        (set, get) => ({
            hasConsented: false,
            sessionId: generateId(),
            sessionStart: null,
            eventQueue: [],
            lastPageView: null,
            pageViewCount: 0,

            setConsent: (hasConsented) => set({ hasConsented }),

            startSession: () => {
                set({
                    sessionId: generateId(),
                    sessionStart: new Date(),
                    pageViewCount: 0,
                });
            },

            trackEvent: (name, properties) => {
                const { hasConsented, sessionId } = get();

                // Don't track without consent
                if (!hasConsented) return;

                const event: AnalyticsEvent = {
                    id: generateId(),
                    name,
                    properties,
                    timestamp: new Date(),
                    sessionId,
                };

                set((state) => ({
                    eventQueue: [...state.eventQueue, event],
                }));
            },

            trackPageView: (path) => {
                const { hasConsented, trackEvent, lastPageView } = get();

                if (!hasConsented) return;

                // Avoid duplicate page views
                if (path === lastPageView) return;

                trackEvent('page_view', { path });

                set((state) => ({
                    lastPageView: path,
                    pageViewCount: state.pageViewCount + 1,
                }));
            },

            trackTiming: (name, durationMs) => {
                const { trackEvent } = get();
                trackEvent('timing', { name, duration_ms: durationMs });
            },

            flushEvents: async () => {
                const { eventQueue, hasConsented } = get();

                if (!hasConsented || eventQueue.length === 0) return;

                // In production, send to analytics backend (PostHog, etc.)
                // For now, log to console in development
                if (import.meta.env.DEV) {
                    console.log('[Analytics] Flushing events:', eventQueue.length);
                    eventQueue.forEach((event) => {
                        console.log(`  [${event.name}]`, event.properties);
                    });
                }

                // TODO: Send to PostHog or custom backend
                // await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(eventQueue) });

                // Clear queue after successful send
                set({ eventQueue: [] });
            },

            clearEvents: () => set({ eventQueue: [] }),

            getSessionDuration: () => {
                const { sessionStart } = get();
                if (!sessionStart) return null;
                return Date.now() - new Date(sessionStart).getTime();
            },
        }),
        {
            name: 'fitwizard-analytics',
            partialize: (state) => ({
                hasConsented: state.hasConsented,
                // Don't persist event queue - it's transient
            }),
        }
    )
);

// Selector hooks
export const useHasAnalyticsConsent = () => useAnalyticsStore((state) => state.hasConsented);
