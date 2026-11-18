import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncResult } from '@/lib/sync/types';

const mocks = vi.hoisted(() => ({
  syncAll: vi.fn(),
  startSyncCollections: vi.fn(async () => () => undefined),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/sync/engine', () => ({ syncAll: mocks.syncAll }));
vi.mock('@/lib/sync/collections', () => ({
  startSyncCollections: mocks.startSyncCollections,
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock('@/lib/platform', () => ({ isNativeApp: () => false }));

const OK: SyncResult = { pulled: 0, pushed: 0, failed: 0 };

async function load() {
  vi.resetModules();
  const triggers = await import('./triggers');
  const outbox = await import('./outbox');
  const { appStorage } = await import('@/lib/storage/appStorage');
  return { ...triggers, ...outbox, appStorage };
}

/** Lets the first-sync chain (several awaits) finish. */
async function settle() {
  // Device storage (fake IndexedDB) needs several event-loop turns.
  for (let i = 0; i < 10; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('sync triggers', () => {
  let stop: (() => void) | null = null;

  beforeEach(async () => {
    mocks.syncAll.mockReset().mockResolvedValue(OK);
    mocks.startSyncCollections.mockClear();
    mocks.toastSuccess.mockClear();
    mocks.toastError.mockClear();
    const { appStorage } = await import('@/lib/storage/appStorage');
    await appStorage.removeItem('fitwizard-sync-first-upload');
    await appStorage.removeItem('fitwizard-sync-outbox');
  });

  afterEach(() => {
    stop?.();
    stop = null;
    vi.useRealTimers();
  });

  it('does a first upload on the first sign-in on this device, once per account', async () => {
    mocks.syncAll.mockResolvedValue({ pulled: 2, pushed: 3, failed: 0 });
    let sync = await load();
    stop = sync.startSync('user-1');
    await settle();

    expect(mocks.startSyncCollections).toHaveBeenCalled();
    expect(mocks.syncAll).toHaveBeenCalledWith('user-1', { client: undefined, uploadLocalOnly: true });
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
    stop();

    // Signing in again (or restarting) is a normal sync, not another first upload.
    sync = await load();
    stop = sync.startSync('user-1');
    await settle();
    expect(mocks.syncAll).toHaveBeenLastCalledWith('user-1', { client: undefined });
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
    stop();

    // A different account on the same device gets its own first upload.
    sync = await load();
    stop = sync.startSync('user-2');
    await settle();
    expect(mocks.syncAll).toHaveBeenLastCalledWith('user-2', { client: undefined, uploadLocalOnly: true });
  });

  it("doesn't announce a backup when the device had nothing of its own to upload", async () => {
    mocks.syncAll.mockResolvedValue({ pulled: 5, pushed: 0, failed: 0 });
    const sync = await load();
    stop = sync.startSync('user-1');
    await settle();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("keeps trying the first upload if it didn't fully succeed", async () => {
    mocks.syncAll.mockResolvedValue({ pulled: 0, pushed: 0, failed: 1 });
    let sync = await load();
    stop = sync.startSync('user-1');
    await settle();
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    stop();

    mocks.syncAll.mockResolvedValue({ pulled: 0, pushed: 1, failed: 0 });
    sync = await load();
    stop = sync.startSync('user-1');
    await settle();
    expect(mocks.syncAll).toHaveBeenLastCalledWith('user-1', { client: undefined, uploadLocalOnly: true });
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
  });

  it('syncs once, 2 seconds after the last of several quick changes', async () => {
    const sync = await load();
    stop = sync.startSync('user-1');
    await settle();
    mocks.syncAll.mockClear();

    vi.useFakeTimers();
    sync.markDirty('workout_logs', 'a');
    vi.advanceTimersByTime(1500);
    sync.markDirty('workout_logs', 'b');
    vi.advanceTimersByTime(1500);
    sync.markDirty('workout_logs', 'c');
    expect(mocks.syncAll).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(mocks.syncAll).toHaveBeenCalledTimes(1);
  });

  it('never runs two syncs at once, and queues one follow-up', async () => {
    const sync = await load();
    stop = sync.startSync('user-1');
    await settle();
    mocks.syncAll.mockClear();

    let active = 0;
    let maxActive = 0;
    let release: () => void = () => undefined;
    mocks.syncAll.mockImplementation(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      active -= 1;
      return OK;
    });

    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));
    await settle();
    expect(mocks.syncAll).toHaveBeenCalledTimes(1);

    release();
    await settle();
    // Three triggers during one run collapse into a single follow-up.
    expect(mocks.syncAll).toHaveBeenCalledTimes(2);
    release();
    await settle();
    expect(mocks.syncAll).toHaveBeenCalledTimes(2);
    expect(maxActive).toBe(1);
  });

  it('syncs when the app comes back to the foreground', async () => {
    const sync = await load();
    stop = sync.startSync('user-1');
    await settle();
    mocks.syncAll.mockClear();

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    expect(mocks.syncAll).toHaveBeenCalledTimes(1);
  });

  it('stops listening after stop()', async () => {
    const sync = await load();
    stop = sync.startSync('user-1');
    await settle();
    stop();
    mocks.syncAll.mockClear();

    window.dispatchEvent(new Event('online'));
    vi.useFakeTimers();
    sync.markDirty('workout_logs', 'a');
    vi.advanceTimersByTime(5000);
    await Promise.resolve();
    expect(mocks.syncAll).not.toHaveBeenCalled();
  });
});
