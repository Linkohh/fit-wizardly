import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  CONSENT_RESOLVED_EVENT,
  CRASH_REPORTS_CONSENT_STORAGE_KEY,
} from '@/lib/consent';

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  close: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@sentry/browser', () => sentry);

const DSN = 'https://public@o1.ingest.de.sentry.io/1';

// The module keeps "started" state, so each test loads a fresh copy.
async function loadMonitoring() {
  vi.resetModules();
  return import('./monitoring');
}

/** Lets the dynamic import of @sentry/react settle. */
async function flush() {
  await vi.dynamicImportSettled();
  await Promise.resolve();
}

describe('monitoring', () => {
  const addedListeners: Array<[string, EventListenerOrEventListenerObject]> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const original = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      addedListeners.push([type, listener]);
      original(type, listener, options);
    });
  });

  afterEach(() => {
    for (const [type, listener] of addedListeners.splice(0)) {
      window.removeEventListener(type, listener);
    }
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('initMonitoring', () => {
    it('does nothing without a DSN, even with consent', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', '');
      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      const { initMonitoring } = await loadMonitoring();

      initMonitoring();
      await flush();

      expect(sentry.init).not.toHaveBeenCalled();
      expect(addedListeners.some(([type]) => type === CONSENT_RESOLVED_EVENT)).toBe(false);
    });

    it('does not init with a DSN but no consent', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      const { initMonitoring } = await loadMonitoring();

      initMonitoring();
      await flush();

      expect(sentry.init).not.toHaveBeenCalled();
    });

    it('inits with a DSN and consent, errors only and no personal data', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      const { initMonitoring } = await loadMonitoring();

      initMonitoring();
      await flush();

      expect(sentry.init).toHaveBeenCalledTimes(1);
      expect(sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: DSN,
          release: __APP_VERSION__,
          environment: import.meta.env.MODE,
          tracesSampleRate: 0,
          dataCollection: expect.objectContaining({
            userInfo: false,
            cookies: false,
            httpHeaders: false,
            httpBodies: [],
            urlQueryParams: false,
          }),
        }),
      );
    });

    it('ignores the analytics opt-in: crash reports have their own consent', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
      const { initMonitoring } = await loadMonitoring();

      initMonitoring();
      await flush();

      expect(sentry.init).not.toHaveBeenCalled();
    });

    it('calls Sentry.close() as soon as consent is withdrawn, and can start again', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      const { initMonitoring, captureError } = await loadMonitoring();
      initMonitoring();
      await flush();
      expect(sentry.init).toHaveBeenCalledTimes(1);

      window.localStorage.removeItem(CRASH_REPORTS_CONSENT_STORAGE_KEY);
      window.dispatchEvent(new Event(CONSENT_RESOLVED_EVENT));
      await flush();

      expect(sentry.close).toHaveBeenCalledTimes(1);
      captureError(new Error('after revoke'));
      expect(sentry.captureException).not.toHaveBeenCalled();

      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      window.dispatchEvent(new Event(CONSENT_RESOLVED_EVENT));
      await flush();

      expect(sentry.init).toHaveBeenCalledTimes(2);
    });

    it('does not init if consent is withdrawn while the SDK is loading', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      const { initMonitoring } = await loadMonitoring();

      initMonitoring();
      window.localStorage.removeItem(CRASH_REPORTS_CONSENT_STORAGE_KEY);
      window.dispatchEvent(new Event(CONSENT_RESOLVED_EVENT));
      await flush();

      expect(sentry.init).not.toHaveBeenCalled();
    });

    it('follows a revoke made in another tab', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      const { initMonitoring } = await loadMonitoring();
      initMonitoring();
      await flush();

      window.localStorage.removeItem(CRASH_REPORTS_CONSENT_STORAGE_KEY);
      window.dispatchEvent(new StorageEvent('storage', { key: CRASH_REPORTS_CONSENT_STORAGE_KEY }));
      await flush();

      expect(sentry.close).toHaveBeenCalledTimes(1);
    });

    // Starting after a later opt-in is covered through the real ConsentModal in
    // monitoring.consent.test.tsx, so the storage/event order matches the app.

    it('initialises only once', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      const { initMonitoring } = await loadMonitoring();

      initMonitoring();
      initMonitoring();
      await flush();
      window.dispatchEvent(new Event(CONSENT_RESOLVED_EVENT));
      await flush();

      expect(sentry.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('captureError', () => {
    it('logs to the console when Sentry is not running', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', '');
      const { captureError } = await loadMonitoring();
      const error = new Error('boom');

      captureError(error, { where: 'test' });

      expect(sentry.captureException).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('[monitoring]', error, { where: 'test' });
    });

    it('forwards to Sentry once initialised', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      const { captureError, initMonitoring } = await loadMonitoring();
      initMonitoring();
      await flush();
      const error = new Error('boom');

      captureError(error, { componentStack: 'at Plan' });

      expect(sentry.captureException).toHaveBeenCalledWith(error, { extra: { componentStack: 'at Plan' } });
    });
  });

  describe('scrubbing', () => {
    it('drops the whole event in beforeSend once consent is gone', async () => {
      const { scrubEvent } = await loadMonitoring();

      expect(scrubEvent({ type: undefined, message: 'boom' })).toBeNull();
    });

    it('strips query strings and health-looking extras in beforeSend', async () => {
      window.localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
      const { scrubEvent } = await loadMonitoring();

      const result = scrubEvent({
        type: undefined,
        request: { url: 'https://app.example/plan?weight=80#top', query_string: 'weight=80' },
        extra: { componentStack: 'at Plan', bodyWeightKg: 80, waist: 81, foodName: 'oats', mealId: 'm1' },
        breadcrumbs: [{ category: 'fetch', data: { url: 'https://api.example/foods?q=oats' } }],
      });

      expect(result).not.toBeNull();
      expect(result?.request?.url).toBe('https://app.example/plan');
      expect(result?.request).not.toHaveProperty('query_string');
      expect(result?.extra).toEqual({ componentStack: 'at Plan' });
      expect(result?.breadcrumbs?.[0]?.data?.url).toBe('https://api.example/foods');
    });

    it('drops console breadcrumbs and trims navigation URLs', async () => {
      const { scrubBreadcrumb } = await loadMonitoring();

      expect(scrubBreadcrumb({ category: 'console', message: 'weight 80' })).toBeNull();
      expect(
        scrubBreadcrumb({ category: 'navigation', data: { from: '/plan?x=1', to: '/nutrition?date=2026-11-18' } })?.data,
      ).toEqual({ from: '/plan', to: '/nutrition' });
    });
  });
});
