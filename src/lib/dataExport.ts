/**
 * Builds the JSON payload for the Profile "Export my data" action
 * (GDPR Art. 20 - data portability).
 *
 * `buildUserDataExport` is a pure function so it can be unit-tested without
 * rendering the Profile page; `collectUserDataExportSources` reads the live
 * stores. Version-2 top-level keys are kept unchanged so older backups stay
 * readable; version 3 adds sections and never renames.
 *
 * Rule from docs/SESSION_LOG.md: any new stored data type must be disclosed in
 * Legal.tsx AND included here. `EXPORT_SECTIONS_BY_STORE` maps every
 * persisted user-data store to its export keys, and the test fails if a store
 * in `USER_DATA_STORE_NAMES` has no section.
 */

import { usePlanStore } from '@/stores/planStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useMeasurementsStore } from '@/stores/measurementsStore';
import { useReadinessStore } from '@/stores/readinessStore';
import { useAchievementStore } from '@/stores/achievementStore';
import { useCustomExerciseStore } from '@/stores/customExerciseStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useWizardStore } from '@/stores/wizardStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';
import {
    ANALYTICS_CONSENT_STORAGE_KEY,
    CONSENT_STORAGE_KEY,
    NUTRITION_LOOKUP_CONSENT_STORAGE_KEY,
} from '@/lib/consent';

export interface NutritionExportSource {
    profile: unknown;
    targets: unknown;
    history: unknown;
    customFoods: unknown;
    favorites: unknown;
    savedMeals: unknown;
}

/** Exercise library data from `fitwizard-preferences` (settings stay in the v2 `settings` key). */
export interface ExercisePreferencesExport {
    favorites: unknown;
    collections: unknown;
    filterPresets: unknown;
    recentlyViewed: unknown;
}

export interface ConsentExport {
    /** The value saved when the user accepted the welcome notice (a timestamp), or null. */
    consentGivenAt: string | null;
    analytics: boolean;
    nutritionLookup: boolean;
}

export interface TrainingPreferencesExport {
    currentWeek: unknown;
    preferredWeightUnit: unknown;
}

export interface AccountExport {
    email: string | null;
    /** The Supabase `profiles` row for the signed-in user; null for guests. */
    profile: unknown;
}

export interface UserDataExportSources {
    // Version 2
    settings: unknown;
    planHistory: unknown;
    workoutLogs: unknown;
    personalRecords: unknown;
    readinessLogs: unknown;
    nutrition: NutritionExportSource;
    bodyMeasurements: unknown;
    // Version 3
    currentPlan: unknown;
    activeWorkout: unknown;
    trainingPreferences: TrainingPreferencesExport;
    achievements: unknown;
    customExercises: unknown;
    exercisePreferences: ExercisePreferencesExport;
    wizardDraft: unknown;
    onboarding: unknown;
    consent: ConsentExport;
    account: AccountExport;
}

export interface UserDataExport extends UserDataExportSources {
    exportVersion: number;
    exportedAt: string;
}

export const USER_DATA_EXPORT_VERSION = 3;

/**
 * Which export keys hold each persisted user-data store (names from
 * `USER_DATA_STORE_NAMES` in `src/lib/storage/clearLocalUserData.ts`).
 */
export const EXPORT_SECTIONS_BY_STORE: Readonly<Record<string, readonly (keyof UserDataExportSources)[]>> = {
    'fitwizard-plans': ['currentPlan', 'planHistory', 'workoutLogs', 'personalRecords', 'activeWorkout', 'trainingPreferences'],
    'fitwizard-nutrition-storage': ['nutrition'],
    'fitwizard-measurements': ['bodyMeasurements'],
    'readiness-storage': ['readinessLogs'],
    'fitwizard-achievements': ['achievements'],
    'fitwizard-custom-exercises': ['customExercises'],
    'fitwizard-preferences': ['settings', 'exercisePreferences'],
    'fitwizard-wizard': ['wizardDraft'],
    'fitwizard-onboarding': ['onboarding'],
};

