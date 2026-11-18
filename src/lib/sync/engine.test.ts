import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryResult, SyncClient, SyncCollection, SyncFilterQuery, SyncRow, SyncUpdateQuery } from './types';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(() => null, { getState: () => ({ user: null }) }),
}));

const USER = 'user-1';

// ---------------------------------------------------------------------------
// In-memory stand-in for Supabase. Like the real tables, it sets updated_at
// from its own clock on every write (migration 007's trigger).
// ---------------------------------------------------------------------------
class FakeServer {
  tables = new Map<string, SyncRow[]>();
  private clock = Date.parse('2026-11-17T12:00:00.000Z');
  failingTables = new Set<string>();
  failNextUpsert = false;
  upsertCalls = 0;

  now(): string {
    this.clock += 1000;
    return new Date(this.clock).toISOString();
  }

  rows(table: string): SyncRow[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table) as SyncRow[];
  }

  /** Simulates a write from another device. */
  writeFromOtherDevice(table: string, row: Omit<SyncRow, 'updated_at' | 'user_id' | 'deleted_at'> & { deleted_at?: string | null }) {
    const rows = this.rows(table);
    const index = rows.findIndex((existing) => existing.id === row.id);
    const next: SyncRow = { user_id: USER, deleted_at: null, ...row, updated_at: this.now() };
    if (index >= 0) rows[index] = next;
    else rows.push(next);
    return next;
  }

  client(): SyncClient {
    return {
      from: (table: string) => ({
        select: () => this.selectQuery(table),
        upsert: (rows: object[]) => {
          this.upsertCalls += 1;
          if (this.failNextUpsert || this.failingTables.has(table)) {
            this.failNextUpsert = false;
            return Promise.resolve<QueryResult<unknown>>({ data: null, error: { message: 'network down' } });
          }
          for (const row of rows as SyncRow[]) {
            const existing = this.rows(table).findIndex((r) => r.user_id === row.user_id && r.id === row.id);
            const stored = { ...row, updated_at: this.now() } as SyncRow;
            if (existing >= 0) this.rows(table)[existing] = stored;
            else this.rows(table).push(stored);
          }
          return Promise.resolve<QueryResult<unknown>>({ data: null, error: null });
        },
        update: (values: object) => this.updateQuery(table, values),
      }),
    };
  }

  private selectQuery(table: string): SyncFilterQuery {
    const filters: Array<(row: SyncRow) => boolean> = [];
    let range: [number, number] | null = null;
    const query: SyncFilterQuery = {
      eq: (column, value) => {
        filters.push((row) => row[column] === value);
        return query;
      },
      gte: (column, value) => {
        filters.push((row) => String(row[column]) >= value);
        return query;
      },
      order: () => query,
      range: (from, to) => {
        range = [from, to];
        return query;
      },
      then: (resolve, reject) => {
        if (this.failingTables.has(table)) {
          return Promise.resolve({ data: null, error: { message: 'pull failed' } }).then(resolve, reject);
        }
        let rows = this.rows(table)
          .filter((row) => filters.every((filter) => filter(row)))
          .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
        if (range) rows = rows.slice(range[0], range[1] + 1);
        return Promise.resolve({ data: rows.map((row) => ({ ...row })), error: null }).then(resolve, reject);
      },
    };
    return query;
  }

  private updateQuery(table: string, values: object): SyncUpdateQuery {
    const filters: Array<(row: SyncRow) => boolean> = [];
    const query: SyncUpdateQuery = {
      eq: (column, value) => {
        filters.push((row) => row[column] === value);
        return query;
      },
      then: (resolve, reject) => {
        if (this.failingTables.has(table)) {
          return Promise.resolve({ data: null, error: { message: 'network down' } }).then(resolve, reject);
        }
        for (const [index, row] of this.rows(table).entries()) {
          if (filters.every((filter) => filter(row))) {
            this.rows(table)[index] = { ...row, ...values, updated_at: this.now() } as SyncRow;
          }
        }
        return Promise.resolve({ data: null, error: null }).then(resolve, reject);
      },
    };
    return query;
  }
}

