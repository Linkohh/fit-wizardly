
export type MacroGoal = 'bulk' | 'cut' | 'maintain';

export interface MacroTargets {
    calories: number;
    protein: number;  // grams
    carbs: number;    // grams
    fats: number;     // grams
}

export interface DailyNutritionLog {
    id: string;
    date: string;  // ISO date
    meals: MealEntry[];
    water: number; // ml
    targets: MacroTargets;
    isWorkoutDay: boolean;
}

export interface MealEntry {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
    timestamp: Date;
}

export interface MealRecommendation {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    category: MacroGoal;
    tags: string[];
    isWorkoutMeal: boolean;
}

export interface UserNutritionProfile {
    weight: number;      // kg
    height: number;      // cm
    age: number;
    gender: 'male' | 'female';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    goal: MacroGoal;
    dailyWaterGoal: number; // ml
}
