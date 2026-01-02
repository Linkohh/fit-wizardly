// Analytics utility for tracking wizard completion funnel
// Stub implementation - logs to console in dev, can be connected to external service

type AnalyticsEvent =
    | 'step_enter'
    | 'step_exit'
    | 'wizard_complete'
    | 'plan_generated'
    | 'plan_exported';

interface EventMetadata {
    stepName?: string;
    stepIndex?: number;
    experienceLevel?: string;
    goal?: string;
    daysPerWeek?: number;
    muscleCount?: number;
    equipmentCount?: number;
    duration?: number;
    [key: string]: string | number | boolean | undefined;
}

// Configuration
const ANALYTICS_CONFIG = {
    enabled: import.meta.env.DEV, // Only log in development for now
    endpoint: null as string | null, // Set to external endpoint when ready
};

// Track an analytics event
export function trackEvent(event: AnalyticsEvent, metadata: EventMetadata = {}) {
    if (!ANALYTICS_CONFIG.enabled) return;

    const payload = {
        event,
        timestamp: new Date().toISOString(),
        metadata,
        sessionId: getSessionId(),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
        console.log('[Analytics]', event, metadata);
    }

    // Send to external endpoint if configured
    if (ANALYTICS_CONFIG.endpoint) {
        fetch(ANALYTICS_CONFIG.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(() => {
            // Silently fail - analytics should never break the app
        });
    }
}

// Track step transitions
export function trackStepEnter(stepName: string, stepIndex: number) {
    trackEvent('step_enter', { stepName, stepIndex });
}

export function trackStepExit(stepName: string, stepIndex: number, duration: number) {
    trackEvent('step_exit', { stepName, stepIndex, duration });
}

export function trackWizardComplete(metadata: EventMetadata) {
    trackEvent('wizard_complete', metadata);
}

export function trackPlanGenerated(metadata: EventMetadata) {
    trackEvent('plan_generated', metadata);
}

export function trackPlanExported() {
    trackEvent('plan_exported');
}

// Session management
function getSessionId(): string {
    const key = 'fitwizard_session_id';
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
}

// Funnel analysis helper
export function createFunnelTracker() {
    const stepTimes: Record<string, number> = {};

    return {
        enterStep(stepName: string, stepIndex: number) {
            stepTimes[stepName] = Date.now();
            trackStepEnter(stepName, stepIndex);
        },

        exitStep(stepName: string, stepIndex: number) {
            const enterTime = stepTimes[stepName];
            const duration = enterTime ? Date.now() - enterTime : 0;
            trackStepExit(stepName, stepIndex, duration);
        },
    };
}
