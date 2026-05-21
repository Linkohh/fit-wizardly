import type { Exercise } from '@/types/fitness';
import type { ExerciseLibraryRecord } from './types';
import { adaptLegacyExercise } from './normalize';

const EXERCISE_ASSET_VERSION = 'v1';
const LEGACY_ASSET_PATH = `${import.meta.env.BASE_URL}exercise-data/legacy-exercises.${EXERCISE_ASSET_VERSION}.json`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLegacyExercise(value: unknown): value is Exercise {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.primaryMuscles) &&
    Array.isArray(value.secondaryMuscles) &&
    Array.isArray(value.equipment)
  );
}

export async function loadLegacyExerciseLibraryRecords() {
  const exercises = await loadLegacyExercises();
  return exercises.map((exercise) => adaptLegacyExercise(exercise, 'legacy'));
}

export async function loadLegacyExercises(): Promise<Exercise[]> {
  const response = await fetch(LEGACY_ASSET_PATH, {
    cache: 'force-cache',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load legacy exercise asset: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload)
    ? payload.filter(isLegacyExercise)
    : [];
}

export function adaptCustomExerciseRecord(
  exercise: Exercise
): ExerciseLibraryRecord {
  return adaptLegacyExercise(exercise, 'custom');
}
