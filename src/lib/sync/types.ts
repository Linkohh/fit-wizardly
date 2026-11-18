/**
 * Cloud sync types (contract #5 in docs/project/CONTRACTS.md).
 *
 * Every cloud table (migration 007, plus `plans`) has `user_id`,
 * `updated_at` (set by the server) and `deleted_at` (a tombstone). A
 * SyncCollection maps one local store to one of those tables.
 */

export interface SyncRow {
  user_id: string;
  updated_at: string;
  deleted_at: string | null;
  [column: string]: unknown;
}

export interface SyncCollection<T> {
  /** Cloud table name, for example 'workout_logs'. */
  table: string;
  /** The key column besides user_id ('id', 'day'), or null for one-row-per-user tables. */
  keyColumn: string | null;
  /** Primary key for upserts, for example 'user_id,id'. */
  onConflict: string;
  /** Stable local id (or the YYYY-MM-DD day, or a constant for one-row tables). */
  key(item: T): string;
  toRow(item: T, userId: string): Omit<SyncRow, 'updated_at'>;
  fromRow(row: SyncRow): T;
  /** Current items from the Zustand store. */
  readLocal(): T[];
  /** Replaces the store's items (used after merging; must not mark anything dirty). */
  writeLocal(items: T[]): void;
  /** ISO timestamp of the item's last local edit; '' when unknown (treated as oldest). */
  getUpdatedAt(item: T): string;
}

export interface SyncResult {
  pulled: number;
  pushed: number;
  failed: number;
}

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error' | 'signed-out';

export interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * The small part of the Supabase query builder the engine uses. Written out
 * so tests can pass an in-memory fake; the real client is cast to it.
 */
export interface SyncFilterQuery extends PromiseLike<QueryResult<SyncRow[]>> {
  eq(column: string, value: string): SyncFilterQuery;
  gte(column: string, value: string): SyncFilterQuery;
  order(column: string, options: { ascending: boolean }): SyncFilterQuery;
  range(from: number, to: number): SyncFilterQuery;
}

export interface SyncUpdateQuery extends PromiseLike<QueryResult<unknown>> {
  eq(column: string, value: string): SyncUpdateQuery;
}

export interface SyncTableQuery {
  select(columns: string): SyncFilterQuery;
  upsert(rows: object[], options: { onConflict: string }): PromiseLike<QueryResult<unknown>>;
  update(values: object): SyncUpdateQuery;
}

export interface SyncClient {
  from(table: string): SyncTableQuery;
}
