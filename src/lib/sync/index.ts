/**
 * Cloud sync (contract #5 in docs/project/CONTRACTS.md). Import from here.
 */
export { syncAll, CURSOR_STORAGE_KEY } from '@/lib/sync/engine';
export { markDirty, countPendingChanges, OUTBOX_STORAGE_KEY } from '@/lib/sync/outbox';
export { registerCollection } from '@/lib/sync/registry';
export { useSyncStatus } from '@/lib/sync/status';
export type { SyncCollection, SyncResult, SyncRow, SyncStatus } from '@/lib/sync/types';
