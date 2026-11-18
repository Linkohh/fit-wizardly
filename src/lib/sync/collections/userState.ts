import {
  ACHIEVEMENTS_STORE_NAME,
  sanitizeAchievementState,
  useAchievementStore,
  type PersistedAchievementState,
} from '@/stores/achievementStore';
import { CUSTOM_EXERCISES_STORE_NAME, sanitizeCustomExercise, useCustomExerciseStore } from '@/stores/customExerciseStore';
import { sanitizeList, isRecord } from '@/lib/storage/sanitize';
import { createStoreCollection } from '@/lib/sync/storeCollection';
import type { Exercise } from '@/types/fitness';

const STATE_KEY = 'state';

/** Synced achievement fields. `newBadges` (unseen toasts) stays on the device. */
type SyncedAchievements = Omit<PersistedAchievementState, 'newBadges'>;

const ACHIEVEMENT_FIELDS = [
  'totalPlansGenerated',
  'currentStreak',
  'longestStreak',
  'lastActivityDate',
  'weeklyGoal',
  'weeklyProgress',
  'weekStart',
  'userName',
  'unlockedBadges',
] as const satisfies ReadonlyArray<keyof SyncedAchievements>;

export interface UserState {
  achievements: SyncedAchievements;
  customExercises: Exercise[];
}

function readAchievements(): SyncedAchievements {
  const state = useAchievementStore.getState();
  return Object.fromEntries(ACHIEVEMENT_FIELDS.map((field) => [field, state[field]])) as SyncedAchievements;
}

/**
 * `user_state` (migration 007): achievements and custom exercises, one row
 * per user. Exercise favourites are left out on purpose: they already sync
 * through `user_exercise_preferences` (src/lib/preferences/preferencesRepo.ts),
 * and two copies would fight. The `favorite_exercises` column keeps its default.
 */
export const userStateCollection = createStoreCollection<UserState>({
  table: 'user_state',
  keyColumn: null,
  onConflict: 'user_id',
  stores: [
    { store: useAchievementStore, persistName: ACHIEVEMENTS_STORE_NAME },
    { store: useCustomExerciseStore, persistName: CUSTOM_EXERCISES_STORE_NAME },
  ],
  readItems: () => [{ achievements: readAchievements(), customExercises: useCustomExerciseStore.getState().customExercises }],
  writeItems: (items) => {
    const remote = items[0];
    if (!remote) return; // Deleted in the cloud: keep this device's copy rather than zero the streak.
    useAchievementStore.setState(remote.achievements);
    useCustomExerciseStore.setState({ customExercises: remote.customExercises });
  },
  key: () => STATE_KEY,
  isSame: (a, b) =>
    a.customExercises === b.customExercises &&
    ACHIEVEMENT_FIELDS.every((field) => a.achievements[field] === b.achievements[field]),
  toRow: (state, userId) => ({
    user_id: userId,
    achievements: state.achievements,
    custom_exercises: state.customExercises,
    deleted_at: null,
  }),
  fromRow: (row) => {
    if (!isRecord(row)) throw new Error('Malformed user_state row');
    const { newBadges: _unseen, ...achievements } = sanitizeAchievementState(row.achievements);
    return {
      achievements,
      customExercises: sanitizeList(row.custom_exercises, sanitizeCustomExercise),
    };
  },
});
