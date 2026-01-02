/**
 * Exercise Library Versioning
 * Tracks changes to the exercise database and allows controlled updates
 */

// Current library version
export const EXERCISE_LIBRARY_VERSION = '1.0.0';

// Changelog for exercise library updates
export const EXERCISE_LIBRARY_CHANGELOG: LibraryChange[] = [
    {
        version: '1.0.0',
        date: '2024-01-01',
        changes: [
            { type: 'initial', description: 'Initial exercise database with 40+ exercises' },
        ],
    },
];

interface LibraryChange {
    version: string;
    date: string;
    changes: {
        type: 'add' | 'modify' | 'remove' | 'initial';
        exerciseId?: string;
        description: string;
    }[];
}

// Exercise change tracking
interface ExerciseModification {
    exerciseId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    version: string;
    date: string;
}

const modifications: ExerciseModification[] = [];

/**
 * Track a modification to an exercise
 */
export function trackExerciseModification(mod: Omit<ExerciseModification, 'version' | 'date'>) {
    modifications.push({
        ...mod,
        version: EXERCISE_LIBRARY_VERSION,
        date: new Date().toISOString(),
    });
}

/**
 * Get all modifications for an exercise
 */
export function getExerciseHistory(exerciseId: string): ExerciseModification[] {
    return modifications.filter((m) => m.exerciseId === exerciseId);
}

/**
 * Compare library versions
 */
export function isNewerVersion(current: string, compare: string): boolean {
    const [curMajor, curMinor, curPatch] = current.split('.').map(Number);
    const [cmpMajor, cmpMinor, cmpPatch] = compare.split('.').map(Number);

    if (curMajor !== cmpMajor) return curMajor > cmpMajor;
    if (curMinor !== cmpMinor) return curMinor > cmpMinor;
    return curPatch > cmpPatch;
}

/**
 * Validate exercise schema
 */
export function validateExercise(exercise: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const ex = exercise as Record<string, unknown>;

    if (!ex.id || typeof ex.id !== 'string') {
        errors.push('Missing or invalid id');
    }
    if (!ex.name || typeof ex.name !== 'string') {
        errors.push('Missing or invalid name');
    }
    if (!Array.isArray(ex.primaryMuscles) || ex.primaryMuscles.length === 0) {
        errors.push('primaryMuscles must be a non-empty array');
    }
    if (!Array.isArray(ex.equipment)) {
        errors.push('equipment must be an array');
    }
    if (!Array.isArray(ex.cues)) {
        errors.push('cues must be an array');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get library metadata
 */
export function getLibraryMetadata() {
    return {
        version: EXERCISE_LIBRARY_VERSION,
        totalChanges: EXERCISE_LIBRARY_CHANGELOG.reduce((sum, c) => sum + c.changes.length, 0),
        lastUpdate: EXERCISE_LIBRARY_CHANGELOG[EXERCISE_LIBRARY_CHANGELOG.length - 1]?.date,
        modificationsTracked: modifications.length,
    };
}
