import { createStore, useStore } from 'zustand';
import { useOnlineStatus } from '@/lib/offlineSupport';
import { useAuthStore } from '@/stores/authStore';
import type { SyncStatus } from '@/lib/sync/types';

interface SyncState {
  running: boolean;
  lastError: string | null;
  lastSyncedAt: string | null;
}

/** Engine state. Written by engine.ts, read by useSyncStatus(). */
export const syncStateStore = createStore<SyncState>(() => ({
  running: false,
  lastError: null,
  lastSyncedAt: null,
}));

/** Pure precedence rule, exported for tests. */
export function deriveSyncStatus(input: {
  signedIn: boolean;
  online: boolean;
  running: boolean;
  lastError: string | null;
}): SyncStatus {
  if (!input.signedIn) return 'signed-out';
  if (!input.online) return 'offline';
  if (input.running) return 'saving';
  if (input.lastError) return 'error';
  return 'synced';
}

/** Contract #5: the sync status shown to the user. */
export function useSyncStatus(): SyncStatus {
  const signedIn = useAuthStore((state) => state.user !== null);
  const online = useOnlineStatus();
  const running = useStore(syncStateStore, (state) => state.running);
  const lastError = useStore(syncStateStore, (state) => state.lastError);
  return deriveSyncStatus({ signedIn, online, running, lastError });
}
