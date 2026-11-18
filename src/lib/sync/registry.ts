import type { SyncCollection } from '@/lib/sync/types';

const collections = new Map<string, SyncCollection<unknown>>();

/** Registers a store's collection. Registering the same table again replaces it. */
export function registerCollection<T>(collection: SyncCollection<T>): void {
  collections.set(collection.table, collection as SyncCollection<unknown>);
}

export function getRegisteredCollections(): SyncCollection<unknown>[] {
  return [...collections.values()];
}

/** Test helper. */
export function resetRegistryForTests(): void {
  collections.clear();
}
