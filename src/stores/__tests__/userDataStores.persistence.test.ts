import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MealEntry } from '@/types/nutrition';
import { sanitizeNutritionPersistedState } from '@/stores/nutritionStore.persistence';
import { sanitizeReadinessEntry } from '@/stores/readinessStore';
import { sanitizeAchievementState } from '@/stores/achievementStore';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: () => ({ user: null }) },
}));

const STORE_NAMES = [
  'fitwizard-nutrition-storage',
  'readiness-storage',
  'fitwizard-achievements',
  'fitwizard-custom-exercises',
  'fitwizard-plans',
  'fitwizard-measurements',
];

type PersistedStore = { persist: { hasHydrated: () => boolean } };

/** Fresh module copies, as if the app had just started. */
async function startApp() {
  vi.resetModules();
  const [nutrition, readiness, achievements, customExercises] = await Promise.all([
    import('@/stores/nutritionStore'),
    import('@/stores/readinessStore'),
    import('@/stores/achievementStore'),
    import('@/stores/customExerciseStore'),
  ]);
  const stores = {
    nutrition: nutrition.useNutritionStore,
    readiness: readiness.useReadinessStore,
    achievements: achievements.useAchievementStore,
    customExercises: customExercises.useCustomExerciseStore,
  };
  await vi.waitFor(() => {
    for (const store of Object.values(stores) as unknown as PersistedStore[]) {
      expect(store.persist.hasHydrated()).toBe(true);
    }
  });
  return stores;
}

async function savedValue(name: string): Promise<string | null> {
  const { appStorage } = await import('@/lib/storage/appStorage');
  return appStorage.getItem(name);
}

async function waitForSaved(name: string, contains: string) {
  await vi.waitFor(async () => {
    expect(await savedValue(name)).toContain(contains);
  });
}

function buildMeal(): MealEntry {
  return {
    id: 'meal-1',
    name: 'Oatmeal',
    calories: 400,
    protein: 30,
    carbs: 45,
    fats: 12,
    mealType: 'breakfast',
    timestamp: new Date('2026-11-17T08:00:00.000Z'),
  };
}

describe('user data stores save to the device', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await startApp();
    const { appStorage } = await import('@/lib/storage/appStorage');
    for (const name of STORE_NAMES) {
      await appStorage.removeItem(name);
    }
  });

  it('keeps nutrition profile, targets, meals and favourites after a restart', async () => {
    let stores = await startApp();
    const nutrition = stores.nutrition.getState();
    nutrition.setProfile(
      { weight: 80, height: 180, age: 30, gender: 'male', activityLevel: 'moderate', goal: 'maintain', dailyWaterGoal: 2500 } as never,
      { calories: 2500, protein: 150, carbs: 300, fats: 70 },
    );
    nutrition.logMeal(buildMeal());
    nutrition.toggleFavorite(buildMeal());
    await waitForSaved('fitwizard-nutrition-storage', '"favorites":[{');

    stores = await startApp();
    const state = stores.nutrition.getState();
    const day = state.selectedDate;

    expect(state.profile?.weight).toBe(80);
    expect(state.targets?.calories).toBe(2500);
    expect(state.history[day].meals.map((meal) => meal.name)).toEqual(['Oatmeal']);
    expect(state.history[day].meals[0].timestamp).toBeInstanceOf(Date);
    expect(state.favorites.map((meal) => meal.id)).toEqual(['meal-1']);
  });

  it('keeps readiness check-ins after a restart', async () => {
    let stores = await startApp();
    stores.readiness.getState().logReadiness({ sleepQuality: 4, muscleSoreness: 2, energyLevel: 4, stressLevel: 2 });
    await waitForSaved('readiness-storage', 'sleepQuality');

    stores = await startApp();

    expect(stores.readiness.getState().logs).toHaveLength(1);
    expect(stores.readiness.getState().logs[0].sleepQuality).toBe(4);
  });

  it('keeps achievements and custom exercises after a restart', async () => {
    let stores = await startApp();
    stores.achievements.getState().incrementPlansGenerated();
    stores.customExercises.getState().addCustomExercise({
      name: 'Landmine Press',
      primaryMuscles: ['shoulders'],
      secondaryMuscles: [],
      equipment: ['barbell'],
      cues: [],
      description: '',
    } as never);
    await waitForSaved('fitwizard-achievements', 'first_plan');
    await waitForSaved('fitwizard-custom-exercises', 'Landmine Press');

    stores = await startApp();

    expect(stores.achievements.getState().totalPlansGenerated).toBe(1);
    expect(stores.achievements.getState().unlockedBadges).toContain('first_plan');
    expect(stores.customExercises.getState().customExercises.map((e) => e.name)).toEqual(['Landmine Press']);
  });

  it('moves readiness check-ins saved by the previous app version out of localStorage', async () => {
    const oldEntry = { date: '2026-11-16', sleepQuality: 3, muscleSoreness: 3, energyLevel: 3, stressLevel: 3, overallScore: 3 };
    window.localStorage.setItem('readiness-storage', JSON.stringify({ state: { logs: [oldEntry] }, version: 0 }));

    const stores = await startApp();

    expect(stores.readiness.getState().logs).toEqual([oldEntry]);
    expect(window.localStorage.getItem('readiness-storage')).toBeNull();
    expect(await savedValue('readiness-storage')).toContain('2026-11-16');
  });

  it('moves achievements saved by the previous app version out of localStorage', async () => {
    window.localStorage.setItem(
      'fitwizard-achievements',
      JSON.stringify({ state: { totalPlansGenerated: 4, currentStreak: 2, unlockedBadges: ['first_plan'] }, version: 0 }),
    );

    const stores = await startApp();

    expect(stores.achievements.getState().totalPlansGenerated).toBe(4);
    expect(stores.achievements.getState().unlockedBadges).toEqual(['first_plan']);
    expect(window.localStorage.getItem('fitwizard-achievements')).toBeNull();
  });

  it('never writes this data to localStorage', async () => {
    const stores = await startApp();
    stores.nutrition.getState().logMeal(buildMeal());
    stores.readiness.getState().logReadiness({ sleepQuality: 4, muscleSoreness: 2, energyLevel: 4, stressLevel: 2 });
    await waitForSaved('readiness-storage', 'sleepQuality');

    for (const name of STORE_NAMES) {
      expect(window.localStorage.getItem(name)).toBeNull();
    }
  });
});

