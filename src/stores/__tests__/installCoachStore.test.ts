import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INSTALL_COACH_STORAGE_KEY } from '@/lib/install-coach';

async function loadStore() {
  vi.resetModules();
  return (await import('@/stores/installCoachStore')).useInstallCoachStore;
}

describe('installCoachStore visit count', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts at zero and counts each recorded visit', async () => {
    const store = await loadStore();
    expect(store.getState().visitCount).toBe(0);

    store.getState().recordVisit();
    store.getState().recordVisit();

    expect(store.getState().visitCount).toBe(2);
  });

  it('remembers the count across reloads', async () => {
    const first = await loadStore();
    first.getState().recordVisit();

    const second = await loadStore();

    expect(second.getState().visitCount).toBe(1);
  });

  it('loads state saved before visitCount existed', async () => {
    window.localStorage.setItem(
      INSTALL_COACH_STORAGE_KEY,
      JSON.stringify({ state: { hasSeenCoach: true, dismissed: true, installed: false }, version: 0 }),
    );

    const store = await loadStore();

    expect(store.getState().visitCount).toBe(0);
    expect(store.getState().dismissed).toBe(true);
    expect(store.getState().hasHydrated).toBe(true);
  });

  it('ignores a corrupted saved count', async () => {
    window.localStorage.setItem(
      INSTALL_COACH_STORAGE_KEY,
      JSON.stringify({ state: { hasSeenCoach: false, dismissed: false, installed: false, visitCount: 'lots' }, version: 0 }),
    );

    const store = await loadStore();

    expect(store.getState().visitCount).toBe(0);
  });
});
