import { afterEach, describe, expect, it } from 'vitest';
import {
    buildUserDataExport,
    collectUserDataExportSources,
    EXPORT_SECTIONS_BY_STORE,
    USER_DATA_EXPORT_VERSION,
    type UserDataExportSources,
} from './dataExport';
import { USER_DATA_STORE_NAMES } from '@/lib/storage/clearLocalUserData';
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

const sources: UserDataExportSources = {
    settings: { soundEnabled: true },
    planHistory: [{ id: 'plan-1' }],
    workoutLogs: [{ id: 'log-1' }],
    personalRecords: [{ id: 'pr-1' }],
    readinessLogs: [{ id: 'r-1' }],
    nutrition: {
        profile: { weightKg: 80 },
        targets: { calories: 2500 },
        history: { '2026-01-01': { id: '2026-01-01' } },
        customFoods: [{ id: 'cf-1' }],
        favorites: [{ id: 'fav-1' }],
        savedMeals: [{ id: 'sm-1' }],
    },
    bodyMeasurements: [{ id: 'm-1', weight: 80 }],
    currentPlan: { id: 'plan-1' },
    activeWorkout: null,
    trainingPreferences: { currentWeek: 2, preferredWeightUnit: 'kg' },
    achievements: { unlockedBadges: ['first_plan'], currentStreak: 3 },
    customExercises: [{ id: 'custom-1', name: 'Band pull-apart' }],
    exercisePreferences: {
        favorites: ['ex-1'],
        collections: { c1: { id: 'c1', name: 'Pull', exerciseIds: ['ex-1'] } },
        filterPresets: {},
        recentlyViewed: ['ex-2'],
    },
    wizardDraft: { currentStepIndex: 1 },
    onboarding: { isComplete: true },
    consent: { consentGivenAt: '2026-11-01T00:00:00.000Z', analytics: false, nutritionLookup: true },
    account: { email: 'a@example.com', profile: { id: 'user-a', display_name: 'A' } },
};

afterEach(() => {
    window.localStorage.clear();
    usePlanStore.setState(usePlanStore.getInitialState(), true);
    useAchievementStore.setState(useAchievementStore.getInitialState(), true);
    useCustomExerciseStore.setState(useCustomExerciseStore.getInitialState(), true);
    usePreferencesStore.setState(usePreferencesStore.getInitialState(), true);
    useAuthStore.setState({ user: null, profile: null });
});

describe('buildUserDataExport', () => {
    it('is version 3', () => {
        expect(USER_DATA_EXPORT_VERSION).toBe(3);
        expect(buildUserDataExport(sources).exportVersion).toBe(3);
    });

    it('keeps every version-2 key unchanged so old backups still read', () => {
        const result = buildUserDataExport(sources, new Date('2026-09-27T12:00:00.000Z'));

        expect(result.exportedAt).toBe('2026-09-27T12:00:00.000Z');
        expect(result.settings).toEqual(sources.settings);
        expect(result.planHistory).toEqual(sources.planHistory);
        expect(result.workoutLogs).toEqual(sources.workoutLogs);
        expect(result.personalRecords).toEqual(sources.personalRecords);
        expect(result.readinessLogs).toEqual(sources.readinessLogs);
        expect(result.nutrition).toEqual(sources.nutrition);
        expect(result.bodyMeasurements).toEqual(sources.bodyMeasurements);
    });

    it('adds the version-3 sections (DEBT-059)', () => {
        const result = buildUserDataExport(sources);

        expect(result.currentPlan).toEqual(sources.currentPlan);
        expect(result.trainingPreferences).toEqual(sources.trainingPreferences);
        expect(result.achievements).toEqual(sources.achievements);
        expect(result.customExercises).toEqual(sources.customExercises);
        expect(result.exercisePreferences).toEqual(sources.exercisePreferences);
        expect(result.wizardDraft).toEqual(sources.wizardDraft);
        expect(result.onboarding).toEqual(sources.onboarding);
        expect(result.consent).toEqual(sources.consent);
        expect(result.account).toEqual(sources.account);
    });

    it('serializes to JSON without dropping nested data', () => {
        const parsed = JSON.parse(JSON.stringify(buildUserDataExport(sources)));

        expect(parsed.nutrition.history['2026-01-01'].id).toBe('2026-01-01');
        expect(parsed.bodyMeasurements).toHaveLength(1);
        expect(parsed.exercisePreferences.collections.c1.exerciseIds).toEqual(['ex-1']);
    });
});

