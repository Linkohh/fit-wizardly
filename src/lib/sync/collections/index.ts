import { registerCollection } from '@/lib/sync/registry';
import type { StoreCollection } from '@/lib/sync/storeCollection';
import { bodyMeasurementsCollection, readinessEntriesCollection } from '@/lib/sync/collections/body';
import { nutritionDaysCollection, nutritionSettingsCollection } from '@/lib/sync/collections/nutrition';
import { personalRecordsCollection, workoutLogsCollection } from '@/lib/sync/collections/training';
import { userStateCollection } from '@/lib/sync/collections/userState';

/** Every collection in migration 007, in the order they sync. Plans join on Day 7. */
export const SYNC_COLLECTIONS = [
  workoutLogsCollection,
  personalRecordsCollection,
  nutritionDaysCollection,
  nutritionSettingsCollection,
  bodyMeasurementsCollection,
  readinessEntriesCollection,
  userStateCollection,
] as const;

let started: Promise<() => void> | null = null;

function registerAndTrack<T>(collection: StoreCollection<T>): Promise<() => void> {
  registerCollection(collection);
  return collection.startTracking();
}

/**
 * Registers every collection with the engine and starts tracking local
 * changes. Safe to call more than once. App.tsx calls it at startup, signed in
 * or not; the sync triggers call it again before their first run.
 */
export function startSyncCollections(): Promise<() => void> {
  if (!started) {
    started = (async () => {
      // One call per collection keeps each one's item type (no casts).
      const stops = await Promise.all([
        registerAndTrack(workoutLogsCollection),
        registerAndTrack(personalRecordsCollection),
        registerAndTrack(nutritionDaysCollection),
        registerAndTrack(nutritionSettingsCollection),
        registerAndTrack(bodyMeasurementsCollection),
        registerAndTrack(readinessEntriesCollection),
        registerAndTrack(userStateCollection),
      ]);
      return () => {
        stops.forEach((stop) => stop());
        started = null;
      };
    })();
  }
  return started;
}
