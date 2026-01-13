import { Exercise, MuscleGroup, Equipment, ExerciseCategory } from '@/types/fitness';
import { EXERCISE_DATABASE } from '@/data/exercises';

// --- Search & Filter ---

export interface ExerciseFilterOptions {
    search?: string;
    category?: ExerciseCategory | 'all';
    muscle?: MuscleGroup | 'all';
    equipment?: Equipment | Equipment[] | 'all'; // If array, match ANY
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'all';
}

export function filterExercises(options: ExerciseFilterOptions): Exercise[] {
    let results = EXERCISE_DATABASE;

    if (options.category && options.category !== 'all') {
        results = results.filter(ex => ex.category === options.category);
    }

    if (options.muscle && options.muscle !== 'all') {
        results = results.filter(ex =>
            ex.primaryMuscles.includes(options.muscle as MuscleGroup) ||
            ex.secondaryMuscles.includes(options.muscle as MuscleGroup)
        );
    }

    if (options.equipment && options.equipment !== 'all') {
        const requiredEq = Array.isArray(options.equipment) ? options.equipment : [options.equipment];
        results = results.filter(ex =>
            ex.equipment.some(eq => requiredEq.includes(eq))
        );
    }

    if (options.difficulty && options.difficulty !== 'all') {
        results = results.filter(ex => ex.difficulty === options.difficulty);
    }

    if (options.search) {
        const query = options.search.toLowerCase();
        results = results.filter(ex =>
            ex.name.toLowerCase().includes(query) ||
            ex.primaryMuscles.some(m => m.includes(query))
        );
    }

    return results;
}

export function getRelatedExercises(exerciseId: string): Exercise[] {
    const current = EXERCISE_DATABASE.find(e => e.id === exerciseId);
    if (!current) return [];

    // Simple recommendation logic: Same muscle group, same category, excluding self
    return EXERCISE_DATABASE.filter(ex =>
        ex.id !== exerciseId &&
        ex.category === current.category &&
        ex.primaryMuscles.some(m => current.primaryMuscles.includes(m))
    ).slice(0, 3); // Return top 3
}

// --- Validation / Stats ---

export function getExerciseStats() {
    return {
        total: EXERCISE_DATABASE.length,
        byCategory: EXERCISE_DATABASE.reduce((acc, ex) => {
            const cat = ex.category || 'other';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        byMuscle: EXERCISE_DATABASE.reduce((acc, ex) => {
            ex.primaryMuscles.forEach(m => {
                acc[m] = (acc[m] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>)
    };
}

// --- Recommendations ---

// Mocking the store type here to avoid circular dependency or import issues if using store directly
interface WizardData {
    goal: 'strength' | 'hypertrophy' | 'general';
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    equipment: Equipment[];
    targetMuscles: MuscleGroup[];
}

export function getRecommendedExercises(userProfile: WizardData): Exercise[] {
    // 1. Filter by Equipment (must match at least one available piece, or be bodyweight)
    const availableEquipment = new Set(['bodyweight', ...userProfile.equipment]);

    let candidates = EXERCISE_DATABASE.filter(ex =>
        ex.equipment.some(eq => availableEquipment.has(eq))
    );

    // 2. Filter by Experience Level
    if (userProfile.experienceLevel === 'beginner') {
        // Beginners should mostly see Beginner/Intermediate
        candidates = candidates.filter(ex => ex.difficulty !== 'Advanced' && ex.difficulty !== 'Elite');
    } else if (userProfile.experienceLevel === 'advanced') {
        // Advanced users see everything, but maybe we prioritize harder stuff? 
        // For now, keep all.
    }

    // 3. Score based on Goal & Target Muscles
    const scored = candidates.map(ex => {
        let score = 0;

        // Muscle match
        const primaryMatch = ex.primaryMuscles.some(m => userProfile.targetMuscles.includes(m));
        const secondaryMatch = ex.secondaryMuscles.some(m => userProfile.targetMuscles.includes(m));

        if (primaryMatch) score += 10;
        if (secondaryMatch) score += 5;

        // Goal match (heuristic)
        if (userProfile.goal === 'strength' && ex.category === 'strength') score += 5;
        if (userProfile.goal === 'hypertrophy' && ex.category === 'strength') score += 5;
        if (userProfile.goal === 'general' && ex.category === 'cardio') score += 3;

        return { ex, score };
    });

    // 4. Sort and return top results
    return scored
        .filter(item => item.score > 0) // Only relevant items
        .sort((a, b) => b.score - a.score)
        .map(item => item.ex)
        .slice(0, 12); // Top 12 recommendations
}
