import { useEffect, useSyncExternalStore } from 'react';
import type { Exercise } from '@/types/fitness';
import {
  adaptExerciseLibraryRecordsToExercises,
} from '@/features/exercise-library/exerciseAdapter';
import {
  getExerciseLibraryState,
  loadExerciseLibrary,
  subscribeToExerciseLibrary,
} from '@/features/exercise-library/service';
import { loadLegacyExercises } from '@/features/exercise-library/legacy';
import {
  createExerciseCatalogIndex,
  type ExerciseCatalogIndex,
} from '@/lib/exerciseCatalogIndex';

interface ExerciseRepositoryState {
  catalog: ExerciseCatalogIndex | null;
  error: string | null;
  exercises: Exercise[];
  isLoading: boolean;
  source: 'empty' | 'library' | 'memory';
}

const EMPTY_STATE: ExerciseRepositoryState = {
  catalog: null,
  error: null,
  exercises: [],
  isLoading: false,
  source: 'empty',
};

let currentState = hydrateState(
  adaptExerciseLibraryRecordsToExercises(getExerciseLibraryState().records),
  'library'
);
let loadPromise: Promise<ExerciseCatalogIndex> | null = null;
let legacyExercisesCache: Exercise[] | null = null;
let unsubscribeLibrary: (() => void) | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(state: ExerciseRepositoryState) {
  currentState = state;
  emitChange();
}

function hydrateState(
  exercises: Exercise[],
  source: ExerciseRepositoryState['source'],
  error: string | null = null
): ExerciseRepositoryState {
  if (exercises.length === 0) {
    return {
      ...EMPTY_STATE,
      error,
      source,
    };
  }

  return {
    catalog: createExerciseCatalogIndex(exercises),
    error,
    exercises,
    isLoading: false,
    source,
  };
}

function normalizeSignaturePart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildExerciseSignature(exercise: Exercise) {
  const muscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles]
    .sort()
    .join(',');
  const equipment = [...exercise.equipment].sort().join(',');

  return [
    normalizeSignaturePart(exercise.name),
    muscles,
    equipment,
  ].join('|');
}

function withLegacySource(exercises: Exercise[]) {
  return exercises.map((exercise) => ({
    ...exercise,
    source: 'legacy' as const,
  }));
}

function mergePlannerExercises(
  primaryExercises: Exercise[],
  legacyExercises: Exercise[]
) {
  const merged = [...primaryExercises];
  const signatures = new Set(primaryExercises.map(buildExerciseSignature));

  withLegacySource(legacyExercises).forEach((exercise) => {
    const signature = buildExerciseSignature(exercise);
    if (signatures.has(signature)) {
      return;
    }

    signatures.add(signature);
    merged.push(exercise);
  });

  return merged;
}

async function loadLegacyPlannerExercises() {
  if (legacyExercisesCache) {
    return legacyExercisesCache;
  }

  try {
    legacyExercisesCache = await loadLegacyExercises();
    return legacyExercisesCache;
  } catch {
    legacyExercisesCache = [];
    return legacyExercisesCache;
  }
}

function syncFromExerciseLibraryState() {
  const libraryState = getExerciseLibraryState();
  const exercises = mergePlannerExercises(
    adaptExerciseLibraryRecordsToExercises(libraryState.records),
    legacyExercisesCache ?? []
  );

  if (exercises.length === 0 && currentState.exercises.length > 0) {
    setState({
      ...currentState,
      error: libraryState.error,
      isLoading: libraryState.syncStatus === 'loading',
    });
    return;
  }

  setState({
    ...hydrateState(exercises, 'library', libraryState.error),
    isLoading: libraryState.syncStatus === 'loading',
  });
}

function ensureLibrarySubscription() {
  if (unsubscribeLibrary) return;

  unsubscribeLibrary = subscribeToExerciseLibrary(syncFromExerciseLibraryState);
}

export async function loadExerciseCatalog(): Promise<ExerciseCatalogIndex> {
  if (currentState.catalog) {
    return currentState.catalog;
  }

  if (loadPromise) {
    return loadPromise;
  }

  ensureLibrarySubscription();

  setState({
    ...currentState,
    error: null,
    isLoading: true,
  });

  loadPromise = Promise.all([
    loadExerciseLibrary(),
    loadLegacyPlannerExercises(),
  ])
    .then(([libraryState, legacyExercises]) => {
      const exercises = mergePlannerExercises(
        adaptExerciseLibraryRecordsToExercises(libraryState.records),
        legacyExercises
      );
      const nextState = hydrateState(exercises, 'library', libraryState.error);
      setState(nextState);

      if (!nextState.catalog) {
        throw new Error('Exercise library did not provide any planner-compatible exercises');
      }

      return nextState.catalog;
    })
    .catch((error) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load the exercise catalog';

      setState({
        ...EMPTY_STATE,
        error: message,
      });

      throw error;
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

export async function preloadExerciseDatabase() {
  const catalog = await loadExerciseCatalog();
  return catalog.exercises;
}

export async function loadExerciseDatabase(): Promise<Exercise[]> {
  return preloadExerciseDatabase();
}

export function getCachedExerciseCatalog() {
  return currentState.catalog;
}

export function getCachedExerciseDatabase(): Exercise[] {
  return currentState.exercises;
}

export function getExerciseRepositoryState() {
  return currentState;
}

export function subscribeToExerciseRepository(listener: () => void) {
  ensureLibrarySubscription();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useExerciseDatabase() {
  const state = useSyncExternalStore(
    subscribeToExerciseRepository,
    getExerciseRepositoryState,
    getExerciseRepositoryState
  );

  useEffect(() => {
    if (state.catalog || state.isLoading) {
      return;
    }

    void loadExerciseCatalog().catch(() => {
      // The hook surfaces the error through state; callers decide how to render.
    });
  }, [state.catalog, state.isLoading]);

  return {
    exercises: state.exercises,
    isLoading: state.isLoading,
    error: state.error,
  };
}

export function primeExerciseRepositoryForTests(exercises: Exercise[]) {
  setState(hydrateState(exercises, 'memory'));
}

export function resetExerciseRepositoryForTests() {
  currentState = EMPTY_STATE;
  loadPromise = null;
  legacyExercisesCache = null;
  unsubscribeLibrary?.();
  unsubscribeLibrary = null;
  listeners.clear();
}
