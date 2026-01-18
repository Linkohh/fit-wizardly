// Import shared primitive types for use in this file
import type { ViewType, MuscleGroup, DifficultyLevel } from './shared';

// Re-export shared primitive types for external use
export type { ViewType, MuscleGroup, DifficultyLevel } from './shared';

// Individual muscle definition
export interface Muscle {
  id: string;
  name: string;
  scientificName: string;
  group: MuscleGroup;
  function: string;
  exercises: string[];
  views: ViewType[];
  // Related muscles that work together
  relatedMuscles: string[];
  // SVG path data for each view
  paths: {
    front?: string;
    back?: string;
    side?: string;
  };
  // Functional muscle relationships (Phase 2 enhancement)
  synergists?: string[];      // Muscles that assist in the same movement
  antagonists?: string[];     // Opposing muscles (e.g., biceps vs triceps)
  stabilizers?: string[];     // Muscles that stabilize during movement
  // Training metadata (Phase 2 enhancement)
  difficulty?: DifficultyLevel;
  compoundPrimary?: boolean;  // Is this a primary mover in compound lifts?
  recoveryHours?: number;     // Typical recovery time (48-72hrs)
}

// Muscle group metadata for legend and filtering
export interface MuscleGroupInfo {
  id: MuscleGroup;
  name: string;
  color: string;
  description: string;
}

// Muscle highlight for fatigue/recovery visualization (Phase 3)
export type MuscleHighlightType = 'fatigue' | 'recovered' | 'injury' | 'focus';

export interface MuscleHighlight {
  muscleId: string;
  type: MuscleHighlightType;
  intensity: number;  // 0-100
  label?: string;     // e.g., "Trained 2 days ago"
}

// Component props for the main MuscleSelector
export interface MuscleSelectorProps {
  // Selection state
  selectedMuscles?: string[];
  onSelectionChange?: (muscles: string[]) => void;
  multiSelect?: boolean;

  // View configuration
  defaultView?: ViewType;
  showSideView?: boolean;

  // Feature toggles
  showSearch?: boolean;
  showLegend?: boolean;
  showInfoPanel?: boolean;
  showSelectionSidebar?: boolean;
  colorByGroup?: boolean;
  showPresets?: boolean;  // Phase 1 enhancement

  // Theming
  theme?: 'light' | 'dark' | 'system';
  accentColor?: string;

  // Callbacks
  onMuscleHover?: (muscle: Muscle | null) => void;
  onMuscleClick?: (muscle: Muscle) => void;
  onInfoRequest?: (muscle: Muscle) => void;
  onViewChange?: (view: ViewType) => void;
  onPresetApply?: (presetId: string, muscleIds: string[]) => void;  // Phase 1 enhancement

  // Integration props (Phase 3 enhancement)
  highlightedMuscles?: MuscleHighlight[];  // External fatigue/recovery data
  disabledMuscles?: string[];              // Muscles that can't be selected (injured, etc.)

  // Sizing
  width?: number | string;
  height?: number | string;
  className?: string;
  customViewBox?: string; // Optional override for viewBox (e.g., "0 0 200 220" for upper body)
}

// Tooltip position and state
export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  muscle: Muscle | null;
}

// Info panel state
export interface InfoPanelState {
  isOpen: boolean;
  muscle: Muscle | null;
}

// Theme configuration
export interface ThemeConfig {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    accent: string;
    bodyBase: string;
    bodyOutline: string;
  };
}

// Re-export exercise types
export type {
  Exercise,
  EquipmentType,
  MovementPattern,
  WorkoutSession,
  ExerciseLog,
  SetLog,
} from './exercise';