// ---------------------------------------------------------------------------
// A simple local store standing in for a Zustand store.
// ---------------------------------------------------------------------------
interface Note {
  id: string;
  text: string;
  updatedAt: string;
}

function noteCollection(table: string, local: { items: Note[] }): SyncCollection<Note> {
  return {
    table,
    keyColumn: 'id',
    onConflict: 'user_id,id',
    key: (note) => note.id,
    toRow: (note, userId) => ({ user_id: userId, id: note.id, data: { text: note.text }, deleted_at: null }),
    fromRow: (row) => ({ id: String(row.id), text: String((row.data as { text: string }).text), updatedAt: row.updated_at }),
    readLocal: () => local.items,
    writeLocal: (items) => {
      local.items = items;
    },
    getUpdatedAt: (note) => note.updatedAt,
  };
}

async function loadEngine() {
  vi.resetModules();
  const engine = await import('./engine');
  const outbox = await import('./outbox');
  const registry = await import('./registry');
  const status = await import('./status');
  const { appStorage } = await import('@/lib/storage/appStorage');
  return { ...engine, ...outbox, ...registry, ...status, appStorage };
}

describe('sync engine', () => {
  let server: FakeServer;

  beforeEach(async () => {
    server = new FakeServer();
    const { appStorage } = await import('@/lib/storage/appStorage');
    await appStorage.removeItem('fitwizard-sync-outbox');
    await appStorage.removeItem('fitwizard-sync-cursor');
  });

  it('pulls everything into an empty device on the first sync', async () => {
    server.writeFromOtherDevice('notes', { id: 'a', data: { text: 'from phone' } });
    server.writeFromOtherDevice('notes', { id: 'b', data: { text: 'also from phone' } });
    const sync = await loadEngine();
    const local = { items: [] as Note[] };
    sync.registerCollection(noteCollection('notes', local));

    const result = await sync.syncAll(USER, { client: server.client() });

    expect(result).toEqual({ pulled: 2, pushed: 0, failed: 0 });
    expect(local.items.map((n) => n.text).sort()).toEqual(['also from phone', 'from phone']);
  });

  it('pushes local changes and clears them from the outbox', async () => {
    const sync = await loadEngine();
    const local = { items: [{ id: 'a', text: 'logged offline', updatedAt: '2026-11-17T12:30:00.000Z' }] };
    sync.registerCollection(noteCollection('notes', local));
    sync.markDirty('notes', 'a');

    const result = await sync.syncAll(USER, { client: server.client() });

    expect(result.pushed).toBe(1);
    expect(server.rows('notes').map((row) => row.id)).toEqual(['a']);
    expect(sync.countPendingChanges()).toBe(0);
  });

  it('keeps the newer edit when both sides changed (remote newer)', async () => {
    const sync = await loadEngine();
    const local = { items: [{ id: 'a', text: 'old local', updatedAt: '2026-11-17T11:00:00.000Z' }] };
    sync.registerCollection(noteCollection('notes', local));
    server.writeFromOtherDevice('notes', { id: 'a', data: { text: 'newer remote' } });

    await sync.syncAll(USER, { client: server.client() });

    expect(local.items).toHaveLength(1);
    expect(local.items[0].text).toBe('newer remote');
  });

  it('keeps the newer edit when both sides changed (local newer)', async () => {
    server.writeFromOtherDevice('notes', { id: 'a', data: { text: 'older remote' } });
    const sync = await loadEngine();
    const local = { items: [{ id: 'a', text: 'newer local', updatedAt: '2026-11-17T13:00:00.000Z' }] };
    sync.registerCollection(noteCollection('notes', local));
    sync.markDirty('notes', 'a');

    await sync.syncAll(USER, { client: server.client() });

    expect(local.items[0].text).toBe('newer local');
    expect((server.rows('notes')[0].data as { text: string }).text).toBe('newer local');
  });

  it('removes an item deleted on another device', async () => {
    server.writeFromOtherDevice('notes', { id: 'a', data: { text: 'to delete' } });
    const sync = await loadEngine();
    const local = { items: [] as Note[] };
    sync.registerCollection(noteCollection('notes', local));
    await sync.syncAll(USER, { client: server.client() });
    expect(local.items).toHaveLength(1);

    server.writeFromOtherDevice('notes', { id: 'a', data: { text: 'to delete' }, deleted_at: server.now() });
    await sync.syncAll(USER, { client: server.client() });

    expect(local.items).toEqual([]);
  });

  it('pushes a local delete as a tombstone, never a hard delete', async () => {
    server.writeFromOtherDevice('notes', { id: 'a', data: { text: 'here' } });
    const sync = await loadEngine();
    const local = { items: [] as Note[] };
    sync.registerCollection(noteCollection('notes', local));
    await sync.syncAll(USER, { client: server.client() });

    local.items = [];
    sync.markDirty('notes', 'a', { deleted: true });
    await sync.syncAll(USER, { client: server.client() });

    expect(server.rows('notes')).toHaveLength(1);
    expect(server.rows('notes')[0].deleted_at).not.toBeNull();
    expect(sync.countPendingChanges()).toBe(0);
  });

  it('keeps a failed push in the outbox and sends it on the next sync', async () => {
    const sync = await loadEngine();
    const local = { items: [{ id: 'a', text: 'try again', updatedAt: '2026-11-17T12:30:00.000Z' }] };
    sync.registerCollection(noteCollection('notes', local));
    sync.markDirty('notes', 'a');
    server.failNextUpsert = true;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const first = await sync.syncAll(USER, { client: server.client() });
    expect(first.failed).toBe(1);
    expect(sync.countPendingChanges()).toBe(1);
    expect(sync.syncStateStore.getState().lastError).toContain('network down');

    const second = await sync.syncAll(USER, { client: server.client() });
    expect(second).toEqual({ pulled: 0, pushed: 1, failed: 0 });
    expect(sync.countPendingChanges()).toBe(0);
    expect(sync.syncStateStore.getState().lastError).toBeNull();
    consoleError.mockRestore();
  });

  it('keeps unsent changes across an app restart', async () => {
    let sync = await loadEngine();
    sync.markDirty('notes', 'a');
    await sync.flushOutboxWrites();

    sync = await loadEngine();
    const local = { items: [{ id: 'a', text: 'saved before closing', updatedAt: '2026-11-17T12:30:00.000Z' }] };
    sync.registerCollection(noteCollection('notes', local));
    const result = await sync.syncAll(USER, { client: server.client() });

    expect(result.pushed).toBe(1);
    expect(server.rows('notes')).toHaveLength(1);
  });

  it('keeps unsent changes from before a restart when a new change is made before the first sync', async () => {
    let sync = await loadEngine();
    sync.markDirty('notes', 'old', { deleted: true });
    await sync.flushOutboxWrites();

    sync = await loadEngine();
    sync.markDirty('notes', 'new');
    await sync.flushOutboxWrites();

    sync = await loadEngine();
    await sync.loadOutbox();
    expect(sync.getOutboxEntries('notes')).toMatchObject({ old: { deleted: true }, new: { deleted: false } });
  });

  it('pushes a delete for a one-row-per-user table as a tombstone', async () => {
    server.rows('settings').push({ user_id: USER, data: { text: 'mine' }, updated_at: server.now(), deleted_at: null });
    const sync = await loadEngine();
    const local = { items: [] as Note[] };
    sync.registerCollection({
      ...noteCollection('settings', local),
      keyColumn: null,
      onConflict: 'user_id',
      key: () => 'singleton',
      fromRow: (row) => ({ id: 'singleton', text: String((row.data as { text: string }).text), updatedAt: row.updated_at }),
    });
    await sync.syncAll(USER, { client: server.client() });

    local.items = [];
    sync.markDirty('settings', 'singleton', { deleted: true });
    const result = await sync.syncAll(USER, { client: server.client() });

    expect(result.pushed).toBe(1);
    expect(server.rows('settings')[0].deleted_at).not.toBeNull();
    expect(sync.countPendingChanges()).toBe(0);
  });

  it('carries on with other collections when one fails', async () => {
    server.writeFromOtherDevice('good', { id: 'g', data: { text: 'fine' } });
    server.failingTables.add('broken');
    const sync = await loadEngine();
    const broken = { items: [] as Note[] };
    const good = { items: [] as Note[] };
    sync.registerCollection(noteCollection('broken', broken));
    sync.registerCollection(noteCollection('good', good));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await sync.syncAll(USER, { client: server.client() });

    expect(result.failed).toBe(1);
    expect(good.items.map((n) => n.id)).toEqual(['g']);
    consoleError.mockRestore();
  });

  it('only moves the pull cursor forward after a successful pull', async () => {
    server.writeFromOtherDevice('notes', { id: 'a', data: { text: 'one' } });
    const sync = await loadEngine();
    const local = { items: [] as Note[] };
    sync.registerCollection(noteCollection('notes', local));
    await sync.syncAll(USER, { client: server.client() });
    const cursorAfterFirst = JSON.parse((await sync.appStorage.getItem('fitwizard-sync-cursor')) as string).cursors.notes;
    expect(cursorAfterFirst).toBe(server.rows('notes')[0].updated_at);

    server.failingTables.add('notes');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.failingTables.delete('notes');
    server.writeFromOtherDevice('notes', { id: 'b', data: { text: 'two' } });
    server.failingTables.add('notes');
    await sync.syncAll(USER, { client: server.client() });
    const cursorAfterFailure = JSON.parse((await sync.appStorage.getItem('fitwizard-sync-cursor')) as string).cursors.notes;
    expect(cursorAfterFailure).toBe(cursorAfterFirst);

    server.failingTables.delete('notes');
    await sync.syncAll(USER, { client: server.client() });
    expect(local.items.map((n) => n.id).sort()).toEqual(['a', 'b']);
    consoleError.mockRestore();
  });

  it('starts from scratch for a different account', async () => {
    server.writeFromOtherDevice('notes', { id: 'a', data: { text: 'mine' } });
    const sync = await loadEngine();
    const local = { items: [] as Note[] };
    sync.registerCollection(noteCollection('notes', local));
    await sync.syncAll(USER, { client: server.client() });

    await sync.syncAll('user-2', { client: server.client() });

    const saved = JSON.parse((await sync.appStorage.getItem('fitwizard-sync-cursor')) as string);
    expect(saved.userId).toBe('user-2');
  });

  it('shares one run between overlapping calls', async () => {
    const sync = await loadEngine();
    sync.registerCollection(noteCollection('notes', { items: [] }));

    const [first, second] = [sync.syncAll(USER, { client: server.client() }), sync.syncAll(USER, { client: server.client() })];

    expect(first).toBe(second);
    await first;
  });
});

describe('deriveSyncStatus', () => {
  it('follows the precedence signed-out, offline, saving, error, synced', async () => {
    const { deriveSyncStatus } = await import('./status');
    const base = { signedIn: true, online: true, running: false, lastError: null };
    expect(deriveSyncStatus({ ...base, signedIn: false, online: false })).toBe('signed-out');
    expect(deriveSyncStatus({ ...base, online: false, running: true })).toBe('offline');
    expect(deriveSyncStatus({ ...base, running: true, lastError: 'x' })).toBe('saving');
    expect(deriveSyncStatus({ ...base, lastError: 'x' })).toBe('error');
    expect(deriveSyncStatus(base)).toBe('synced');
  });
});
