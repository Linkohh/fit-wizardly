import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls: string[] = [];

const mocks = vi.hoisted(() => ({
  configured: true,
  pending: 0,
  syncAll: vi.fn(),
  signOut: vi.fn(),
  clearLocalUserData: vi.fn(),
  stopSync: vi.fn(),
  waitForRunningSync: vi.fn(),
  toastSuccess: vi.fn(),
  prefsQueue: [] as unknown[],
  prefsSync: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: () => mocks.configured }));
vi.mock('@/lib/sync/engine', () => ({ syncAll: mocks.syncAll, waitForRunningSync: mocks.waitForRunningSync }));
vi.mock('@/lib/sync/outbox', () => ({ loadOutbox: async () => undefined, countPendingChanges: () => mocks.pending }));
vi.mock('@/lib/sync/triggers', () => ({ stopSync: mocks.stopSync }));
vi.mock('@/lib/storage/clearLocalUserData', () => ({ clearLocalUserData: mocks.clearLocalUserData }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: { getState: () => ({ signOut: mocks.signOut }) } }));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess } }));
vi.mock('@/stores/preferencesStore', () => ({
  usePreferencesStore: { getState: () => ({ syncToCloud: mocks.prefsSync, offlineQueue: mocks.prefsQueue }) },
}));

import { completeSignOut, prepareSignOut } from './signOut';

describe('safe sign-out', () => {
  beforeEach(() => {
    calls.length = 0;
    mocks.configured = true;
    mocks.pending = 0;
    mocks.syncAll.mockReset().mockImplementation(async () => calls.push('sync'));
    mocks.signOut.mockReset().mockImplementation(async () => calls.push('signOut'));
    mocks.clearLocalUserData.mockReset().mockImplementation(async () => calls.push('erase'));
    mocks.stopSync.mockReset().mockImplementation(() => calls.push('stopSync'));
    mocks.waitForRunningSync.mockReset().mockImplementation(async () => calls.push('waitForSync'));
    mocks.toastSuccess.mockReset();
    mocks.prefsQueue = [];
    mocks.prefsSync.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('syncs one last time and reports unsent changes', async () => {
    mocks.pending = 3;
    await expect(prepareSignOut('user-1')).resolves.toEqual({ pending: 3 });
    expect(mocks.syncAll).toHaveBeenCalledWith('user-1');
  });

  it('also sends and counts queued exercise-favourite changes', async () => {
    mocks.pending = 1;
    mocks.prefsQueue = [{ id: 'a' }, { id: 'b' }];
    await expect(prepareSignOut('user-1')).resolves.toEqual({ pending: 3 });
    expect(mocks.prefsSync).toHaveBeenCalledTimes(1);
  });

  it("doesn't try to sync while offline, but still counts what's unsent", async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    mocks.pending = 2;
    await expect(prepareSignOut('user-1')).resolves.toEqual({ pending: 2 });
    expect(mocks.syncAll).not.toHaveBeenCalled();
  });

  it('stops sync before signing out and erasing, so the erase is never pushed', async () => {
    await completeSignOut();
    expect(calls).toEqual(['stopSync', 'waitForSync', 'signOut', 'erase']);
    expect(mocks.signOut).toHaveBeenCalledWith({ quiet: true });
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
  });

  it('still reports success if erasing the device fails after signing out', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.clearLocalUserData.mockRejectedValueOnce(new Error('disk'));
    await expect(completeSignOut()).resolves.toBeUndefined();
    expect(mocks.signOut).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
