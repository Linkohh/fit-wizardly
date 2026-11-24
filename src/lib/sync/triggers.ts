import { toast } from 'sonner';
import { appStorage } from '@/lib/storage/appStorage';
import { isNativeApp } from '@/lib/platform';
import { translate } from '@/lib/translate';
import { startSyncCollections } from '@/lib/sync/collections';
import { syncAll } from '@/lib/sync/engine';
import { subscribeToDirty } from '@/lib/sync/outbox';
import type { SyncClient, SyncResult } from '@/lib/sync/types';

/**
 * When cloud sync runs (roadmap 1.4 part 3, Lane E Day 6):
 * - on sign-in (startSync), including the first upload of this device's data
 * - when the device comes back online
 * - when the app comes back to the foreground (web: visibilitychange; native: appStateChange)
 * - 2 seconds after the last local change
 *
 * Runs never overlap. A trigger that fires during a run queues one follow-up,
 * so a change made mid-run is still pushed.
 */

export const FIRST_UPLOAD_STORAGE_KEY = 'fitwizard-sync-first-upload';
export const SYNC_DEBOUNCE_MS = 2000;

export interface StartSyncOptions {
  /** Tests only. */
  client?: SyncClient;
  debounceMs?: number;
}

async function readUploadedUsers(): Promise<string[]> {
  try {
    const parsed: unknown = JSON.parse((await appStorage.getItem(FIRST_UPLOAD_STORAGE_KEY)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

async function markUploaded(userId: string): Promise<void> {
  const users = await readUploadedUsers();
  if (!users.includes(userId)) {
    await appStorage.setItem(FIRST_UPLOAD_STORAGE_KEY, JSON.stringify([...users, userId]));
  }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

let stopCurrent: (() => void) | null = null;

/**
 * Starts syncing for a signed-in user. Calling it again (another account)
 * stops the previous one first. Returns a stop function.
 */
export function startSync(userId: string, options: StartSyncOptions = {}): () => void {
  stopCurrent?.();

  const debounceMs = options.debounceMs ?? SYNC_DEBOUNCE_MS;
  let stopped = false;
  let running = false;
  let followUp = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const cleanups: Array<() => void> = [];

  const runOnce = async (): Promise<SyncResult | null> => {
    if (stopped || isOffline()) return null;
    return syncAll(userId, { client: options.client });
  };

  const requestSync = async (): Promise<void> => {
    if (stopped) return;
    if (running) {
      followUp = true;
      return;
    }
    running = true;
    try {
      await runOnce();
    } finally {
      running = false;
    }
    if (followUp && !stopped) {
      followUp = false;
      await requestSync();
    }
  };

  const firstSync = async () => {
    await startSyncCollections();
    if (stopped) return;

    const uploaded = (await readUploadedUsers()).includes(userId);
    if (uploaded) {
      await requestSync();
      return;
    }

    // First sign-in on this device for this account. Pull everything first, so
    // records the cloud already has keep the cloud copy, then upload only what
    // exists solely on this device (data saved as a guest or before sync).
    // Marking every local record dirty instead would let a fresh device's
    // defaults overwrite the account (review finding on #66).
    running = true;
    let result: SyncResult | null = null;
    try {
      result = stopped || isOffline() ? null : await syncAll(userId, { client: options.client, uploadLocalOnly: true });
    } finally {
      running = false;
    }
    if (!result || stopped) return; // Offline: try again on the next sign-in or start.

    if (result.failed === 0) {
      await markUploaded(userId);
      if (result.pushed > 0) {
        toast.success(translate('sync.first_upload', 'Your training on this device is now backed up to your account.'));
      }
    } else {
      toast.error(
        translate('sync.first_upload_failed', "Some of your training couldn't be backed up yet. We'll keep trying."),
      );
    }
    if (followUp) {
      followUp = false;
      await requestSync();
    }
  };

  // Debounced: 2 seconds after the last local change.
  cleanups.push(
    subscribeToDirty(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void requestSync();
      }, debounceMs);
    }),
  );

  if (typeof window !== 'undefined') {
    const onOnline = () => void requestSync();
    window.addEventListener('online', onOnline);
    cleanups.push(() => window.removeEventListener('online', onOnline));
  }

  if (isNativeApp()) {
    let removeListener: (() => void) | null = null;
    void import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) void requestSync();
        }),
      )
      .then((handle) => {
        if (stopped) void handle.remove();
        else removeListener = () => void handle.remove();
      })
      .catch(() => undefined);
    cleanups.push(() => removeListener?.());
  } else if (typeof document !== 'undefined') {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void requestSync();
    };
    document.addEventListener('visibilitychange', onVisible);
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisible));
  }

  void firstSync().catch((error) => console.error('[FitWizard] First sync failed.', error));

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    cleanups.forEach((cleanup) => cleanup());
    if (stopCurrent === stop) stopCurrent = null;
  };
  stopCurrent = stop;
  return stop;
}

/** Stops the current account's sync triggers (sign-out, before the device is erased). */
export function stopSync(): void {
  stopCurrent?.();
}

/** Runs a sync now for the signed-in user, for the Profile Retry button. */
export function retrySync(userId: string): Promise<SyncResult> {
  return syncAll(userId);
}
