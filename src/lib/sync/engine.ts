import { appStorage } from '@/lib/storage/appStorage';
import { supabase } from '@/lib/supabase';
import { clearOutboxEntry, getOutboxEntries, loadOutbox, markDirty, type OutboxEntry } from '@/lib/sync/outbox';
import { getRegisteredCollections } from '@/lib/sync/registry';
import { syncStateStore } from '@/lib/sync/status';
import type { SyncClient, SyncCollection, SyncResult, SyncRow } from '@/lib/sync/types';

/**
 * Cloud sync engine (contract #5; roadmap 1.4). For each registered collection:
 *
 * 1. **Pull** rows changed since the last pull (`updated_at >= cursor`).
 * 2. **Merge** per record: the newer `updated_at` wins; a tombstone
 *    (`deleted_at`) beats any edit older than itself; a local delete beats any
 *    remote edit older than itself.
 * 3. **Push** the outbox: upsert changed items, set `deleted_at` for deleted ones.
 *
 * `updated_at` on the server is set by the server's own clock (trigger), so
 * local edit times are compared against server times; small clock skew only
 * matters when the same record is edited on two devices within seconds.
 *
 * Nothing calls syncAll() yet: the triggers (sign-in, online, resume,
 * debounce) arrive on Lane E Day 6.
 */

export const CURSOR_STORAGE_KEY = 'fitwizard-sync-cursor';
const PAGE_SIZE = 500;
const UPSERT_BATCH_SIZE = 200;

interface CursorState {
  userId: string;
  cursors: Record<string, string>;
}

async function readCursors(userId: string): Promise<Record<string, string>> {
  const raw = await appStorage.getItem(CURSOR_STORAGE_KEY);
  if (!raw) return {};
  try {
    const saved = JSON.parse(raw) as Partial<CursorState>;
    // A different account must start from scratch.
    return saved.userId === userId && saved.cursors && typeof saved.cursors === 'object' ? saved.cursors : {};
  } catch {
    return {};
  }
}

async function writeCursors(userId: string, cursors: Record<string, string>): Promise<void> {
  await appStorage.setItem(CURSOR_STORAGE_KEY, JSON.stringify({ userId, cursors } satisfies CursorState));
}

