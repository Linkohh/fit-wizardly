import type { Exercise, MuscleGroup, Equipment } from '@/types/fitness';
import { EXERCISE_DATABASE } from '@/data/exercises';

interface SuggestionOptions {
    muscles: MuscleGroup[];
    equipment: Equipment[];
    limit?: number;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Suggests exercises based on selected muscles and equipment.
 * Prioritizes compound movements and matches equipment availability.
 */
export function suggestExercises({
    muscles,
    equipment,
    limit = 5,
    experienceLevel = 'intermediate',
}: SuggestionOptions): Exercise[] {
    if (muscles.length === 0 || equipment.length === 0) {
        return [];
    }

    // Filter exercises that match muscles and equipment
    const matched = EXERCISE_DATABASE.filter((ex) => {
        const matchesMuscle = muscles.some(
            (m) => ex.primaryMuscles.includes(m) || ex.secondaryMuscles.includes(m)
        );
        const matchesEquipment = ex.equipment.some(
            (eq) => equipment.includes(eq) || eq === 'bodyweight'
        );
        return matchesMuscle && matchesEquipment;
    });

    // Score exercises for relevance
    const scored = matched.map((ex) => {
        let score = 0;

        // Primary muscle match is worth more
        const primaryMatches = muscles.filter((m) => ex.primaryMuscles.includes(m)).length;
        score += primaryMatches * 10;

        // Secondary muscle matches
        const secondaryMatches = muscles.filter((m) => ex.secondaryMuscles.includes(m)).length;
        score += secondaryMatches * 3;

        // Compound exercises get bonus (check movement patterns)
        const compoundPatterns = ['squat', 'hinge', 'horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull'];
        if (ex.patterns?.some(p => compoundPatterns.includes(p))) {
            score += 5;
        }

        // Difficulty adjustment based on experience
        const difficultyMap: Record<string, number> = {
            'Beginner': 1,
            'Intermediate': 2,
            'Advanced': 3,
            'Elite': 3,
            'All Levels': 2
        };
        const targetDifficulty = experienceLevel === 'beginner' ? 1 : experienceLevel === 'intermediate' ? 2 : 3;
        const exerciseDifficulty = difficultyMap[ex.difficulty || 'Intermediate'] || 2;
        if (exerciseDifficulty === targetDifficulty) {
            score += 3;
        } else if (Math.abs(exerciseDifficulty - targetDifficulty) === 1) {
            score += 1;
        }

        return { exercise: ex, score };
    });

    // Sort by score descending and take top N
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.exercise);
}

/**
 * Get a preview of what exercises might be included for given muscles.
 * Returns a summary object with counts and sample exercises.
 */
export function getExercisePreview(
    muscles: MuscleGroup[],
    equipment: Equipment[]
): {
    totalAvailable: number;
    byMuscle: Record<string, number>;
    samples: Exercise[];
} {
    const suggestions = suggestExercises({
        muscles,
        equipment,
        limit: 3,
    });

    const byMuscle: Record<string, number> = {};
    muscles.forEach((muscle) => {
        byMuscle[muscle] = EXERCISE_DATABASE.filter(
            (ex) =>
                (ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles.includes(muscle)) &&
                ex.equipment.some((eq) => equipment.includes(eq) || eq === 'bodyweight')
        ).length;
    });

    const totalAvailable = EXERCISE_DATABASE.filter(
        (ex) =>
            muscles.some((m) => ex.primaryMuscles.includes(m) || ex.secondaryMuscles.includes(m)) &&
            ex.equipment.some((eq) => equipment.includes(eq) || eq === 'bodyweight')
    ).length;

    return {
        totalAvailable,
        byMuscle,
        samples: suggestions,
    };
}
