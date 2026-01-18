/**
 * Muscle Selector Component Library (MCL)
 *
 * A comprehensive muscle visualization and selection component
 * for fitness applications.
 *
 * @packageDocumentation
 */

// ==================== COMPONENTS ====================
export { MuscleSelector } from './components/MuscleSelector';
export { MuscleCanvas } from './components/MuscleSelector/svg/MuscleCanvas';
export { MusclePath } from './components/MuscleSelector/svg/MusclePath';
export { BodyOutline } from './components/MuscleSelector/svg/BodyOutline';

// ==================== DATA ====================
// Muscles
export {
  muscles,
  getMuscleById,
  getMusclesByGroup,
  getMusclesByView,
  searchMuscles,
} from './data/muscles';

// Muscle Groups
export {
  muscleGroups,
  getMuscleGroupColor,
  getMuscleGroupName,
} from './data/muscleGroups';

// Muscle Relationships
export {
  muscleRelationships,
  getMuscleMetadata,
  defaultMuscleMetadata,
  getAntagonists,
  getSynergists,
  getStabilizers,
  areAntagonists,
  areSynergists,
} from './data/muscleRelationships';

// Presets
export {
  presets,
  getPresetById,
  getPresetsByCategory,
  type WorkoutPreset,
} from './data/presets';

// Exercises
export {
  exercises,
  getExerciseById,
  getExercisesForMuscle,
  getExercisesForMuscles,
  getPrimaryExercisesForMuscles,
  getCompoundExercises,
  filterByEquipment,
  filterByDifficulty,
  filterByMovementPattern,
} from './data/exercises';

// ==================== HOOKS ====================
export { useMuscleSelection } from './hooks/useMuscleSelection';
export { useTheme } from './hooks/useTheme';

// ==================== TYPES ====================
export type {
  // Core types
  Muscle,
  MuscleGroup,
  MuscleGroupInfo,
  ViewType,
  DifficultyLevel,

  // Props
  MuscleSelectorProps,

  // Highlight/Recovery types
  MuscleHighlight,
  MuscleHighlightType,

  // UI State
  TooltipState,
  InfoPanelState,

  // Theme
  ThemeConfig,

  // Exercise types
  Exercise,
  EquipmentType,
  MovementPattern,
  WorkoutSession,
  ExerciseLog,
  SetLog,
} from './types';

// Muscle metadata type
export type { MuscleMetadata } from './data/muscleRelationships';