function toTime(value: string | null | undefined): number {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

async function pullRows(client: SyncClient, table: string, userId: string, cursor: string | undefined): Promise<SyncRow[]> {
  const rows: SyncRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client.from(table).select('*').eq('user_id', userId);
    if (cursor) query = query.gte('updated_at', cursor);
    const { data, error } = await query.order('updated_at', { ascending: true }).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`pull ${table}: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

/** Applies pulled rows to local items. Returns the number of local changes. */
function mergeRows<T>(collection: SyncCollection<T>, rows: SyncRow[]): number {
  const byKey = new Map<string, T>();
  for (const item of collection.readLocal()) byKey.set(collection.key(item), item);
  const pending = getOutboxEntries(collection.table);
  let changes = 0;

  for (const row of rows) {
    let remoteItem: T;
    try {
      remoteItem = collection.fromRow(row);
    } catch (error) {
      console.error(`[FitWizard] Skipping a malformed ${collection.table} row.`, error);
      continue;
    }
    const key = collection.key(remoteItem);
    const local = byKey.get(key);
    const entry: OutboxEntry | undefined = pending[key];
    const remoteTime = toTime(row.updated_at);
    const localTime = local ? toTime(collection.getUpdatedAt(local)) : 0;

    if (row.deleted_at) {
      const deletedTime = toTime(row.deleted_at);
      const localEditIsNewer = entry && !entry.deleted && toTime(entry.at) > deletedTime;
      if (local && !localEditIsNewer) {
        byKey.delete(key);
        changes += 1;
      }
      if (!localEditIsNewer && entry) clearOutboxEntry(collection.table, key, entry);
      continue;
    }

    if (entry?.deleted) {
      // Deleted here; a remote edit made after that deletion brings it back.
      if (remoteTime > toTime(entry.at)) {
        byKey.set(key, remoteItem);
        clearOutboxEntry(collection.table, key, entry);
        changes += 1;
      }
      continue;
    }

    if (!local) {
      byKey.set(key, remoteItem);
      changes += 1;
      continue;
    }

    if (remoteTime > localTime && !(entry && toTime(entry.at) > remoteTime)) {
      byKey.set(key, remoteItem);
      if (entry) clearOutboxEntry(collection.table, key, entry);
      changes += 1;
    } else if (localTime > remoteTime && !entry) {
      // Edited here without being marked (older data): push it.
      markDirty(collection.table, key);
    }
  }

  if (changes > 0) collection.writeLocal([...byKey.values()]);
  return changes;
}

/** Pushes the collection's outbox. Returns how many changes were sent. */
async function pushChanges<T>(client: SyncClient, collection: SyncCollection<T>, userId: string): Promise<number> {
  const entries = Object.entries(getOutboxEntries(collection.table));
  if (entries.length === 0) return 0;

  const localByKey = new Map<string, T>();
  for (const item of collection.readLocal()) localByKey.set(collection.key(item), item);

  let pushed = 0;
  const upserts: Array<{ key: string; entry: OutboxEntry; row: Omit<SyncRow, 'updated_at'> }> = [];

  for (const [key, entry] of entries) {
    if (entry.deleted) {
      if (!collection.keyColumn) {
        clearOutboxEntry(collection.table, key, entry);
        continue;
      }
      const { error } = await client
        .from(collection.table)
        .update({ deleted_at: entry.at })
        .eq('user_id', userId)
        .eq(collection.keyColumn, key);
      if (error) throw new Error(`delete ${collection.table}/${key}: ${error.message}`);
      clearOutboxEntry(collection.table, key, entry);
      pushed += 1;
      continue;
    }

    const item = localByKey.get(key);
    if (!item) {
      // Marked as changed but no longer here and not marked deleted: nothing to send.
      clearOutboxEntry(collection.table, key, entry);
      continue;
    }
    upserts.push({ key, entry, row: { ...collection.toRow(item, userId), deleted_at: null } });
  }

  for (let start = 0; start < upserts.length; start += UPSERT_BATCH_SIZE) {
    const batch = upserts.slice(start, start + UPSERT_BATCH_SIZE);
    const { error } = await client
      .from(collection.table)
      .upsert(batch.map((change) => change.row), { onConflict: collection.onConflict });
    if (error) throw new Error(`upsert ${collection.table}: ${error.message}`);
    for (const change of batch) clearOutboxEntry(collection.table, change.key, change.entry);
    pushed += batch.length;
  }

  return pushed;
}

let running: Promise<SyncResult> | null = null;

/**
 * Syncs every registered collection for the signed-in user. Calls made while
 * a sync is running share it. One collection failing doesn't stop the others.
 */
export function syncAll(userId: string, options: { client?: SyncClient } = {}): Promise<SyncResult> {
  if (running) return running;

  // The generated Database types can't express "any table by name"; the
  // engine only uses the methods declared on SyncClient.
  const client = options.client ?? (supabase as unknown as SyncClient);

  running = (async () => {
    syncStateStore.setState({ running: true });
    const result: SyncResult = { pulled: 0, pushed: 0, failed: 0 };
    const errors: string[] = [];

    try {
      await loadOutbox();
      const cursors = await readCursors(userId);

      for (const collection of getRegisteredCollections()) {
        try {
          const rows = await pullRows(client, collection.table, userId, cursors[collection.table]);
          mergeRows(collection, rows);
          result.pulled += rows.length;
          const newest = rows.reduce<string | undefined>(
            (latest, row) => (!latest || toTime(row.updated_at) > toTime(latest) ? row.updated_at : latest),
            cursors[collection.table],
          );
          if (newest) cursors[collection.table] = newest;
          await writeCursors(userId, cursors);
          result.pushed += await pushChanges(client, collection, userId);
        } catch (error) {
          result.failed += 1;
          errors.push(error instanceof Error ? error.message : String(error));
          console.error(`[FitWizard] Sync failed for ${collection.table}.`, error);
        }
      }
    } finally {
      syncStateStore.setState({
        running: false,
        lastError: errors.length > 0 ? errors.join('; ') : null,
        lastSyncedAt: errors.length === 0 ? new Date().toISOString() : syncStateStore.getState().lastSyncedAt,
      });
    }

    return result;
  })().finally(() => {
    running = null;
  });

  return running;
}
