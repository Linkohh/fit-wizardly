import type { Exercise } from '@/types/fitness';
import { loadExerciseDatabase } from '@/lib/exerciseRepository';
import type { ExerciseLibraryRecord } from './types';
import { adaptLegacyExercise } from './normalize';

export async function loadLegacyExerciseLibraryRecords() {
  const exercises = await loadExerciseDatabase();
  return exercises.map((exercise) => adaptLegacyExercise(exercise, 'legacy'));
}

export function adaptCustomExerciseRecord(
  exercise: Exercise
): ExerciseLibraryRecord {
  return adaptLegacyExercise(exercise, 'custom');
}
