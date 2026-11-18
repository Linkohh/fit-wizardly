import type { QueryResult, SyncClient, SyncFilterQuery, SyncRow, SyncUpdateQuery } from '@/lib/sync/types';

export const FAKE_USER = 'user-1';

// ---------------------------------------------------------------------------
// In-memory stand-in for Supabase. Like the real tables, it sets updated_at
// from its own clock on every write (migration 007's trigger).
// ---------------------------------------------------------------------------
export class FakeServer {
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
    const next: SyncRow = { user_id: FAKE_USER, deleted_at: null, ...row, updated_at: this.now() };
    if (index >= 0) rows[index] = next;
    else rows.push(next);
    return next;
  }

  client(): SyncClient {
    return {
      from: (table: string) => ({
        select: () => this.selectQuery(table),
        upsert: (rows: object[], options: { onConflict: string }) => {
          const conflictColumns = options.onConflict.split(',').map((column) => column.trim());
          this.upsertCalls += 1;
          if (this.failNextUpsert || this.failingTables.has(table)) {
            this.failNextUpsert = false;
            return Promise.resolve<QueryResult<unknown>>({ data: null, error: { message: 'network down' } });
          }
          for (const row of rows as SyncRow[]) {
            const existing = this.rows(table).findIndex((r) => conflictColumns.every((column) => r[column] === row[column]));
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

