import type {
  DailyNutritionLog,
  MacroTargets,
  MealEntry,
  MealTemplate,
  UserNutritionProfile,
} from '@/types/nutrition';
import { isFiniteNumber, isRecord, sanitizeList, toValidDate } from '@/lib/storage/sanitize';

/**
 * What the nutrition store saves on the device, and how saved data is checked
 * when read back. Malformed entries are dropped, never thrown.
 */

export const NUTRITION_STORE_NAME = 'fitwizard-nutrition-storage';
/** v1 (April 2026) saved only selectedDate. */
export const NUTRITION_STORE_VERSION = 2;

export interface PersistedNutritionState {
  profile: UserNutritionProfile | null;
  targets: MacroTargets | null;
  history: Record<string, DailyNutritionLog>;
  selectedDate: string;
  customFoods: MealEntry[];
  favorites: MealEntry[];
  savedMeals: MealTemplate[];
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function sanitizeTargets(value: unknown): MacroTargets | null {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.calories) ||
    !isFiniteNumber(value.protein) ||
    !isFiniteNumber(value.carbs) ||
    !isFiniteNumber(value.fats)
  ) {
    return null;
  }
  return { calories: value.calories, protein: value.protein, carbs: value.carbs, fats: value.fats };
}

export function sanitizeProfile(value: unknown): UserNutritionProfile | null {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.weight) ||
    !isFiniteNumber(value.height) ||
    !isFiniteNumber(value.age) ||
    typeof value.goal !== 'string' ||
    typeof value.activityLevel !== 'string'
  ) {
    return null;
  }
  return value as unknown as UserNutritionProfile;
}

export function sanitizeMeal(value: unknown, fallbackDate?: string): MealEntry | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isFiniteNumber(value.calories)
  ) {
    return null;
  }
  const timestamp = toValidDate(value.timestamp) ?? toValidDate(fallbackDate) ?? new Date(0);
  return {
    ...value,
    protein: isFiniteNumber(value.protein) ? value.protein : 0,
    carbs: isFiniteNumber(value.carbs) ? value.carbs : 0,
    fats: isFiniteNumber(value.fats) ? value.fats : 0,
    mealType: typeof value.mealType === 'string' ? value.mealType : 'snack',
    timestamp,
  } as unknown as MealEntry;
}

export function sanitizeDayLog(value: unknown, day: string): DailyNutritionLog | null {
  if (!isRecord(value) || !Array.isArray(value.meals)) {
    return null;
  }
  const targets = sanitizeTargets(value.targets) ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
  return {
    id: typeof value.id === 'string' ? value.id : day,
    date: typeof value.date === 'string' ? value.date : day,
    meals: sanitizeList(value.meals, (meal) => sanitizeMeal(meal, day)),
    water: isFiniteNumber(value.water) ? value.water : 0,
    targets,
    isWorkoutDay: value.isWorkoutDay === true,
  };
}

export function sanitizeMealTemplate(value: unknown): MealTemplate | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }
  return {
    ...value,
    items: sanitizeList(value.items, (item) => sanitizeMeal(item)),
    totalCalories: isFiniteNumber(value.totalCalories) ? value.totalCalories : 0,
    totalProtein: isFiniteNumber(value.totalProtein) ? value.totalProtein : 0,
    totalCarbs: isFiniteNumber(value.totalCarbs) ? value.totalCarbs : 0,
    totalFats: isFiniteNumber(value.totalFats) ? value.totalFats : 0,
  } as unknown as MealTemplate;
}

/** Checks saved nutrition data read back from storage. */
export function sanitizeNutritionPersistedState(state: unknown): PersistedNutritionState {
  const source = isRecord(state) ? state : {};

  const history: Record<string, DailyNutritionLog> = {};
  if (isRecord(source.history)) {
    for (const [day, log] of Object.entries(source.history)) {
      if (!DAY_KEY.test(day)) continue;
      const clean = sanitizeDayLog(log, day);
      if (clean) history[day] = clean;
    }
  }

  return {
    profile: sanitizeProfile(source.profile),
    targets: sanitizeTargets(source.targets),
    history,
    selectedDate:
      typeof source.selectedDate === 'string' && DAY_KEY.test(source.selectedDate) ? source.selectedDate : today(),
    customFoods: sanitizeList(source.customFoods, (meal) => sanitizeMeal(meal)),
    favorites: sanitizeList(source.favorites, (meal) => sanitizeMeal(meal)),
    savedMeals: sanitizeList(source.savedMeals, sanitizeMealTemplate),
  };
}

/** Picks what to save. Cheap (no validation), because it runs on every change. */
export function pickPersistedNutritionState(state: PersistedNutritionState): PersistedNutritionState {
  return {
    profile: state.profile,
    targets: state.targets,
    history: state.history,
    selectedDate: state.selectedDate,
    customFoods: state.customFoods,
    favorites: state.favorites,
    savedMeals: state.savedMeals,
  };
}