describe('export covers every persisted user-data store', () => {
    it('maps each store in USER_DATA_STORE_NAMES to at least one export section', () => {
        const mapped = Object.keys(EXPORT_SECTIONS_BY_STORE).sort();
        expect(mapped).toEqual([...USER_DATA_STORE_NAMES].sort());
        for (const name of USER_DATA_STORE_NAMES) {
            expect(EXPORT_SECTIONS_BY_STORE[name].length, name).toBeGreaterThan(0);
        }
    });

    it('collects a value for every mapped section from the live stores', () => {
        const collected = collectUserDataExportSources();
        const result = buildUserDataExport(collected);
        for (const keys of Object.values(EXPORT_SECTIONS_BY_STORE)) {
            for (const key of keys) {
                expect(key in result, key).toBe(true);
            }
        }
        // Empty stores export empty collections, not undefined.
        expect(Array.isArray(result.workoutLogs)).toBe(true);
        expect(Array.isArray(result.bodyMeasurements)).toBe(true);
        expect(Array.isArray(result.readinessLogs)).toBe(true);
        expect(Array.isArray(result.customExercises)).toBe(true);
        expect(result.nutrition).toMatchObject({
            history: expect.any(Object),
            customFoods: expect.any(Array),
            favorites: expect.any(Array),
            savedMeals: expect.any(Array),
        });
    });

    it('reads the data each store holds', () => {
        usePlanStore.setState({ currentWeek: 4, preferredWeightUnit: 'lbs' });
        useAchievementStore.setState({ unlockedBadges: ['first_plan'], longestStreak: 9 } as never);
        useCustomExerciseStore.setState({ customExercises: [{ id: 'custom-1', name: 'Band pull-apart' }] } as never);
        usePreferencesStore.setState({ favorites: ['ex-1'], collections: { c1: { id: 'c1' } }, recentlyViewed: ['ex-2'] } as never);

        const result = buildUserDataExport(collectUserDataExportSources());

        expect(result.trainingPreferences).toEqual({ currentWeek: 4, preferredWeightUnit: 'lbs' });
        expect(result.achievements).toMatchObject({ unlockedBadges: ['first_plan'], longestStreak: 9 });
        expect(result.customExercises).toEqual([{ id: 'custom-1', name: 'Band pull-apart' }]);
        expect(result.exercisePreferences).toMatchObject({ favorites: ['ex-1'], collections: { c1: { id: 'c1' } }, recentlyViewed: ['ex-2'] });
        expect(result.readinessLogs).toEqual(useReadinessStore.getState().logs);
        expect(result.bodyMeasurements).toEqual(useMeasurementsStore.getState().measurements);
        expect(result.nutrition.targets).toEqual(useNutritionStore.getState().targets);
    });

    it('exports only what stores save on the device, not their actions', () => {
        const result = buildUserDataExport(collectUserDataExportSources());
        const values = [result.achievements, result.wizardDraft, result.onboarding];
        for (const value of values) {
            expect(Object.values(value as object).some((entry) => typeof entry === 'function')).toBe(false);
        }
        expect(result.wizardDraft).toEqual(useWizardStore.persist.getOptions().partialize?.(useWizardStore.getState()));
        expect(result.onboarding).toEqual(useOnboardingStore.persist.getOptions().partialize?.(useOnboardingStore.getState()));
    });

    it('includes the consent flags', () => {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, '2026-11-01T00:00:00.000Z');
        window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
        window.localStorage.setItem(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY, 'false');

        expect(collectUserDataExportSources().consent).toEqual({
            consentGivenAt: '2026-11-01T00:00:00.000Z',
            analytics: true,
            nutritionLookup: false,
        });
    });

    it('includes the account email and profile when signed in, and nulls for guests', () => {
        expect(collectUserDataExportSources().account).toEqual({ email: null, profile: null });

        useAuthStore.setState({
            user: { id: 'user-a', email: 'a@example.com' } as never,
            profile: { id: 'user-a', display_name: 'A' } as never,
        });
        expect(collectUserDataExportSources().account).toEqual({
            email: 'a@example.com',
            profile: { id: 'user-a', display_name: 'A' },
        });
    });
});
