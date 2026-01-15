import { suggestExercises } from '../suggestExercises';
import { describe, it, expect } from 'vitest';

describe('suggestExercises', () => {
    it('returns empty array if no muscles selected', () => {
        const result = suggestExercises({
            muscles: [],
            equipment: ['dumbbells']
        });
        expect(result).toHaveLength(0);
    });

    it('filters by equipment', () => {
        const result = suggestExercises({
            muscles: ['chest'],
            equipment: ['bodyweight'] // Only bodyweight
        });
        // Should include Push-Up
        expect(result.some(ex => ex.name === 'Push-Up')).toBe(true);
        // Should NOT include Barbell Bench Press (requires barbell)
        expect(result.some(ex => ex.name.includes('Barbell'))).toBe(false);
    });

    it('filters by muscle', () => {
        const result = suggestExercises({
            muscles: ['quads'],
            equipment: ['bodyweight']
        });
        // Should include Squat variants
        expect(result.some(ex => ex.primaryMuscles.includes('quads'))).toBe(true);
        // Should NOT include chest exercises
        expect(result.some(ex => ex.primaryMuscles.includes('chest'))).toBe(false);
    });

    it('respects limit', () => {
        const result = suggestExercises({
            muscles: ['chest', 'triceps'],
            equipment: ['dumbbells', 'bodyweight'],
            limit: 2
        });
        expect(result.length).toBeLessThanOrEqual(2);
    });
});