export function buildUserDataExport(
    sources: UserDataExportSources,
    now: Date = new Date()
): UserDataExport {
    return {
        exportVersion: USER_DATA_EXPORT_VERSION,
        exportedAt: now.toISOString(),
        settings: sources.settings,
        planHistory: sources.planHistory,
        workoutLogs: sources.workoutLogs,
        personalRecords: sources.personalRecords,
        readinessLogs: sources.readinessLogs,
        nutrition: {
            profile: sources.nutrition.profile,
            targets: sources.nutrition.targets,
            history: sources.nutrition.history,
            customFoods: sources.nutrition.customFoods,
            favorites: sources.nutrition.favorites,
            savedMeals: sources.nutrition.savedMeals,
        },
        bodyMeasurements: sources.bodyMeasurements,
        currentPlan: sources.currentPlan,
        activeWorkout: sources.activeWorkout,
        trainingPreferences: {
            currentWeek: sources.trainingPreferences.currentWeek,
            preferredWeightUnit: sources.trainingPreferences.preferredWeightUnit,
        },
        achievements: sources.achievements,
        customExercises: sources.customExercises,
        exercisePreferences: {
            favorites: sources.exercisePreferences.favorites,
            collections: sources.exercisePreferences.collections,
            filterPresets: sources.exercisePreferences.filterPresets,
            recentlyViewed: sources.exercisePreferences.recentlyViewed,
        },
        wizardDraft: sources.wizardDraft,
        onboarding: sources.onboarding,
        consent: {
            consentGivenAt: sources.consent.consentGivenAt,
            analytics: sources.consent.analytics,
            nutritionLookup: sources.consent.nutritionLookup,
        },
        account: {
            email: sources.account.email,
            profile: sources.account.profile,
        },
    };
}

interface PersistedStore<S> {
    getState: () => S;
    persist: { getOptions: () => { partialize?: (state: S) => unknown } };
}

/** What the store saves on the device: its `partialize` output, so actions and UI-only state are left out. */
function persistedSnapshot<S>(store: PersistedStore<S>): unknown {
    const state = store.getState();
    const partialize = store.persist.getOptions().partialize;
    return partialize ? partialize(state) : state;
}

function readLocalStorage(key: string): string | null {
    try {
        return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

/** Reads every persisted user-data store, the consent flags and the account profile. */
export function collectUserDataExportSources(): UserDataExportSources {
    const plans = usePlanStore.getState();
    const nutrition = useNutritionStore.getState();
    const preferences = usePreferencesStore.getState();
    const auth = useAuthStore.getState();

    return {
        settings: preferences.settings,
        planHistory: plans.planHistory,
        workoutLogs: plans.workoutLogs,
        personalRecords: plans.personalRecords,
        readinessLogs: useReadinessStore.getState().logs,
        nutrition: {
            profile: nutrition.profile,
            targets: nutrition.targets,
            history: nutrition.history,
            customFoods: nutrition.customFoods,
            favorites: nutrition.favorites,
            savedMeals: nutrition.savedMeals,
        },
        bodyMeasurements: useMeasurementsStore.getState().measurements,
        currentPlan: plans.currentPlan,
        activeWorkout: plans.activeWorkout,
        trainingPreferences: {
            currentWeek: plans.currentWeek,
            preferredWeightUnit: plans.preferredWeightUnit,
        },
        achievements: persistedSnapshot(useAchievementStore),
        customExercises: useCustomExerciseStore.getState().customExercises,
        exercisePreferences: {
            favorites: preferences.favorites,
            collections: preferences.collections,
            filterPresets: preferences.filterPresets,
            recentlyViewed: preferences.recentlyViewed,
        },
        wizardDraft: persistedSnapshot(useWizardStore),
        onboarding: persistedSnapshot(useOnboardingStore),
        consent: {
            consentGivenAt: readLocalStorage(CONSENT_STORAGE_KEY),
            analytics: readLocalStorage(ANALYTICS_CONSENT_STORAGE_KEY) === 'true',
            nutritionLookup: readLocalStorage(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY) === 'true',
        },
        account: {
            email: auth.user?.email ?? null,
            profile: auth.profile,
        },
    };
}

/** Saves the export as `fitwizard-backup-YYYY-MM-DD.json`. Throws if the browser can't create the file. */
export function downloadUserDataExport(now: Date = new Date()): void {
    const data = buildUserDataExport(collectUserDataExportSources(), now);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitwizard-backup-${now.toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
