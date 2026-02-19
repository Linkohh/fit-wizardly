import { beforeEach, describe, expect, it } from 'vitest';
import { useNutritionStore } from '@/stores/nutritionStore';
import type { MealEntry } from '@/types/nutrition';

function buildMeal(overrides: Partial<MealEntry> = {}): MealEntry {
    return {
        id: 'meal-1',
        name: 'Oatmeal',
        calories: 400,
        protein: 30,
        carbs: 45,
        fats: 12,
        mealType: 'breakfast',
        timestamp: new Date('2026-02-19T08:00:00.000Z'),
        ...overrides,
    };
}

describe('nutritionStore operations', () => {
    beforeEach(() => {
        useNutritionStore.setState({
            profile: null,
            targets: null,
            history: {},
            selectedDate: '2026-02-19',
            customFoods: [],
            favorites: [],
            savedMeals: [],
        });
    });

    it('adds and removes meals from the current log', () => {
        const store = useNutritionStore.getState();

        store.logMeal(buildMeal());
        expect(store.getCurrentLog().meals).toHaveLength(1);

        store.removeMeal('meal-1');
        expect(store.getCurrentLog().meals).toHaveLength(0);
    });

    it('updates hydration and changes selected date', () => {
        const store = useNutritionStore.getState();

        store.updateHydration(500);
        expect(store.getCurrentLog().water).toBe(500);

        store.changeDate('2026-02-20');
        expect(useNutritionStore.getState().selectedDate).toBe('2026-02-20');
    });

    it('saves meal templates with computed totals', () => {
        const store = useNutritionStore.getState();
        const mealA = buildMeal({ id: 'a', calories: 300, protein: 25, carbs: 30, fats: 10 });
        const mealB = buildMeal({ id: 'b', calories: 200, protein: 15, carbs: 20, fats: 5 });

        store.saveMealTemplate({
            name: 'Breakfast Stack',
            items: [mealA, mealB],
        });

        const saved = useNutritionStore.getState().savedMeals[0];
        expect(saved.totalCalories).toBe(500);
        expect(saved.totalProtein).toBe(40);
        expect(saved.totalCarbs).toBe(50);
        expect(saved.totalFats).toBe(15);
    });
});
