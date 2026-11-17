import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markHydrated, resetHydrationForTests, waitForHydration } from './hydration';
import { translate } from '@/lib/translate';

function fakeStore(hydrated: boolean) {
  const listeners = new Set<() => void>();
  let done = hydrated;
  return {
    finish() {
      done = true;
      for (const listener of listeners) listener();
    },
    persist: {
      hasHydrated: () => done,
      onFinishHydration: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    listenerCount: () => listeners.size,
  };
}

describe('waitForHydration', () => {
  beforeEach(() => {
    resetHydrationForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves straight away when the store has already loaded', async () => {
    await expect(waitForHydration(fakeStore(true), 'store-a')).resolves.toBeUndefined();
  });

  it('waits until the store finishes loading, then stops listening', async () => {
    const store = fakeStore(false);
    let resolved = false;
    const waiting = waitForHydration(store, 'store-b').then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    store.finish();
    await waiting;
    expect(resolved).toBe(true);
    expect(store.listenerCount()).toBe(0);
  });

  it('resolves when the load failed (zustand never reports hydrated, the tracker does)', async () => {
    const store = fakeStore(false);
    const waiting = waitForHydration(store, 'store-c');

    // What hydrationTracking's onRehydrateStorage does on an error.
    markHydrated('store-c');

    await expect(waiting).resolves.toBeUndefined();
    expect(store.persist.hasHydrated()).toBe(false);
    expect(store.listenerCount()).toBe(0);
  });

  it('never waits forever', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const waiting = waitForHydration(fakeStore(false), 'store-d', 500);

    vi.advanceTimersByTime(500);

    await expect(waiting).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('waitForHydration with a real store and damaged saved data', () => {
  it('lets plan generation continue when saved achievements are corrupt', async () => {
    vi.resetModules();
    const { appStorage } = await import('@/lib/storage/appStorage');
    await appStorage.setItem('fitwizard-achievements', '{ this is not json');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { useAchievementStore } = await import('@/stores/achievementStore');
    const { waitForHydration: wait } = await import('./hydration');

    await expect(wait(useAchievementStore, 'fitwizard-achievements', 2000)).resolves.toBeUndefined();
    // Settled through the load tracker, not the safety timeout.
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(useAchievementStore.persist.hasHydrated()).toBe(false);
    // The store still works, starting from defaults.
    expect(useAchievementStore.getState().incrementPlansGenerated()).toEqual(['first_plan']);

    consoleError.mockRestore();
    consoleWarn.mockRestore();
    await appStorage.removeItem('fitwizard-achievements');
  });
});

describe('translate', () => {
  it('fills in placeholders in the English fallback', () => {
    expect(translate('missing.key', 'Badge unlocked: {{name}}', { name: 'First Steps' })).toBe('Badge unlocked: First Steps');
  });
});
