import type { ComponentType } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The consent modal opens on the user's first page. Opting in there must count that
 * page once (review finding on #75), and nothing may be sent or loaded before that.
 * Driven by the real ConsentModal, so the real write-keys-then-dispatch order is used.
 */

const mocks = vi.hoisted(() => ({
  importCount: 0,
  posthog: { init: vi.fn(), capture: vi.fn() },
}));

vi.mock('posthog-js', () => {
  mocks.importCount += 1;
  return { default: mocks.posthog };
});

async function loadModules() {
  vi.resetModules();
  const { usePageViews } = await import('./usePageViews');
  const track = await import('./track');
  const { ConsentModal } = await import('@/components/legal/ConsentModal');
  return { usePageViews, track, ConsentModal };
}

async function renderFirstVisit(
  usePageViews: () => void,
  ConsentModal: ComponentType,
  path: string,
) {
  function PageViews() {
    usePageViews();
    return null;
  }

  render(
    <MemoryRouter initialEntries={[path]}>
      <PageViews />
      <ConsentModal />
    </MemoryRouter>,
  );

  // The tray opens after a short delay on first visit.
  await screen.findByRole('button', { name: /I Agree & Continue/i }, { timeout: 2000 });
}

async function agree(optIntoAnalytics: boolean) {
  if (optIntoAnalytics) {
    fireEvent.click(screen.getByRole('checkbox', { name: /Help improve FitWizard/i }));
  }
  fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));
  await vi.dynamicImportSettled();
  await Promise.resolve();
}

describe('page views and the consent modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.importCount = 0;
    window.localStorage.clear();
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  it('sends nothing before consent, then counts the entry page once after opting in', async () => {
    const { usePageViews, track, ConsentModal } = await loadModules();

    await renderFirstVisit(usePageViews, ConsentModal, '/plan');
    expect(track.analyticsLoadingForTests()).toBeNull();
    expect(mocks.importCount).toBe(0);

    await agree(true);
    await track.analyticsLoadingForTests();

    expect(mocks.posthog.init).toHaveBeenCalledTimes(1);
    expect(mocks.posthog.capture.mock.calls).toEqual([['$pageview', { platform: 'web' }]]);
  });

  it('sends nothing when the user agrees without opting in', async () => {
    const { usePageViews, track, ConsentModal } = await loadModules();

    await renderFirstVisit(usePageViews, ConsentModal, '/plan');
    await agree(false);

    expect(track.analyticsLoadingForTests()).toBeNull();
    expect(mocks.importCount).toBe(0);
    expect(mocks.posthog.capture).not.toHaveBeenCalled();
  });
});
