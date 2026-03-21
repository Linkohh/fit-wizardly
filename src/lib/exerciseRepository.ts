import { useEffect, useSyncExternalStore } from 'react';
import type { Exercise } from '@/types/fitness';
import {
  createExerciseCatalogIndex,
  type ExerciseCatalogIndex,
} from '@/lib/exerciseCatalogIndex';

const EXERCISE_ASSET_VERSION = 'v1';
const EXERCISE_ASSET_PATH = `${import.meta.env.BASE_URL}exercise-data/legacy-exercises.${EXERCISE_ASSET_VERSION}.json`;
const CACHE_KEY = `fitwizard:exercise-catalog:${EXERCISE_ASSET_VERSION}`;

interface PersistedExerciseCatalog {
  version: string;
  exercises: Exercise[];
}

interface ExerciseRepositoryState {
  catalog: ExerciseCatalogIndex | null;
  error: string | null;
  exercises: Exercise[];
  isLoading: boolean;
  source: 'asset' | 'empty' | 'memory' | 'storage';
}

const EMPTY_STATE: ExerciseRepositoryState = {
  catalog: null,
  error: null,
  exercises: [],
  isLoading: false,
  source: 'empty',
};

let currentState = hydrateState(readPersistedExerciseCatalog(), 'storage');
let loadPromise: Promise<ExerciseCatalogIndex> | null = null;
const listeners = new Set<() => void>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExercise(value: unknown): value is Exercise {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.primaryMuscles) &&
    Array.isArray(value.secondaryMuscles) &&
    Array.isArray(value.equipment)
  );
}

function isExerciseArray(value: unknown): value is Exercise[] {
  return Array.isArray(value) && value.every(isExercise);
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function readPersistedExerciseCatalog() {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedExerciseCatalog;
    if (
      parsed.version !== EXERCISE_ASSET_VERSION ||
      !isExerciseArray(parsed.exercises)
    ) {
      return null;
    }

    return parsed.exercises;
  } catch {
    return null;
  }
}

function persistExerciseCatalog(exercises: Exercise[]) {
  const storage = getStorage();
  if (!storage) return;

  const payload: PersistedExerciseCatalog = {
    version: EXERCISE_ASSET_VERSION,
    exercises,
  };

  storage.setItem(CACHE_KEY, JSON.stringify(payload));
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(state: ExerciseRepositoryState) {
  currentState = state;
  emitChange();
}

function hydrateState(
  exercises: Exercise[] | null,
  source: ExerciseRepositoryState['source']
): ExerciseRepositoryState {
  if (!exercises || exercises.length === 0) {
    return source === 'storage' ? EMPTY_STATE : { ...EMPTY_STATE, source };
  }

  return {
    catalog: createExerciseCatalogIndex(exercises),
    error: null,
    exercises,
    isLoading: false,
    source,
  };
}

async function fetchExerciseCatalogAsset() {
  const response = await fetch(EXERCISE_ASSET_PATH, {
    cache: 'force-cache',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load exercise catalog asset: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isExerciseArray(payload)) {
    throw new Error('Exercise catalog asset did not match the expected shape');
  }

  return payload;
}

export async function loadExerciseCatalog(): Promise<ExerciseCatalogIndex> {
  if (currentState.catalog) {
    return currentState.catalog;
  }

  if (loadPromise) {
    return loadPromise;
  }

  setState({
    ...currentState,
    error: null,
    isLoading: true,
  });

  loadPromise = fetchExerciseCatalogAsset()
    .then((exercises) => {
      persistExerciseCatalog(exercises);
      const nextState = hydrateState(exercises, 'asset');
      setState(nextState);
      return nextState.catalog as ExerciseCatalogIndex;
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
  listeners.clear();
  getStorage()?.removeItem(CACHE_KEY);
}
