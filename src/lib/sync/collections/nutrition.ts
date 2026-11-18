import { useNutritionStore } from '@/stores/nutritionStore';
import {
  NUTRITION_STORE_NAME,
  sanitizeDayLog,
  sanitizeMeal,
  sanitizeMealTemplate,
  sanitizeProfile,
  sanitizeTargets,
} from '@/stores/nutritionStore.persistence';
import { sanitizeList, isRecord } from '@/lib/storage/sanitize';
import { createStoreCollection, isStorableDay, required, shallowEqual } from '@/lib/sync/storeCollection';
import type { DailyNutritionLog, MacroTargets, MealEntry, MealTemplate, UserNutritionProfile } from '@/types/nutrition';

const nutritionStores = [{ store: useNutritionStore, persistName: NUTRITION_STORE_NAME }];

export interface NutritionDay {
  day: string;
  log: DailyNutritionLog;
}

/** `nutrition_days` (migration 007): one row per logged day, keyed by `YYYY-MM-DD`. */
export const nutritionDaysCollection = createStoreCollection<NutritionDay>({
  table: 'nutrition_days',
  keyColumn: 'day',
  onConflict: 'user_id,day',
  stores: nutritionStores,
  readItems: () =>
    Object.entries(useNutritionStore.getState().history)
      .filter(([day]) => isStorableDay(day))
      .map(([day, log]) => ({ day, log })),
  writeItems: (days) => {
    // Keep days that sync leaves out (unstorable keys) rather than drop them.
    const kept = Object.fromEntries(
      Object.entries(useNutritionStore.getState().history).filter(([day]) => !isStorableDay(day)),
    );
    useNutritionStore.setState({ history: { ...kept, ...Object.fromEntries(days.map(({ day, log }) => [day, log])) } });
  },
  key: (item) => item.day,
  isSame: (a, b) => a.log === b.log,
  toRow: ({ day, log }, userId) => ({ user_id: userId, day, log, deleted_at: null }),
  fromRow: (row) => {
    const day = String(row.day).slice(0, 10);
    return { day, log: required(sanitizeDayLog(row.log, day), 'nutrition_days row') };
  },
});

export interface NutritionSettings {
  profile: UserNutritionProfile | null;
  targets: MacroTargets | null;
  customFoods: MealEntry[];
  favorites: MealEntry[];
  savedMeals: MealTemplate[];
}

const SETTINGS_KEY = 'settings';

/** `nutrition_settings` (migration 007): one row per user. */
export const nutritionSettingsCollection = createStoreCollection<NutritionSettings>({
  table: 'nutrition_settings',
  keyColumn: null,
  onConflict: 'user_id',
  stores: nutritionStores,
  readItems: () => {
    const { profile, targets, customFoods, favorites, savedMeals } = useNutritionStore.getState();
    const isEmpty = !profile && !targets && customFoods.length === 0 && favorites.length === 0 && savedMeals.length === 0;
    return isEmpty ? [] : [{ profile, targets, customFoods, favorites, savedMeals }];
  },
  writeItems: (items) => {
    const settings = items[0];
    useNutritionStore.setState(
      settings ?? { profile: null, targets: null, customFoods: [], favorites: [], savedMeals: [] },
    );
  },
  key: () => SETTINGS_KEY,
  isSame: shallowEqual,
  toRow: (settings, userId) => ({
    user_id: userId,
    profile: settings.profile,
    targets: settings.targets,
    custom_foods: settings.customFoods,
    favorites: settings.favorites,
    saved_meals: settings.savedMeals,
    deleted_at: null,
  }),
  fromRow: (row) => {
    if (!isRecord(row)) throw new Error('Malformed nutrition_settings row');
    return {
      profile: sanitizeProfile(row.profile),
      targets: sanitizeTargets(row.targets),
      customFoods: sanitizeList(row.custom_foods, (meal) => sanitizeMeal(meal)),
      favorites: sanitizeList(row.favorites, (meal) => sanitizeMeal(meal)),
      savedMeals: sanitizeList(row.saved_meals, sanitizeMealTemplate),
    };
  },
});
