import { describe, expect, it } from 'vitest';
import { buildUserDataExport, USER_DATA_EXPORT_VERSION } from './dataExport';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useMeasurementsStore } from '@/stores/measurementsStore';

const sources = {
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
};

describe('buildUserDataExport', () => {
    it('keeps the original export keys and adds nutrition and body measurements', () => {
        const result = buildUserDataExport(sources, new Date('2026-09-27T12:00:00.000Z'));

        expect(result.exportVersion).toBe(USER_DATA_EXPORT_VERSION);
        expect(result.exportedAt).toBe('2026-09-27T12:00:00.000Z');
        expect(result.settings).toEqual(sources.settings);
        expect(result.planHistory).toEqual(sources.planHistory);
        expect(result.workoutLogs).toEqual(sources.workoutLogs);
        expect(result.personalRecords).toEqual(sources.personalRecords);
        expect(result.readinessLogs).toEqual(sources.readinessLogs);
        expect(result.nutrition).toEqual(sources.nutrition);
        expect(result.bodyMeasurements).toEqual(sources.bodyMeasurements);
    });

    it('serializes to JSON without dropping nutrition or measurement data', () => {
        const parsed = JSON.parse(JSON.stringify(buildUserDataExport(sources)));

        expect(parsed.nutrition.history['2026-01-01'].id).toBe('2026-01-01');
        expect(parsed.bodyMeasurements).toHaveLength(1);
    });

    it('accepts live store state (empty stores export empty collections, not undefined)', () => {
        const nutrition = useNutritionStore.getState();
        const result = buildUserDataExport({
            ...sources,
            nutrition: {
                profile: nutrition.profile,
                targets: nutrition.targets,
                history: nutrition.history,
                customFoods: nutrition.customFoods,
                favorites: nutrition.favorites,
                savedMeals: nutrition.savedMeals,
            },
            bodyMeasurements: useMeasurementsStore.getState().measurements,
        });

        expect(result.nutrition).toMatchObject({
            history: expect.any(Object),
            customFoods: expect.any(Array),
            favorites: expect.any(Array),
            savedMeals: expect.any(Array),
        });
        expect(Array.isArray(result.bodyMeasurements)).toBe(true);
    });
});
