import type { Equipment, Exercise, MuscleGroup } from '@/types/fitness';
import { getCachedExerciseDatabase } from '@/lib/exerciseRepository';

export interface SuggestionOptions {
  muscles: MuscleGroup[];
  equipment: Equipment[];
  limit?: number;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}

const COMPOUND_PATTERNS = [
  'squat',
  'hinge',
  'horizontal_push',
  'horizontal_pull',
  'vertical_push',
  'vertical_pull',
];

const DIFFICULTY_MAP: Record<string, number> = {
  'All Levels': 2,
  Advanced: 3,
  Beginner: 1,
  Elite: 3,
  Intermediate: 2,
};

function getTargetDifficulty(
  experienceLevel: SuggestionOptions['experienceLevel']
) {
  switch (experienceLevel) {
    case 'beginner':
      return 1;
    case 'advanced':
      return 3;
    default:
      return 2;
  }
}

export function suggestExercisesFromExercises(
  exercises: Exercise[],
  {
    muscles,
    equipment,
    limit = 5,
    experienceLevel = 'intermediate',
  }: SuggestionOptions
): Exercise[] {
  if (muscles.length === 0 || equipment.length === 0 || exercises.length === 0) {
    return [];
  }

  const targetDifficulty = getTargetDifficulty(experienceLevel);

  return exercises
    .filter((exercise) => {
      const matchesMuscle = muscles.some(
        (muscle) =>
          exercise.primaryMuscles.includes(muscle) ||
          exercise.secondaryMuscles.includes(muscle)
      );
      const matchesEquipment = exercise.equipment.some(
        (item) => equipment.includes(item) || item === 'bodyweight'
      );

      return matchesMuscle && matchesEquipment;
    })
    .map((exercise) => {
      const primaryMatches = muscles.filter((muscle) =>
        exercise.primaryMuscles.includes(muscle)
      ).length;
      const secondaryMatches = muscles.filter((muscle) =>
        exercise.secondaryMuscles.includes(muscle)
      ).length;
      const exerciseDifficulty =
        DIFFICULTY_MAP[exercise.difficulty || 'Intermediate'] || 2;
      const isCompound = exercise.patterns?.some((pattern) =>
        COMPOUND_PATTERNS.includes(pattern)
      );

      let score = primaryMatches * 10;
      score += secondaryMatches * 3;

      if (isCompound) {
        score += 5;
      }

      if (exerciseDifficulty === targetDifficulty) {
        score += 3;
      } else if (Math.abs(exerciseDifficulty - targetDifficulty) === 1) {
        score += 1;
      }

      return { exercise, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.exercise);
}

export function suggestExercises(options: SuggestionOptions): Exercise[] {
  return suggestExercisesFromExercises(getCachedExerciseDatabase(), options);
}

export function getExercisePreviewFromExercises(
  exercises: Exercise[],
  muscles: MuscleGroup[],
  equipment: Equipment[]
): {
  totalAvailable: number;
  byMuscle: Record<string, number>;
  samples: Exercise[];
} {
  const suggestions = suggestExercisesFromExercises(exercises, {
    muscles,
    equipment,
    limit: 3,
  });

  const byMuscle: Record<string, number> = {};
  muscles.forEach((muscle) => {
    byMuscle[muscle] = exercises.filter(
      (exercise) =>
        (exercise.primaryMuscles.includes(muscle) ||
          exercise.secondaryMuscles.includes(muscle)) &&
        exercise.equipment.some(
          (item) => equipment.includes(item) || item === 'bodyweight'
        )
    ).length;
  });

  const totalAvailable = exercises.filter(
    (exercise) =>
      muscles.some(
        (muscle) =>
          exercise.primaryMuscles.includes(muscle) ||
          exercise.secondaryMuscles.includes(muscle)
      ) &&
      exercise.equipment.some(
        (item) => equipment.includes(item) || item === 'bodyweight'
      )
  ).length;

  return {
    totalAvailable,
    byMuscle,
    samples: suggestions,
  };
}

export function getExercisePreview(
  muscles: MuscleGroup[],
  equipment: Equipment[]
) {
  return getExercisePreviewFromExercises(
    getCachedExerciseDatabase(),
    muscles,
    equipment
  );
}
