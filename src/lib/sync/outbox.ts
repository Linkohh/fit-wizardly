import { appStorage } from '@/lib/storage/appStorage';

/**
 * The outbox: which local items changed (or were deleted) since they were
 * last pushed to the cloud. Saved on the device so changes made offline,
 * or just before the app was closed, are pushed on the next sync.
 *
 * Replaces the old in-memory queue in src/lib/offlineSave.ts.
 */

export const OUTBOX_STORAGE_KEY = 'fitwizard-sync-outbox';

export interface OutboxEntry {
  /** True when the item was deleted locally and the deletion must be pushed. */
  deleted: boolean;
  /** ISO time the change was recorded; also used as the tombstone time. */
  at: string;
}

type Outbox = Record<string, Record<string, OutboxEntry>>;

let outbox: Outbox = {};
let loadPromise: Promise<void> | null = null;
let saveChain: Promise<void> = Promise.resolve();
const dirtyListeners = new Set<() => void>();

/** Calls `listener` after every markDirty(). Used by the debounced sync trigger. Returns an unsubscribe. */
export function subscribeToDirty(listener: () => void): () => void {
  dirtyListeners.add(listener);
  return () => {
    dirtyListeners.delete(listener);
  };
}

function isOutbox(value: unknown): value is Outbox {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function scheduleSave(): void {
  // Load (and merge) the saved outbox first, so a change made after a restart
  // but before the first sync doesn't overwrite unsent changes from last time.
  // The snapshot is taken at write time, after that merge.
  saveChain = saveChain
    .then(async () => {
      await loadOutbox();
      await appStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(outbox));
    })
    .catch(() => undefined);
}

/** Loads saved entries once. Entries recorded before loading finished win. */
export function loadOutbox(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const raw = await appStorage.getItem(OUTBOX_STORAGE_KEY);
      if (!raw) return;
      try {
        const saved: unknown = JSON.parse(raw);
        if (!isOutbox(saved)) return;
        const merged: Outbox = {};
        for (const [table, entries] of Object.entries(saved)) {
          if (!isOutbox(entries)) continue;
          merged[table] = { ...(entries as Record<string, OutboxEntry>), ...(outbox[table] ?? {}) };
        }
        for (const [table, entries] of Object.entries(outbox)) {
          merged[table] = { ...(merged[table] ?? {}), ...entries };
        }
        outbox = merged;
      } catch {
        // Damaged outbox: start empty rather than block syncing.
      }
    })();
  }
  return loadPromise;
}

/**
 * Records that an item changed locally (or was deleted, with
 * `{ deleted: true }`). Stores call this from every action that writes.
 */
export function markDirty(table: string, key: string, options: { deleted?: boolean } = {}): void {
  outbox = {
    ...outbox,
    [table]: { ...(outbox[table] ?? {}), [key]: { deleted: options.deleted === true, at: new Date().toISOString() } },
  };
  scheduleSave();
  dirtyListeners.forEach((listener) => listener());
}

export function getOutboxEntries(table: string): Record<string, OutboxEntry> {
  return outbox[table] ?? {};
}

/** Removes an entry, but only if it hasn't changed since `expected` was read. */
export function clearOutboxEntry(table: string, key: string, expected?: OutboxEntry): void {
  const current = outbox[table]?.[key];
  if (!current) return;
  if (expected && (current.at !== expected.at || current.deleted !== expected.deleted)) return;
  const { [key]: _removed, ...rest } = outbox[table];
  outbox = { ...outbox, [table]: rest };
  scheduleSave();
}

export function countPendingChanges(): number {
  return Object.values(outbox).reduce((total, entries) => total + Object.keys(entries).length, 0);
}

/** Waits until every scheduled outbox write has reached device storage. */
export function flushOutboxWrites(): Promise<void> {
  return saveChain;
}

/** Forgets every unsent change, in memory and on the device (erase / account deletion). */
export async function clearOutbox(): Promise<void> {
  outbox = {};
  loadPromise = Promise.resolve();
  await saveChain;
  await appStorage.removeItem(OUTBOX_STORAGE_KEY);
}

/** Test helper. */
export function resetOutboxForTests(): void {
  dirtyListeners.clear();
  outbox = {};
  loadPromise = null;
  saveChain = Promise.resolve();
}
