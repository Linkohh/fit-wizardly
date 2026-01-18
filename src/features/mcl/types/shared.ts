/**
 * Shared primitive types used across the application
 * This file should not import from other type files to avoid circular dependencies
 */

// Difficulty levels for exercises and muscles
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// View types for the muscle selector
export type ViewType = 'front' | 'back' | 'side';

// Muscle group categories
export type MuscleGroup =
    | 'chest'
    | 'back'
    | 'shoulders'
    | 'arms'
    | 'core'
    | 'legs'
    | 'glutes'
    | 'calves';
