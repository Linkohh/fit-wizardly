/**
 * Exercise data types for fitness app integration
 */

import type { DifficultyLevel } from './shared';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance-band'
  | 'bench'
  | 'pull-up-bar';

export type MovementPattern =
  | 'push'
  | 'pull'
  | 'hinge'
  | 'squat'
  | 'carry'
  | 'rotation'
  | 'isolation';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  primaryMuscles: string[];    // Muscle IDs - main muscles worked
  secondaryMuscles: string[];  // Synergist muscle IDs
  equipment: EquipmentType[];
  difficulty: DifficultyLevel;
  movementPattern: MovementPattern;
  instructions?: string[];
  tips?: string[];
  videoUrl?: string;
}

/**
 * Workout session for logging completed workouts
 */
export interface WorkoutSession {
  id: string;
  date: Date;
  presetId?: string;
  muscleIds: string[];
  exercises: ExerciseLog[];
  duration: number;  // minutes
  notes?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weight: number;
  unit: 'lbs' | 'kg';
  restSeconds: number;
  completed: boolean;
  rpe?: number;  // Rate of Perceived Exertion (1-10)
}
