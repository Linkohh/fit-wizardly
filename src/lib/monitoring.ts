/**
 * Crash reporting (contract #8, roadmap 3.1).
 *
 * Sentry is opt-in and lazy:
 * - Nothing happens unless VITE_SENTRY_DSN is set AND the user has consented.
 * - The SDK is loaded with a dynamic import, so it never sits in the startup bundle.
 * - Until Day 5 adds a separate crash-reports toggle, consent is the analytics
 *   consent key in src/lib/consent.ts (`fitwizard_analytics_consent`).
 *
 * captureError() is always safe to call. Before Sentry is ready (or when it never
 * starts) it falls back to console.error.
 */
import { CONSENT_RESOLVED_EVENT, hasAnalyticsConsent } from '@/lib/consent';

type SentryModule = typeof import('@sentry/react');
type SentryEvent = Parameters<NonNullable<Parameters<SentryModule['init']>[0]>['beforeSend'] & object>[0];
type SentryBreadcrumb = Parameters<
  NonNullable<NonNullable<Parameters<SentryModule['init']>[0]>['beforeBreadcrumb']>
>[0];

let sentry: SentryModule | null = null;
let loading: Promise<void> | null = null;
let listening = false;

/**
 * `extra` keys that may carry health or body data. Matching keys are dropped
 * before an event leaves the device.
 */
const HEALTH_KEY_PATTERN =
  /weight|kg|lbs|bodyfat|body_fat|measure|waist|chest|hips?\b|bicep|thigh|neck|height|bmi|calorie|kcal|macro|protein|carb|fat|food|meal|nutrition|diet|heart|pulse|sleep|injur|pain|medical|health/i;

function readDsn(): string {
  const value = import.meta.env.VITE_SENTRY_DSN;
  return typeof value === 'string' ? value.trim() : '';
}

/** Removes `?query` and `#hash` from a URL-like string. */
export function stripQueryString(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

/** Returns a copy of `extra` without keys that look like health data. */
export function scrubExtra(extra: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!extra) {
    return extra;
  }

  return Object.fromEntries(Object.entries(extra).filter(([key]) => !HEALTH_KEY_PATTERN.test(key)));
}

/** Sentry `beforeSend`: strips query strings and health-looking extras. */
export function scrubEvent(event: SentryEvent): SentryEvent {
  const scrubbed: SentryEvent = { ...event };

  if (scrubbed.request) {
    const { query_string: _queryString, cookies: _cookies, ...request } = scrubbed.request;
    scrubbed.request = {
      ...request,
      url: request.url ? stripQueryString(request.url) : request.url,
    };
  }

  if (scrubbed.extra) {
    scrubbed.extra = scrubExtra(scrubbed.extra);
  }

  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map(scrubBreadcrumbData);
  }

  return scrubbed;
}

function scrubBreadcrumbData(breadcrumb: SentryBreadcrumb): SentryBreadcrumb {
  if (!breadcrumb.data) {
    return breadcrumb;
  }

  const data: Record<string, unknown> = { ...breadcrumb.data };
  for (const key of ['url', 'from', 'to']) {
    if (typeof data[key] === 'string') {
      data[key] = stripQueryString(data[key] as string);
    }
  }

  return { ...breadcrumb, data };
}

/**
 * Sentry `beforeBreadcrumb`: console breadcrumbs can echo app state (weights,
 * meals), so they are dropped. URL breadcrumbs lose their query strings.
 */
export function scrubBreadcrumb(breadcrumb: SentryBreadcrumb): SentryBreadcrumb | null {
  if (breadcrumb.category === 'console') {
    return null;
  }

  return scrubBreadcrumbData(breadcrumb);
}

function startSentry(): void {
  if (sentry || loading || !readDsn() || !hasAnalyticsConsent()) {
    return;
  }

  loading = import('@sentry/react')
    .then((module) => {
      module.init({
        dsn: readDsn(),
        release: __APP_VERSION__,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0,
        sendDefaultPii: false,
        beforeSend: (event) => scrubEvent(event),
        beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
      });
      sentry = module;
    })
    .catch((error: unknown) => {
      // Allow a later consent event to try again (for example after a network blip).
      loading = null;
      console.error('[monitoring] Failed to load crash reporting:', error);
    });
}

/** No-op unless VITE_SENTRY_DSN is set AND the user consented. */
export function initMonitoring(): void {
  if (typeof window === 'undefined' || !readDsn()) {
    return;
  }

  if (!listening) {
    listening = true;
    window.addEventListener(CONSENT_RESOLVED_EVENT, startSentry);
  }

  startSentry();
}

/** Always safe to call. Forwards to Sentry once it is running, otherwise logs. */
export function captureError(error: unknown, context?: Record<string, string>): void {
  if (sentry) {
    try {
      sentry.captureException(error, context ? { extra: context } : undefined);
      return;
    } catch {
      // Fall through to the console so the error is never lost.
    }
  }

  console.error('[monitoring]', error, context ?? '');
}
