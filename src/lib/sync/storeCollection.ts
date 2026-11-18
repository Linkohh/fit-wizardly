import { waitForHydration } from '@/lib/storage/hydration';
import { markDirty } from '@/lib/sync/outbox';
import type { SyncCollection, SyncRow } from '@/lib/sync/types';

/**
 * Turns Zustand stores into a SyncCollection (contract #5, Lane E Day 5),
 * and tracks their changes so every store action marks the right record dirty.
 *
 * Why a tracker instead of a markDirty() call in each action: the stores are
 * immutable, so an edited record is a new object. Comparing the records
 * before and after each change catches every action, including ones added
 * later. The outbox entry's time is the record's local edit time, so stored
 * items don't need an `updatedAt` field: a record with no outbox entry has
 * already been synced (or came from the cloud), so the cloud copy wins.
 */

/** The parts of a persisted Zustand store the sync layer uses. */
export interface SyncableStore {
  subscribe: (listener: () => void) => () => void;
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

export interface TrackedStore {
  store: SyncableStore;
  /** The store's persist name, used to wait for its saved copy to load. */
  persistName: string;
}

export interface StoreCollectionOptions<T> {
  table: string;
  keyColumn: string | null;
  onConflict: string;
  /** The stores this collection reads; a change in any of them is checked. */
  stores: TrackedStore[];
  readItems: () => T[];
  /** Replaces the local items with the merged ones. */
  writeItems: (items: T[]) => void;
  key: (item: T) => string;
  toRow: (item: T, userId: string) => Omit<SyncRow, 'updated_at'>;
  /** Must throw on a malformed row (the engine skips it). */
  fromRow: (row: SyncRow) => T;
  /** Whether two versions of a record are the same. Defaults to `===`. */
  isSame?: (a: T, b: T) => boolean;
}

export interface StoreCollection<T> extends SyncCollection<T> {
  /**
   * Starts marking changes dirty. Waits for each store's saved copy to load
   * first, so loading it isn't mistaken for edits. Returns a stop function.
   */
  startTracking: () => Promise<() => void>;
}

export function createStoreCollection<T>(options: StoreCollectionOptions<T>): StoreCollection<T> {
  const { key, readItems } = options;
  const isSame = options.isSame ?? ((a: T, b: T) => a === b);
  // True while the engine writes pulled records, so they aren't pushed back.
  let applyingRemote = false;

  const snapshot = () => {
    const byKey = new Map<string, T>();
    for (const item of readItems()) byKey.set(key(item), item);
    return byKey;
  };

  return {
    table: options.table,
    keyColumn: options.keyColumn,
    onConflict: options.onConflict,
    key,
    toRow: options.toRow,
    fromRow: options.fromRow,
    readLocal: readItems,
    writeLocal: (items) => {
      applyingRemote = true;
      try {
        options.writeItems(items);
      } finally {
        applyingRemote = false;
      }
    },
    // Local edit times live in the outbox; see the comment at the top.
    getUpdatedAt: () => '',

    startTracking: async () => {
      await Promise.all(options.stores.map(({ store, persistName }) => waitForHydration(store, persistName)));
      let previous = snapshot();

      const onChange = () => {
        const next = snapshot();
        if (!applyingRemote) {
          for (const [itemKey, item] of next) {
            const before = previous.get(itemKey);
            if (!before || !isSame(before, item)) markDirty(options.table, itemKey);
          }
          for (const itemKey of previous.keys()) {
            if (!next.has(itemKey)) markDirty(options.table, itemKey, { deleted: true });
          }
        }
        previous = next;
      };

      const unsubscribers = options.stores.map(({ store }) => store.subscribe(onChange));
      return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    },
  };
}

/** Field-by-field `===` comparison, for one-row records assembled from several store fields. */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  const keys = Object.keys(a) as Array<keyof T>;
  return keys.length === Object.keys(b).length && keys.every((field) => a[field] === b[field]);
}

/** Throws when a row's JSON column didn't pass the store's load checks. */
export function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Malformed ${what}`);
  return value;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * True for a valid `YYYY-MM-DD` day. Items whose day can't be stored in a
 * DATE column are left out of sync: one bad value would fail a whole batch.
 */
export function isStorableDay(value: string): boolean {
  return DAY_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
