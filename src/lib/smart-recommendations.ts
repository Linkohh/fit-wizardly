import { Exercise, MuscleGroup } from '@/types/fitness';

const DAY_MUSCLE_MAP: Record<number, MuscleGroup[]> = {
    0: ['chest', 'front_deltoid'], // Sunday - Start fresh? Or maybe Cardio? Let's stick to Chest for now or rotate. Actually, Monday is Chest day.
    1: ['chest', 'triceps', 'front_deltoid'], // Monday
    2: ['lats', 'upper_back', 'lower_back', 'biceps'], // Tuesday
    3: ['quads', 'adductors', 'glutes'], // Wednesday - Legs
    4: ['side_deltoid', 'rear_deltoid', 'traps'], // Thursday - Shoulders
    5: ['biceps', 'triceps', 'forearms'], // Friday - Arms
    6: ['hamstrings', 'glutes', 'calves'], // Saturday - Posterior Chain
};

// Adjust Sunday to be more recovery/cardio focused or Full Body
DAY_MUSCLE_MAP[0] = ['abs', 'obliques', 'neck']; // Core/Misc on Sunday

/**
 * Deterministically gets the Exercise of the Day based on the current date.
 * It tries to match the "muscle of the day" theme.
 */
export function getExerciseOfTheDay(exercises: Exercise[]): Exercise | null {
    if (!exercises.length) return null;

    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();

    // specific seed for the day
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
        seed = (seed << 5) - seed + dateString.charCodeAt(i);
        seed |= 0;
    }

    // Filter by today's muscle focus
    const targetMuscles = DAY_MUSCLE_MAP[dayOfWeek];
    const eligibleExercises = exercises.filter(
        (ex) =>
            ex.primaryMuscles.some((m) => targetMuscles.includes(m)) ||
            (dayOfWeek === 0 && ex.category === 'cardio') // Allow cardio on Sundays
    );

    // Fallback to all exercises if no match (unlikely with 160 exercises)
    const pool = eligibleExercises.length > 0 ? eligibleExercises : exercises;

    // Pick one using the seed
    const index = Math.abs(seed) % pool.length;
    return pool[index];
}

/**
 * Returns meaningful related exercises based on muscle groups and movement patterns.
 */
export function getRelatedExercises(target: Exercise, allExercises: Exercise[], limit = 3): Exercise[] {
    return allExercises
        .filter((ex) => {
            if (ex.id === target.id) return false;

            let score = 0;
            // Same primary muscle +3
            const sharedPrimary = ex.primaryMuscles?.filter(m => target.primaryMuscles?.includes(m)).length ?? 0;
            score += sharedPrimary * 3;

            // Same movement pattern +2
            const sharedPattern = ex.patterns?.filter(p => target.patterns?.includes(p)).length ?? 0;
            score += sharedPattern * 2;

            // Same equipment +1
            const sharedEquipment = ex.equipment?.filter(e => target.equipment?.includes(e)).length ?? 0;
            score += sharedEquipment * 1;

            return score > 0;
        })
        .sort((a, b) => {
            // Basic scoring sort, could be improved
            const scoreA =
                (a.primaryMuscles?.filter(m => target.primaryMuscles?.includes(m)).length ?? 0) * 3 +
                (a.patterns?.filter(p => target.patterns?.includes(p)).length ?? 0) * 2;
            const scoreB =
                (b.primaryMuscles?.filter(m => target.primaryMuscles?.includes(m)).length ?? 0) * 3 +
                (b.patterns?.filter(p => target.patterns?.includes(p)).length ?? 0) * 2;
            return scoreB - scoreA;
        })
        .slice(0, limit);
}
