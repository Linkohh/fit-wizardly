import { describe, expect, it } from 'vitest';
import { EXERCISE_DATABASE } from '@/data/exercises';
import {
  createExerciseCatalogIndex,
  filterExercisesFromIndex,
} from '@/lib/exerciseCatalogIndex';
import type { ExerciseCategory, MuscleGroup } from '@/types/fitness';

function manualFilter(
  search: string,
  category: ExerciseCategory | 'all' = 'all',
  muscle: MuscleGroup | 'all' = 'all'
) {
  return EXERCISE_DATABASE.filter((exercise) => {
    if (category !== 'all' && exercise.category !== category) {
      return false;
    }

    if (
      muscle !== 'all' &&
      !exercise.primaryMuscles.includes(muscle) &&
      !exercise.secondaryMuscles.includes(muscle)
    ) {
      return false;
    }

    if (search.trim() === '') {
      return true;
    }

    const query = search.toLowerCase();
    return (
      exercise.name.toLowerCase().includes(query) ||
      exercise.primaryMuscles.some((item) => item.includes(query))
    );
  }).map((exercise) => exercise.id);
}

describe('exerciseCatalogIndex', () => {
  it('matches the legacy filter behavior for category, muscle, and search', () => {
    const index = createExerciseCatalogIndex(EXERCISE_DATABASE);
    const filters = [
      { category: 'strength', difficulty: 'all', equipment: 'all', muscle: 'all', search: '' },
      { category: 'all', difficulty: 'all', equipment: 'all', muscle: 'chest', search: '' },
      { category: 'all', difficulty: 'all', equipment: 'all', muscle: 'all', search: 'bench' },
      { category: 'strength', difficulty: 'all', equipment: 'all', muscle: 'chest', search: 'press' },
    ] as const;

    filters.forEach((options) => {
      const indexedIds = filterExercisesFromIndex(index, options).map(
        (exercise) => exercise.id
      );
      const manualIds = manualFilter(
        options.search,
        options.category,
        options.muscle
      );

      expect(indexedIds).toEqual(manualIds);
    });
  });
});
