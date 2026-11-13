import type { DailyNutritionLog, MealEntry, MealTemplate } from '@/types/nutrition';

/** Same id scheme the nutrition UI already uses for logged meals. */
function createMealId(): string {
    return Math.random().toString();
}

function cloneMeal(meal: MealEntry): MealEntry {
    return {
        ...meal,
        ...(meal.tags ? { tags: [...meal.tags] } : {}),
    };
}

/**
 * Returns fresh copies of the meals logged on `sourceDate` (YYYY-MM-DD), ready to
 * be logged on another day. Returns [] when that day has no meals.
 */
export function copyableMeals(
    history: Record<string, DailyNutritionLog>,
    sourceDate: string
): MealEntry[] {
    const meals = history[sourceDate]?.meals ?? [];

    return meals.map((meal) => ({
        ...cloneMeal(meal),
        id: createMealId(),
        timestamp: new Date(),
    }));
}

/**
 * Builds a saved-meal template from one meal or a group of meals.
 * @throws Error('Template name is required') when the name is blank.
 */
export function templateFromMeal(meal: MealEntry | MealEntry[], name: string): MealTemplate {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error('Template name is required');
    }

    const items = (Array.isArray(meal) ? meal : [meal]).map(cloneMeal);

    return {
        id: createMealId(),
        name: trimmedName,
        items,
        totalCalories: items.reduce((sum, item) => sum + item.calories, 0),
        totalProtein: items.reduce((sum, item) => sum + item.protein, 0),
        totalCarbs: items.reduce((sum, item) => sum + item.carbs, 0),
        totalFats: items.reduce((sum, item) => sum + item.fats, 0),
    };
}

/** The calendar day before `date` (both YYYY-MM-DD). */
export function previousDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().split('T')[0];
}
