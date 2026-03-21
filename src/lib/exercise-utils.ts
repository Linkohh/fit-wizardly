import type {
  Equipment,
  Exercise,
  ExerciseCategory,
  MuscleGroup,
} from '@/types/fitness';
import {
  createExerciseCatalogIndex,
  filterExercisesFromIndex,
  getExerciseByIdFromIndex,
  getExercisesByCategoryFromIndex,
  getExerciseStatsFromIndex,
  type ExerciseCatalogIndex,
  type ExerciseCatalogFilterOptions,
} from '@/lib/exerciseCatalogIndex';
import { getCachedExerciseCatalog } from '@/lib/exerciseRepository';

export type ExerciseFilterOptions = ExerciseCatalogFilterOptions;

export interface ExerciseCategoryInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  iconKey: string;
  subcategories?: { id: string; title: string; exerciseIds: string[] }[];
}

interface WizardData {
  goal: 'strength' | 'hypertrophy' | 'general';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  equipment: Equipment[];
  targetMuscles: MuscleGroup[];
}

function getIndex(exercises: Exercise[] | ExerciseCatalogIndex) {
  return Array.isArray(exercises)
    ? createExerciseCatalogIndex(exercises)
    : exercises;
}

export function filterExercisesFromCatalog(
  exercises: Exercise[] | ExerciseCatalogIndex,
  options: ExerciseFilterOptions
) {
  return filterExercisesFromIndex(getIndex(exercises), options);
}

export function filterExercises(options: ExerciseFilterOptions): Exercise[] {
  const index = getCachedExerciseCatalog();
  if (!index) return [];
  return filterExercisesFromCatalog(index, options);
}

export function getRelatedExercisesFromCatalog(
  exercises: Exercise[] | ExerciseCatalogIndex,
  exerciseId: string
) {
  const index = getIndex(exercises);
  const current = getExerciseByIdFromIndex(index, exerciseId);
  if (!current) return [];

  return index.exercises
    .filter(
      (exercise) =>
        exercise.id !== exerciseId &&
        exercise.category === current.category &&
        exercise.primaryMuscles.some((muscle) =>
          current.primaryMuscles.includes(muscle)
        )
    )
    .slice(0, 3);
}

export function getRelatedExercises(exerciseId: string) {
  const index = getCachedExerciseCatalog();
  if (!index) return [];
  return getRelatedExercisesFromCatalog(index, exerciseId);
}

export function getExerciseStatsFromCatalog(
  exercises: Exercise[] | ExerciseCatalogIndex
) {
  return getExerciseStatsFromIndex(getIndex(exercises));
}

export function getExerciseStats() {
  const index = getCachedExerciseCatalog();
  if (!index) {
    return {
      total: 0,
      byCategory: {} as Record<string, number>,
      byMuscle: {} as Record<string, number>,
    };
  }

  return getExerciseStatsFromCatalog(index);
}

export function getRecommendedExercisesFromCatalog(
  exercises: Exercise[] | ExerciseCatalogIndex,
  userProfile: WizardData
) {
  const index = getIndex(exercises);
  const availableEquipment = new Set(['bodyweight', ...userProfile.equipment]);

  let candidates = index.exercises.filter((exercise) =>
    exercise.equipment.some((equipment) => availableEquipment.has(equipment))
  );

  if (userProfile.experienceLevel === 'beginner') {
    candidates = candidates.filter(
      (exercise) =>
        exercise.difficulty !== 'Advanced' && exercise.difficulty !== 'Elite'
    );
  }

  return candidates
    .map((exercise) => {
      let score = 0;

      if (
        exercise.primaryMuscles.some((muscle) =>
          userProfile.targetMuscles.includes(muscle)
        )
      ) {
        score += 10;
      }

      if (
        exercise.secondaryMuscles.some((muscle) =>
          userProfile.targetMuscles.includes(muscle)
        )
      ) {
        score += 5;
      }

      if (userProfile.goal === 'strength' && exercise.category === 'strength') {
        score += 5;
      }

      if (
        userProfile.goal === 'hypertrophy' &&
        exercise.category === 'strength'
      ) {
        score += 5;
      }

      if (userProfile.goal === 'general' && exercise.category === 'cardio') {
        score += 3;
      }

      return { exercise, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.exercise)
    .slice(0, 12);
}

export function getRecommendedExercises(userProfile: WizardData) {
  const index = getCachedExerciseCatalog();
  if (!index) return [];
  return getRecommendedExercisesFromCatalog(index, userProfile);
}

export function getAllCategoriesFromCatalog(
  exercises: Exercise[] | ExerciseCatalogIndex
): ExerciseCategoryInfo[] {
  const index = getIndex(exercises);
  const categories = new Set<ExerciseCategory>();

  index.exercises.forEach((exercise) => {
    if (exercise.category) {
      categories.add(exercise.category);
    }
  });

  return Array.from(categories).map((category) => ({
    id: category,
    name: category.charAt(0).toUpperCase() + category.slice(1),
    title: category.charAt(0).toUpperCase() + category.slice(1),
    description: `${category} exercises`,
    iconKey: category,
  }));
}

export function getAllCategories() {
  const index = getCachedExerciseCatalog();
  if (!index) return [];
  return getAllCategoriesFromCatalog(index);
}

export function getCategoryByIdFromCatalog(
  exercises: Exercise[] | ExerciseCatalogIndex,
  id: string
) {
  return getAllCategoriesFromCatalog(exercises).find((category) => category.id === id);
}

export function getCategoryById(id: string) {
  const index = getCachedExerciseCatalog();
  if (!index) return undefined;
  return getCategoryByIdFromCatalog(index, id);
}

export function getExerciseByIdFromCatalog(
  exercises: Exercise[] | ExerciseCatalogIndex,
  id: string
) {
  return getExerciseByIdFromIndex(getIndex(exercises), id);
}

export function getExerciseById(id: string) {
  const index = getCachedExerciseCatalog();
  if (!index) return undefined;
  return getExerciseByIdFromCatalog(index, id);
}

export function getExercisesByCategoryFromCatalog(
  exercises: Exercise[] | ExerciseCatalogIndex,
  categoryId: string
) {
  return getExercisesByCategoryFromIndex(getIndex(exercises), categoryId);
}

export function getExercisesByCategory(categoryId: string) {
  const index = getCachedExerciseCatalog();
  if (!index) return [];
  return getExercisesByCategoryFromCatalog(index, categoryId);
}
