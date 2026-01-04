import { Exercise, ExerciseCategory, ExerciseLibraryData } from '@/types/exercises';
import libraryData from '@/data/exerciseLibrary.json';

// Type assertion since JSON import is loosely typed
const library = libraryData as unknown as ExerciseLibraryData;

export const getAllCategories = (): ExerciseCategory[] => {
    return library.categories;
};

export const getCategoryById = (id: string): ExerciseCategory | undefined => {
    return library.categories.find(c => c.id === id);
};

export const getExercisesByCategory = (categoryId: string): Exercise[] => {
    return library.exercises.filter(ex => ex.category === categoryId);
};

export const getExerciseById = (id: string): Exercise | undefined => {
    return library.exercises.find(ex => ex.id === id);
};

export const searchExercises = (query: string): Exercise[] => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    return library.exercises.filter(ex =>
        ex.name.toLowerCase().includes(lowerQuery) ||
        ex.primaryMuscles.some(m => m.toLowerCase().includes(lowerQuery)) ||
        ex.equipment.some(e => e.toLowerCase().includes(lowerQuery))
    );
};

export const getRelatedExercises = (exerciseId: string, limit = 3): Exercise[] => {
    const target = getExerciseById(exerciseId);
    if (!target) return [];

    // Find exercises with same primary muscle, excluding self
    return library.exercises
        .filter(ex =>
            ex.id !== exerciseId &&
            ex.primaryMuscles.some(m => target.primaryMuscles.includes(m))
        )
        .slice(0, limit);
};
