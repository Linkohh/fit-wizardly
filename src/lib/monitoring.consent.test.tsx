import type { ComponentType } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Crash reporting must start in the same session the user opts in, driven by
 * the real ConsentModal: it has to write the consent keys before it fires
 * CONSENT_RESOLVED_EVENT, because monitoring reads storage when the event arrives.
 */

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('@sentry/browser', () => sentry);

const DSN = 'https://public@o1.ingest.de.sentry.io/1';

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

async function openTrayAndAgree(ConsentModal: ComponentType, optIntoAnalytics: boolean) {
  render(
    <MemoryRouter>
      <ConsentModal />
    </MemoryRouter>,
  );

  // The tray opens after a short delay on first visit.
  await screen.findByRole('button', { name: /I Agree & Continue/i }, { timeout: 2000 });

  if (optIntoAnalytics) {
    fireEvent.click(screen.getByRole('checkbox', { name: /Help improve FitWizard/i }));
  }

  fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));
  await flush();
}

describe('crash reporting and the consent modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubEnv('VITE_SENTRY_DSN', DSN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('starts Sentry without a reload when the user opts in', async () => {
    const { initMonitoring, ConsentModal } = await loadModules();

    initMonitoring();
    await flush();
    expect(sentry.init).not.toHaveBeenCalled();

    await openTrayAndAgree(ConsentModal, true);

    expect(sentry.init).toHaveBeenCalledTimes(1);
  });

  it('stays off when the user agrees without opting in', async () => {
    const { initMonitoring, ConsentModal } = await loadModules();

    initMonitoring();
    await openTrayAndAgree(ConsentModal, false);

    expect(sentry.init).not.toHaveBeenCalled();
  });
});
