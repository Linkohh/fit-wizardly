/**
 * Product analytics (contract #9, roadmap 3.2, decision D5: PostHog, EU region).
 *
 * PostHog is opt-in and lazy:
 * - track() does nothing unless VITE_POSTHOG_KEY is set AND the user has opted in
 *   (`fitwizard_analytics_consent` in src/lib/consent.ts, the same key crash reports use).
 * - The SDK is loaded with a dynamic import on the first allowed event, so it never sits
 *   in the startup bundle. With no key at build time, Vite inlines the empty value and
 *   the import is dropped as dead code.
 * - Only allow-listed property keys with primitive values are sent. This is the guard
 *   against health values (weights, reps, body data, meals) leaving the device.
 * - Page URLs lose their query string and hash, and id-like path segments are masked.
 */
import type { CaptureResult, PostHog, PostHogConfig } from 'posthog-js';
import { hasAnalyticsConsent } from '@/lib/consent';
import { getNativePlatform } from '@/lib/platform';

export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'wizard_step_completed'
  | 'plan_generated'
  | 'workout_started'
  | 'workout_completed'
  | 'meal_logged'
  | 'signed_in'
  | 'account_deleted'
  | '$pageview';

export type AnalyticsProps = Record<string, string | number | boolean>;

/** The only property keys that may leave the device. Anything else is dropped. */
export const ALLOWED_PROP_KEYS = [
  'step',
  'goal',
  'days_per_week',
  'exercise_count',
  'duration_min',
  'source',
  'platform',
] as const;

const ALLOWED_KEY_SET: ReadonlySet<string> = new Set(ALLOWED_PROP_KEYS);

/** PostHog EU cloud. Keep in step with `connect-src` in vercel.json. */
export const POSTHOG_API_HOST = 'https://eu.i.posthog.com';

/** Events sent before the SDK finishes loading wait here (bounded). */
const MAX_PENDING_EVENTS = 50;

let client: PostHog | null = null;
let loading: Promise<void> | null = null;
let pending: Array<{ event: AnalyticsEvent; props: AnalyticsProps }> = [];

function readKey(): string {
  const value = import.meta.env.VITE_POSTHOG_KEY;
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Keeps allow-listed keys whose values are strings, finite numbers or booleans.
 * Strings are capped at 64 characters so free text can't ride along.
 */
export function sanitizeProps(props: Record<string, unknown> | undefined): AnalyticsProps {
  const safe: AnalyticsProps = {};
  if (!props) {
    return safe;
  }

  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_KEY_SET.has(key)) {
      continue;
    }
    if (typeof value === 'string') {
      safe[key] = value.slice(0, 64);
    } else if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      safe[key] = value;
    }
  }

  return safe;
}

const ID_SEGMENT = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{4,}|[A-Za-z0-9_-]{20,})$/i;

/** Drops `?query` and `#hash`, and replaces id-like path segments with `:id`. */
export function scrubUrl(url: string): string {
  const cut = url.search(/[?#]/);
  const base = cut === -1 ? url : url.slice(0, cut);
  const originEnd = base.indexOf('://') === -1 ? 0 : base.indexOf('/', base.indexOf('://') + 3);
  if (originEnd === -1) {
    return base;
  }

  const origin = base.slice(0, originEnd);
  const path = base
    .slice(originEnd)
    .split('/')
    .map((segment) => (ID_SEGMENT.test(segment) ? ':id' : segment))
    .join('/');
  return origin + path;
}

const URL_PROPERTY_KEYS = [
  '$current_url',
  '$pathname',
  '$referrer',
  '$initial_current_url',
  '$initial_referrer',
  '$initial_pathname',
];

function scrubUrlProperties(properties: Record<string, unknown> | undefined): void {
  if (!properties) {
    return;
  }
  for (const key of URL_PROPERTY_KEYS) {
    const value = properties[key];
    if (typeof value === 'string') {
      properties[key] = scrubUrl(value);
    }
  }
}

/** PostHog `before_send`: last check that consent still holds, then URL scrubbing. */
export function scrubCapture(result: CaptureResult | null): CaptureResult | null {
  if (!result || !hasAnalyticsConsent()) {
    return null;
  }

  scrubUrlProperties(result.properties);
  scrubUrlProperties(result.$set);
  scrubUrlProperties(result.$set_once);
  return result;
}

/** The PostHog options. Exported for tests. */
export function buildPostHogConfig(): Partial<PostHogConfig> {
  return {
    api_host: POSTHOG_API_HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    capture_performance: false,
    rageclick: false,
    persistence: 'localStorage',
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    // Our CSP only allows scripts from 'self'; never fetch PostHog's remote extensions.
    disable_external_dependency_loading: true,
    // No feature flags are used, so skip the /flags request.
    advanced_disable_flags: true,
    // Anonymous events only: no person profiles, and identify() is never called.
    person_profiles: 'never',
    mask_personal_data_properties: true,
    before_send: scrubCapture,
  };
}

function flushPending(): void {
  if (!client) {
    return;
  }
  const queued = pending;
  pending = [];
  for (const { event, props } of queued) {
    client.capture(event, props);
  }
}

function loadClient(): void {
  if (client || loading) {
    return;
  }

  loading = import('posthog-js')
    .then(({ default: posthog }) => {
      // Consent may have been withdrawn while the SDK was loading.
      if (!hasAnalyticsConsent()) {
        pending = [];
        loading = null;
        return;
      }
      posthog.init(readKey(), buildPostHogConfig());
      client = posthog;
      flushPending();
    })
    .catch((error: unknown) => {
      // Allow a later event to try again (for example after a network blip).
      loading = null;
      pending = [];
      console.error('[analytics] Failed to load PostHog:', error);
    });
}

/**
 * Sends a product event. No-op without VITE_POSTHOG_KEY or analytics consent.
 * Never pass health values (weights, body measurements, readiness, food): only the
 * keys in ALLOWED_PROP_KEYS are sent, and everything else is dropped.
 */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (typeof window === 'undefined' || !readKey() || !hasAnalyticsConsent()) {
    return;
  }

  try {
    const safeProps: AnalyticsProps = { platform: getNativePlatform(), ...sanitizeProps(props) };
    if (client) {
      client.capture(event, safeProps);
      return;
    }

    if (pending.length < MAX_PENDING_EVENTS) {
      pending.push({ event, props: safeProps });
    }
    loadClient();
  } catch (error) {
    // Analytics must never break the app.
    console.error('[analytics] track failed:', error);
  }
}

/** Tests only: forget the loaded client and any queued events. */
export function resetAnalyticsForTests(): void {
  client = null;
  loading = null;
  pending = [];
}

/** Tests only: resolves once a pending SDK load has finished. */
export function analyticsLoadingForTests(): Promise<void> | null {
  return loading;
}
