import { useEffect, useSyncExternalStore } from 'react';
import {
  getExerciseLibraryState,
  loadExerciseLibrary,
  subscribeToExerciseLibrary,
  syncExerciseLibrary,
} from './service';

export function useExerciseLibrary() {
  const state = useSyncExternalStore(
    subscribeToExerciseLibrary,
    getExerciseLibraryState,
    getExerciseLibraryState
  );

  useEffect(() => {
    void loadExerciseLibrary();
  }, []);

  return {
    ...state,
    refresh: (force = false) => syncExerciseLibrary({ force }),
  };
}
