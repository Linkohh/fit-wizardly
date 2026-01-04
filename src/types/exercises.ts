export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
    id: string;
    name: string;
    description?: string; // Short summary of the movement
    category: string; // Relates to Category ID
    primaryMuscles: string[];
    secondaryMuscles?: string[];
    equipment: string[];
    movementPattern?: string; // Push, Pull, Squat, Hinge, Lunge, Rotation, Carry
    difficulty?: DifficultyLevel;
    instructions?: string[];
    tips?: string[]; // Cues
    commonMistakes?: string[];
    variations?: string[]; // IDs of variant exercises or just names
}

export interface Subcategory {
    id: string;
    title: string;
    exerciseIds: string[];
}

export interface ExerciseCategory {
    id: string;
    title: string;
    description: string;
    iconKey: string; // Mapped to Lucide icons in UI
    colorAccent?: string; // Optional hex for premium styling
    subcategories?: Subcategory[];
    exerciseIds?: string[]; // Fallback for uncategorized
}

export interface ExerciseLibraryData {
    version: string;
    categories: ExerciseCategory[];
    exercises: Exercise[];
}