describe('clearLocalUserData', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('erases every user-data store from the device and resets them in memory', async () => {
    const stores = await startApp();
    stores.nutrition.getState().logMeal(buildMeal());
    stores.readiness.getState().logReadiness({ sleepQuality: 4, muscleSoreness: 2, energyLevel: 4, stressLevel: 2 });
    await waitForSaved('readiness-storage', 'sleepQuality');
    const { usePreferencesStore } = await import('@/stores/preferencesStore');
    usePreferencesStore.getState().addFavorite('barbell-squat');
    expect(window.localStorage.getItem('fitwizard-preferences')).toContain('barbell-squat');
    const { usePlanStore } = await import('@/stores/planStore');
    await vi.waitFor(() => expect(usePlanStore.persist.hasHydrated()).toBe(true));
    usePlanStore.setState({ currentWeek: 3 });
    await waitForSaved('fitwizard-plans', '"currentWeek":3');
    const { markDirty, countPendingChanges, flushOutboxWrites } = await import('@/lib/sync/outbox');
    markDirty('workout_logs', 'log-1');
    await flushOutboxWrites();
    expect(await savedValue('fitwizard-sync-outbox')).toContain('log-1');
    const { appStorage } = await import('@/lib/storage/appStorage');
    await appStorage.setItem('fitwizard-sync-cursor', '{"userId":"u","cursors":{}}');
    const { useWizardStore } = await import('@/stores/wizardStore');
    const { useOnboardingStore } = await import('@/stores/onboardingStore');
    useWizardStore.getState().setIsTrainer(true);
    useOnboardingStore.getState().setAvatarEmoji('🦾');
    expect(window.localStorage.getItem('fitwizard-wizard')).toContain('"isTrainer":true');
    expect(window.localStorage.getItem('fitwizard-onboarding')).toContain('🦾');

    const { clearLocalUserData, USER_DATA_STORE_NAMES } = await import('@/lib/storage/clearLocalUserData');
    await clearLocalUserData();

    for (const name of USER_DATA_STORE_NAMES) {
      expect(await savedValue(name)).toBeNull();
    }
    expect(await savedValue('fitwizard-sync-outbox')).toBeNull();
    expect(await savedValue('fitwizard-sync-cursor')).toBeNull();
    expect(usePreferencesStore.getState().favorites).toEqual([]);
    expect(window.localStorage.getItem('fitwizard-preferences')).toBeNull();
    expect(stores.readiness.getState().logs).toEqual([]);
    expect(Object.keys(stores.nutrition.getState().history)).toEqual([]);
    expect(usePlanStore.getState().currentWeek).toBe(1);
    expect(countPendingChanges()).toBe(0);
    expect(window.localStorage.getItem('fitwizard-wizard')).toBeNull();
    expect(window.localStorage.getItem('fitwizard-onboarding')).toBeNull();
    expect(useWizardStore.getState().selections.isTrainer).toBe(false);
  });

  it('erases a store that had not been opened yet, without its saved copy coming back', async () => {
    // Save check-ins, then simulate a fresh start where nothing has opened the readiness store.
    let stores = await startApp();
    stores.readiness.getState().logReadiness({ sleepQuality: 4, muscleSoreness: 2, energyLevel: 4, stressLevel: 2 });
    await waitForSaved('readiness-storage', 'sleepQuality');
    vi.resetModules();

    const { clearLocalUserData } = await import('@/lib/storage/clearLocalUserData');
    await clearLocalUserData();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const { useReadinessStore } = await import('@/stores/readinessStore');
    expect(useReadinessStore.getState().logs).toEqual([]);
    expect(await savedValue('readiness-storage')).toBeNull();

    // And after the next app start it is still gone.
    stores = await startApp();
    expect(stores.readiness.getState().logs).toEqual([]);
  });

  it('lists every store that saves user data', async () => {
    const { USER_DATA_STORE_NAMES } = await import('@/lib/storage/clearLocalUserData');
    expect([...USER_DATA_STORE_NAMES].sort()).toEqual(
      [...STORE_NAMES, 'fitwizard-preferences', 'fitwizard-wizard', 'fitwizard-onboarding'].sort(),
    );
  });
});

