import type {
  Equipment,
  Exercise,
  ExerciseCategory,
  MuscleGroup,
} from '@/types/fitness';

export interface ExerciseCatalogIndex {
  exercises: Exercise[];
  byId: Map<string, Exercise>;
  idsByCategory: Map<string, string[]>;
  idsByDifficulty: Map<string, string[]>;
  idsByEquipment: Map<string, string[]>;
  idsByMuscle: Map<string, string[]>;
  searchTextById: Map<string, string>;
}

export interface ExerciseCatalogFilterOptions {
  category?: ExerciseCategory | 'all';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'all';
  equipment?: Equipment | Equipment[] | 'all';
  muscle?: MuscleGroup | 'all';
  search?: string;
}

function addToBucket(map: Map<string, string[]>, key: string | undefined, id: string) {
  if (!key) return;
  const existing = map.get(key);
  if (existing) {
    existing.push(id);
    return;
  }

  map.set(key, [id]);
}

function buildSearchText(exercise: Exercise) {
  return [
    exercise.name,
    exercise.primaryMuscles.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function intersectCandidateIds(
  current: Set<string> | null,
  nextIds: string[] | undefined
) {
  if (!nextIds || nextIds.length === 0) {
    return new Set<string>();
  }

  if (current === null) {
    return new Set(nextIds);
  }

  const allowed = new Set(nextIds);
  return new Set(Array.from(current).filter((id) => allowed.has(id)));
}

export function createExerciseCatalogIndex(
  exercises: Exercise[]
): ExerciseCatalogIndex {
  const byId = new Map<string, Exercise>();
  const idsByCategory = new Map<string, string[]>();
  const idsByDifficulty = new Map<string, string[]>();
  const idsByEquipment = new Map<string, string[]>();
  const idsByMuscle = new Map<string, string[]>();
  const searchTextById = new Map<string, string>();

  exercises.forEach((exercise) => {
    byId.set(exercise.id, exercise);
    addToBucket(idsByCategory, exercise.category, exercise.id);
    addToBucket(idsByDifficulty, exercise.difficulty, exercise.id);

    exercise.equipment.forEach((equipment) => {
      addToBucket(idsByEquipment, equipment, exercise.id);
    });

    [...exercise.primaryMuscles, ...exercise.secondaryMuscles].forEach((muscle) => {
      addToBucket(idsByMuscle, muscle, exercise.id);
    });

    searchTextById.set(exercise.id, buildSearchText(exercise));
  });

  return {
    exercises,
    byId,
    idsByCategory,
    idsByDifficulty,
    idsByEquipment,
    idsByMuscle,
    searchTextById,
  };
}

export function filterExercisesFromIndex(
  index: ExerciseCatalogIndex,
  options: ExerciseCatalogFilterOptions
): Exercise[] {
  let candidateIds: Set<string> | null = null;

  if (options.category && options.category !== 'all') {
    candidateIds = intersectCandidateIds(
      candidateIds,
      index.idsByCategory.get(options.category)
    );
  }

  if (options.muscle && options.muscle !== 'all') {
    candidateIds = intersectCandidateIds(
      candidateIds,
      index.idsByMuscle.get(options.muscle)
    );
  }

  if (options.difficulty && options.difficulty !== 'all') {
    candidateIds = intersectCandidateIds(
      candidateIds,
      index.idsByDifficulty.get(options.difficulty)
    );
  }

  if (options.equipment && options.equipment !== 'all') {
    const requiredEquipment = Array.isArray(options.equipment)
      ? options.equipment
      : [options.equipment];

    const matchingIds = new Set<string>();
    requiredEquipment.forEach((equipment) => {
      index.idsByEquipment.get(equipment)?.forEach((id) => {
        matchingIds.add(id);
      });
    });

    candidateIds = intersectCandidateIds(candidateIds, Array.from(matchingIds));
  }

  const searchQuery = options.search?.trim().toLowerCase() ?? '';

  return index.exercises.filter((exercise) => {
    if (candidateIds && !candidateIds.has(exercise.id)) {
      return false;
    }

    if (searchQuery === '') {
      return true;
    }

    const searchText = index.searchTextById.get(exercise.id) ?? '';
    return searchText.includes(searchQuery);
  });
}

export function getExerciseByIdFromIndex(
  index: ExerciseCatalogIndex,
  id: string
) {
  return index.byId.get(id);
}

export function getExercisesByCategoryFromIndex(
  index: ExerciseCatalogIndex,
  categoryId: string
) {
  const ids = index.idsByCategory.get(categoryId as ExerciseCategory) ?? [];
  return ids
    .map((id) => index.byId.get(id))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
}

export function getExerciseStatsFromIndex(index: ExerciseCatalogIndex) {
  return {
    total: index.exercises.length,
    byCategory: index.exercises.reduce((acc, exercise) => {
      const category = exercise.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byMuscle: index.exercises.reduce((acc, exercise) => {
      exercise.primaryMuscles.forEach((muscle) => {
        acc[muscle] = (acc[muscle] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
  };
}
