/**
 * PhaseMapper - Centralized OPT Phase Determination
 *
 * Maps user goals and experience levels to NASM OPT model phases.
 * This is a single source of truth for phase determination logic.
 */

import type { Goal, ExperienceLevel, OptPhase, StabilityLevel } from '@/types/fitness';

/**
 * Phase configuration for training parameters
 */
export interface PhaseConfig {
  reps: string;
  sets: number;
  tempo: string;
  rest: number;
  intensity: string;
  focus?: StabilityLevel;
  isSuperset?: boolean;
}

/**
 * Phase matrix mapping experience and goal to OPT phases
 */
const PHASE_MATRIX: Record<ExperienceLevel, Record<Goal, OptPhase>> = {
  beginner: {
    strength: 'stabilization_endurance',
    hypertrophy: 'stabilization_endurance',
    general: 'stabilization_endurance',
  },
  intermediate: {
    strength: 'strength_endurance',
    hypertrophy: 'muscular_development',
    general: 'stabilization_endurance',
  },
  advanced: {
    strength: 'maximal_strength',
    hypertrophy: 'muscular_development',
    general: 'power',
  },
};

/**
 * Phase configurations with NASM-aligned training parameters
 */
const PHASE_CONFIGS: Record<OptPhase, PhaseConfig> = {
  stabilization_endurance: {
    reps: '12-20',
    sets: 2,
    tempo: '4-2-1',
    rest: 90,
    intensity: '50-70%',
    focus: 'unstable',
  },
  strength_endurance: {
    reps: '8-12',
    sets: 3,
    tempo: '2-0-2',
    rest: 60,
    intensity: '70-80%',
    isSuperset: true,
  },
  muscular_development: {
    reps: '6-12',
    sets: 3,
    tempo: '2-0-2',
    rest: 90,
    intensity: '75-85%',
  },
  maximal_strength: {
    reps: '1-5',
    sets: 4,
    tempo: 'X-0-X',
    rest: 180,
    intensity: '85-100%',
  },
  power: {
    reps: '1-5',
    sets: 3,
    tempo: 'X-0-X',
    rest: 180,
    intensity: '30-45% or 85-100%',
  },
};

/**
 * Human-readable phase names
 */
const PHASE_NAMES: Record<OptPhase, string> = {
  stabilization_endurance: 'Phase 1: Stabilization Endurance',
  strength_endurance: 'Phase 2: Strength Endurance',
  muscular_development: 'Phase 3: Muscular Development',
  maximal_strength: 'Phase 4: Maximal Strength',
  power: 'Phase 5: Power',
};

/**
 * Determines the appropriate NASM OPT phase based on goal and experience
 */
export function determineOptPhase(
  goal: Goal | string,
  experience: ExperienceLevel | string
): OptPhase {
  // Normalize inputs
  const normalizedExperience = (experience || 'beginner') as ExperienceLevel;
  const normalizedGoal = (goal || 'general') as Goal;

  // Look up in matrix with fallback
  const experiencePhases = PHASE_MATRIX[normalizedExperience];
  if (!experiencePhases) {
    return 'stabilization_endurance';
  }

  return experiencePhases[normalizedGoal] || 'stabilization_endurance';
}

/**
 * Gets training configuration for a phase
 */
export function getPhaseConfig(phase: OptPhase): PhaseConfig {
  return PHASE_CONFIGS[phase] || PHASE_CONFIGS.stabilization_endurance;
}

/**
 * Gets the human-readable name for a phase
 */
export function getPhaseName(phase: OptPhase): string {
  return PHASE_NAMES[phase] || 'Unknown Phase';
}

/**
 * Gets all available phases
 */
export function getAllPhases(): OptPhase[] {
  return Object.keys(PHASE_CONFIGS) as OptPhase[];
}

/**
 * Checks if a phase is suitable for beginners
 */
export function isBeginnerSafePhase(phase: OptPhase): boolean {
  return phase === 'stabilization_endurance';
}

// Export as a class for those who prefer OOP style
export class PhaseMapper {
  static getPhase = determineOptPhase;
  static getConfig = getPhaseConfig;
  static getName = getPhaseName;
  static getAllPhases = getAllPhases;
  static isBeginnerSafe = isBeginnerSafePhase;
}