describe('load checks', () => {
  it('drops malformed nutrition entries and keeps the rest', () => {
    const state = sanitizeNutritionPersistedState({
      profile: { weight: 'heavy' },
      targets: { calories: 2000, protein: 150, carbs: 200, fats: 60 },
      history: {
        '2026-11-17': { meals: [buildMeal(), { id: 'no-calories', name: 'x' }], water: 500 },
        'not-a-day': { meals: [] },
        '2026-11-16': 'corrupt',
      },
      selectedDate: 'yesterday',
      favorites: [buildMeal(), null],
      savedMeals: [{ id: 'tpl', name: 'Morning oats', items: [buildMeal()] }, { name: 'no id' }],
    });

    expect(state.profile).toBeNull();
    expect(state.targets?.calories).toBe(2000);
    expect(Object.keys(state.history)).toEqual(['2026-11-17']);
    expect(state.history['2026-11-17'].meals.map((meal) => meal.id)).toEqual(['meal-1']);
    expect(state.history['2026-11-17'].water).toBe(500);
    expect(state.selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(state.favorites).toHaveLength(1);
    expect(state.savedMeals.map((tpl) => tpl.id)).toEqual(['tpl']);
  });

  it('drops readiness entries with out-of-range ratings', () => {
    expect(sanitizeReadinessEntry({ date: '2026-11-17', sleepQuality: 6, muscleSoreness: 2, energyLevel: 3, stressLevel: 2, overallScore: 3 })).toBeNull();
    expect(sanitizeReadinessEntry({ date: '2026-11-17', sleepQuality: 5, muscleSoreness: 2, energyLevel: 3, stressLevel: 2, overallScore: 3 })?.sleepQuality).toBe(5);
  });

  it('drops unknown badges and negative counters from saved achievements', () => {
    const state = sanitizeAchievementState({
      totalPlansGenerated: -3,
      currentStreak: 2.7,
      weeklyGoal: 0,
      unlockedBadges: ['first_plan', 'made_up_badge', 'first_plan'],
    });

    expect(state.totalPlansGenerated).toBe(0);
    expect(state.currentStreak).toBe(2);
    expect(state.weeklyGoal).toBe(1);
    expect(state.unlockedBadges).toEqual(['first_plan']);
  });
});
