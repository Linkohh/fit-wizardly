import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CaptureResult } from 'posthog-js';
import { ANALYTICS_CONSENT_STORAGE_KEY } from '@/lib/consent';
import {
  ALLOWED_PROP_KEYS,
  POSTHOG_API_HOST,
  analyticsLoadingForTests,
  buildPostHogConfig,
  resetAnalyticsForTests,
  sanitizeProps,
  scrubCapture,
  scrubUrl,
  track,
} from './track';

const mocks = vi.hoisted(() => ({
  importCount: 0,
  posthog: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}));

vi.mock('posthog-js', () => {
  mocks.importCount += 1;
  return { default: mocks.posthog };
});

async function settle(): Promise<void> {
  await analyticsLoadingForTests();
}

function captureResult(properties: Record<string, unknown>): CaptureResult {
  return { uuid: 'u1', event: '$pageview', properties };
}

describe('track', () => {
  beforeEach(() => {
    resetAnalyticsForTests();
    mocks.posthog.init.mockClear();
    mocks.posthog.capture.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('does nothing and loads nothing without a key, even with consent', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '');
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');

    track('plan_generated', { goal: 'strength' });

    expect(analyticsLoadingForTests()).toBeNull();
    await settle();
    expect(mocks.posthog.init).not.toHaveBeenCalled();
    expect(mocks.posthog.capture).not.toHaveBeenCalled();
  });

  it('does nothing and loads nothing without consent', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');

    track('plan_generated', { goal: 'strength' });
    track('$pageview');

    expect(analyticsLoadingForTests()).toBeNull();
    await settle();
    expect(mocks.posthog.init).not.toHaveBeenCalled();
    expect(mocks.posthog.capture).not.toHaveBeenCalled();
  });

  it('never imports the SDK in the no-key and no-consent cases', () => {
    // The two tests above ran first; the mocked module factory never ran.
    expect(mocks.importCount).toBe(0);
  });

  it('initialises PostHog EU once with a key and consent, then sends queued events', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');

    track('wizard_step_completed', { step: 'goals' });
    track('plan_generated', { goal: 'strength', days_per_week: 4 });
    await settle();
    track('$pageview');

    expect(mocks.posthog.init).toHaveBeenCalledTimes(1);
    expect(mocks.posthog.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: POSTHOG_API_HOST,
        autocapture: false,
        capture_pageview: false,
        persistence: 'localStorage',
        disable_session_recording: true,
        disable_external_dependency_loading: true,
        person_profiles: 'never',
      }),
    );
    expect(mocks.posthog.capture.mock.calls).toEqual([
      ['wizard_step_completed', { platform: 'web', step: 'goals' }],
      ['plan_generated', { platform: 'web', goal: 'strength', days_per_week: 4 }],
      ['$pageview', { platform: 'web' }],
    ]);
  });

  it('strips health values and unknown keys before sending', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');

    track('workout_completed', {
      exercise_count: 5,
      duration_min: 42,
      weight: 100,
      reps: 8,
      body_fat: 18,
      calories: 2400,
      meal: 'oats',
      email: 'someone@example.com',
    });
    await settle();

    expect(mocks.posthog.capture).toHaveBeenCalledWith('workout_completed', {
      platform: 'web',
      exercise_count: 5,
      duration_min: 42,
    });
  });

  it('stops sending as soon as consent is withdrawn', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
    track('signed_in');
    await settle();
    mocks.posthog.capture.mockClear();

    localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
    track('meal_logged');

    expect(mocks.posthog.capture).not.toHaveBeenCalled();
    expect(scrubCapture(captureResult({ $current_url: 'https://fitwizard.app/' }))).toBeNull();
  });

  it('drops queued events if consent is withdrawn while the SDK loads', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
    track('signed_in');
    localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
    await settle();

    expect(mocks.posthog.init).not.toHaveBeenCalled();
    expect(mocks.posthog.capture).not.toHaveBeenCalled();
  });
});

describe('sanitizeProps', () => {
  it('keeps only allow-listed keys with primitive values', () => {
    expect(
      sanitizeProps({
        step: 'goals',
        goal: 'hypertrophy',
        days_per_week: 3,
        exercise_count: Number.NaN,
        source: { nested: true },
        platform: true,
        weight_kg: 80,
        notes: 'sore knee',
      }),
    ).toEqual({ step: 'goals', goal: 'hypertrophy', days_per_week: 3, platform: true });
  });

  it('caps string length', () => {
    expect(sanitizeProps({ source: 'x'.repeat(200) }).source).toHaveLength(64);
  });

  it('matches the contract allow-list', () => {
    expect([...ALLOWED_PROP_KEYS].sort()).toEqual(
      ['days_per_week', 'duration_min', 'exercise_count', 'goal', 'platform', 'source', 'step'].sort(),
    );
  });
});

describe('URL scrubbing', () => {
  it('drops query strings and hashes and masks id-like segments', () => {
    expect(scrubUrl('https://fitwizard.app/plan?weight=80#top')).toBe('https://fitwizard.app/plan');
    expect(scrubUrl('https://fitwizard.app/history/3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f')).toBe(
      'https://fitwizard.app/history/:id',
    );
    expect(scrubUrl('/circles/join/ABCDEFGHIJKLMNOPQRSTUV')).toBe('/circles/join/:id');
    expect(scrubUrl('https://fitwizard.app')).toBe('https://fitwizard.app');
  });

  it('scrubs URL properties in before_send', () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
    const result = scrubCapture({
      ...captureResult({
        $current_url: 'https://fitwizard.app/plan?code=abc',
        $referrer: 'https://example.com/?q=1',
        $pathname: '/plan',
      }),
      $set_once: { $initial_current_url: 'https://fitwizard.app/?utm=1' },
    });

    expect(result?.properties).toMatchObject({
      $current_url: 'https://fitwizard.app/plan',
      $referrer: 'https://example.com/',
      $pathname: '/plan',
    });
    expect(result?.$set_once).toEqual({ $initial_current_url: 'https://fitwizard.app/' });
    localStorage.clear();
  });

  it('wires the scrubber into the PostHog config', () => {
    expect(buildPostHogConfig().before_send).toBe(scrubCapture);
  });
});
