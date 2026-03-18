import { EXERCISE_DATABASE } from '@/data/exercises';
import type { Exercise } from '@/types/fitness';
import type { ExerciseLibraryRecord } from './types';
import { adaptLegacyExercise } from './normalize';

export function getLegacyExerciseLibraryRecords() {
  return EXERCISE_DATABASE.map((exercise) => adaptLegacyExercise(exercise, 'legacy'));
}

export function adaptCustomExerciseRecord(exercise: Exercise): ExerciseLibraryRecord {
  return adaptLegacyExercise(exercise, 'custom');
}
