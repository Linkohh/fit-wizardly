import { useState, useCallback, useMemo } from 'react';
import { Muscle } from '../types';
import { getMuscleById } from '../data/muscles';

interface UseMuscleSelectionOptions {
  initialSelection?: string[];
  multiSelect?: boolean;
  onChange?: (selectedIds: string[]) => void;
  maxHistorySize?: number;
}

interface SelectionHistory {
  past: string[][];
  present: string[];
  future: string[][];
}

export const useMuscleSelection = ({
  initialSelection = [],
  multiSelect = true,
  onChange,
  maxHistorySize = 50,
}: UseMuscleSelectionOptions = {}) => {
  const [history, setHistory] = useState<SelectionHistory>({
    past: [],
    present: initialSelection,
    future: [],
  });

  // Helper to push a new state to history
  const pushToHistory = useCallback(
    (newSelection: string[]) => {
      setHistory((prev) => ({
        past: [...prev.past, prev.present].slice(-maxHistorySize),
        present: newSelection,
        future: [],
      }));
      onChange?.(newSelection);
    },
    [onChange, maxHistorySize]
  );

  const toggleMuscle = useCallback(
    (muscleId: string) => {
      const current = history.present;
      let newSelection: string[];

      if (current.includes(muscleId)) {
        // Deselect
        newSelection = current.filter((id) => id !== muscleId);
      } else {
        // Select
        if (multiSelect) {
          newSelection = [...current, muscleId];
        } else {
          newSelection = [muscleId];
        }
      }

      pushToHistory(newSelection);
    },
    [history.present, multiSelect, pushToHistory]
  );

  const selectMuscle = useCallback(
    (muscleId: string) => {
      const current = history.present;
      if (current.includes(muscleId)) return;

      let newSelection: string[];
      if (multiSelect) {
        newSelection = [...current, muscleId];
      } else {
        newSelection = [muscleId];
      }

      pushToHistory(newSelection);
    },
    [history.present, multiSelect, pushToHistory]
  );

  const deselectMuscle = useCallback(
    (muscleId: string) => {
      const newSelection = history.present.filter((id) => id !== muscleId);
      pushToHistory(newSelection);
    },
    [history.present, pushToHistory]
  );

  const clearSelection = useCallback(() => {
    if (history.present.length > 0) {
      pushToHistory([]);
    }
  }, [history.present, pushToHistory]);

  const setSelection = useCallback(
    (ids: string[]) => {
      pushToHistory(ids);
    },
    [pushToHistory]
  );

  // Undo: move present to future, pop from past
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;
      const newFuture = [prev.present, ...prev.future];

      onChange?.(newPresent);

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, [onChange]);

  // Redo: move present to past, pop from future
  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;
      const newPast = [...prev.past, prev.present];

      onChange?.(newPresent);

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, [onChange]);

  // Derived state
  const selectedIds = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Get the actual Muscle objects for selected IDs
  const selectedMuscles = useMemo(
    () =>
      selectedIds
        .map((id) => getMuscleById(id))
        .filter((m): m is Muscle => m !== undefined),
    [selectedIds]
  );

  const isSelected = useCallback(
    (muscleId: string) => selectedIds.includes(muscleId),
    [selectedIds]
  );

  return {
    selectedIds,
    selectedMuscles,
    toggleMuscle,
    selectMuscle,
    deselectMuscle,
    clearSelection,
    setSelection,
    isSelected,
    // New undo/redo functionality
    undo,
    redo,
    canUndo,
    canRedo,
  };
};

export default useMuscleSelection;
