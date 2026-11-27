import type { ComponentType } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestConsentModal } from '@/lib/consent';

/**
 * Crash reporting must follow the "Send crash reports" toggle in the same session,
 * driven by the real ConsentModal: it writes the consent keys before it fires
 * CONSENT_RESOLVED_EVENT, because monitoring reads storage when the event arrives.
 * It must ignore the analytics toggle (separate consent since Lane C Day 5).
 */

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  close: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@sentry/browser', () => sentry);

const DSN = 'https://public@o1.ingest.de.sentry.io/1';

const CRASH_LABEL = /Send crash reports/i;
const ANALYTICS_LABEL = /Share anonymous usage statistics/i;
const AGREE = /I Agree & Continue/i;

// Fresh copies of monitoring (module-level "started" state) and the modal, sharing one consent module.
async function loadModules() {
  vi.resetModules();
  const monitoring = await import('./monitoring');
  const { ConsentModal } = await import('@/components/legal/ConsentModal');
  return { ...monitoring, ConsentModal };
}

async function flush() {
  await vi.dynamicImportSettled();
  await Promise.resolve();
}

function renderModal(ConsentModal: ComponentType) {
  render(
    <MemoryRouter>
      <ConsentModal />
    </MemoryRouter>,
  );
}

async function agree(toggles: RegExp[]) {
  // The tray opens after a short delay on first visit.
  await screen.findByRole('button', { name: AGREE }, { timeout: 2000 });
  for (const label of toggles) {
    fireEvent.click(screen.getByRole('checkbox', { name: label }));
  }
  fireEvent.click(screen.getByRole('button', { name: AGREE }));
  await flush();
}

describe('crash reporting and the consent modal', () => {
  const addedListeners: Array<[string, EventListenerOrEventListenerObject]> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubEnv('VITE_SENTRY_DSN', DSN);
    const original = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      addedListeners.push([type, listener]);
      original(type, listener, options);
    });
  });

  afterEach(() => {
    // Each test loads a fresh monitoring module; drop the old copies' listeners.
    for (const [type, listener] of addedListeners.splice(0)) {
      window.removeEventListener(type, listener);
    }
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('starts Sentry without a reload when the user turns on crash reports', async () => {
    const { initMonitoring, ConsentModal } = await loadModules();

    initMonitoring();
    await flush();
    expect(sentry.init).not.toHaveBeenCalled();

    renderModal(ConsentModal);
    await agree([CRASH_LABEL]);

    expect(sentry.init).toHaveBeenCalledTimes(1);
  });

  it('stays off when the user agrees without opting in', async () => {
    const { initMonitoring, ConsentModal } = await loadModules();

    initMonitoring();
    renderModal(ConsentModal);
    await agree([]);

    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('stays off when only usage statistics are turned on', async () => {
    const { initMonitoring, ConsentModal } = await loadModules();

    initMonitoring();
    renderModal(ConsentModal);
    await agree([ANALYTICS_LABEL]);

    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('closes Sentry without a reload when crash reports are turned off in Privacy Settings', async () => {
    const { initMonitoring, captureError, ConsentModal } = await loadModules();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    initMonitoring();
    renderModal(ConsentModal);
    await agree([CRASH_LABEL]);
    expect(sentry.init).toHaveBeenCalledTimes(1);

    // Profile → Privacy Settings reopens the tray with the stored choices ticked.
    act(() => requestConsentModal());
    const crashToggle = await screen.findByRole('checkbox', { name: CRASH_LABEL });
    expect(crashToggle).toBeChecked();
    fireEvent.click(crashToggle);
    fireEvent.click(screen.getByRole('button', { name: AGREE }));
    await flush();

    expect(sentry.close).toHaveBeenCalledTimes(1);
    captureError(new Error('after revoke'));
    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});
