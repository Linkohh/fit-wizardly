import { migratingAppStorage } from '@/lib/storage/appStorage';
import { waitForHydration } from '@/lib/storage/hydration';

/**
 * Every user-data store kept on the device (ADR 11). Keep this list in sync
 * when a store starts persisting user data.
 */
const USER_DATA_STORES = [
  { name: 'fitwizard-plans', load: async () => (await import('@/stores/planStore')).usePlanStore },
  { name: 'fitwizard-nutrition-storage', load: async () => (await import('@/stores/nutritionStore')).useNutritionStore },
  { name: 'fitwizard-measurements', load: async () => (await import('@/stores/measurementsStore')).useMeasurementsStore },
  { name: 'readiness-storage', load: async () => (await import('@/stores/readinessStore')).useReadinessStore },
  { name: 'fitwizard-achievements', load: async () => (await import('@/stores/achievementStore')).useAchievementStore },
  { name: 'fitwizard-custom-exercises', load: async () => (await import('@/stores/customExerciseStore')).useCustomExerciseStore },
  // Exercise favourites, collections and settings. Kept in localStorage and
  // synced to Supabase (user_exercise_preferences); removed here for erase/delete.
  { name: 'fitwizard-preferences', load: async () => (await import('@/stores/preferencesStore')).usePreferencesStore },
  // Answers in progress (goal, constraints such as injuries, equipment) and
  // onboarding answers. Kept in localStorage; sign-out also clears them.
  { name: 'fitwizard-wizard', load: async () => (await import('@/stores/wizardStore')).useWizardStore },
  { name: 'fitwizard-onboarding', load: async () => (await import('@/stores/onboardingStore')).useOnboardingStore },
] as const;

export const USER_DATA_STORE_NAMES: readonly string[] = USER_DATA_STORES.map((store) => store.name);

/** Sync bookkeeping saved on the device: unsent changes, pull positions (Day 4) and which accounts this device has uploaded to (Day 6). */
const SYNC_STORAGE_KEYS = ['fitwizard-sync-outbox', 'fitwizard-sync-cursor', 'fitwizard-sync-first-upload'] as const;

interface ResettableStore {
  getInitialState: () => object;
  setState: (state: object, replace: true) => void;
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

/**
 * Erases every persisted user-data store from this device and resets those
 * stores in memory. Used by account deletion and "Erase data on this device"
 * (contract #2). Stores are loaded on demand to keep them out of the startup
 * bundle.
 */
export async function clearLocalUserData(): Promise<void> {
  for (const { name, load } of USER_DATA_STORES) {
    try {
      const store = (await load()) as unknown as ResettableStore;
      // A store loaded just now may still be reading its saved copy; if we
      // reset before that finishes, the read merges the old data back in.
      await waitForHydration(store, name);
      // Reset first: the persist write it triggers is queued before the removal below.
      store.setState(store.getInitialState(), true);
    } catch (error) {
      console.error(`[FitWizard] Could not reset "${name}" in memory.`, error);
    }
    await migratingAppStorage.removeItem(name);
    // Belt and braces: if the reset's write landed after the removal, remove again.
    if ((await migratingAppStorage.getItem(name)) !== null) {
      await migratingAppStorage.removeItem(name);
    }
  }

  for (const key of SYNC_STORAGE_KEYS) {
    await migratingAppStorage.removeItem(key);
  }
  // Forget unsent changes held in memory too, not just the saved copy.
  const { clearOutbox } = await import('@/lib/sync/outbox');
  await clearOutbox();
}
