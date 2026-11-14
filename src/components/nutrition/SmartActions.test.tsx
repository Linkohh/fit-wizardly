import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import { SmartActions } from './SmartActions';
import { useNutritionStore } from '@/stores/nutritionStore';
import type { MealEntry } from '@/types/nutrition';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function buildMeal(overrides: Partial<MealEntry> = {}): MealEntry {
    return {
        id: 'meal-1',
        name: 'Oatmeal',
        calories: 400,
        protein: 30,
        carbs: 45,
        fats: 12,
        mealType: 'breakfast',
        timestamp: new Date('2026-02-18T08:00:00.000Z'),
        ...overrides,
    };
}

function seedYesterday(meals: MealEntry[]) {
    useNutritionStore.getState().changeDate('2026-02-18');
    useNutritionStore.getState().logMeal(meals);
    useNutritionStore.getState().changeDate('2026-02-19');
}

describe('SmartActions shortcuts', () => {
    beforeEach(() => {
        window.localStorage.clear();
        useNutritionStore.setState({
            history: {},
            selectedDate: '2026-02-19',
            savedMeals: [],
        });
    });

    it('disables "Copy yesterday" when yesterday has no meals', () => {
        render(<SmartActions onLog={vi.fn()} onSaveTemplate={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /copy yesterday/i }));

        expect(screen.getByRole('button', { name: /copy yesterday/i })).toBeDisabled();
        expect(useNutritionStore.getState().history['2026-02-19']).toBeUndefined();
    });

    it('copies yesterday\'s meals into the selected day', () => {
        seedYesterday([buildMeal(), buildMeal({ id: 'meal-2', name: 'Chicken Bowl', mealType: 'lunch' })]);
        render(<SmartActions onLog={vi.fn()} onSaveTemplate={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /copy yesterday/i }));

        const today = useNutritionStore.getState().history['2026-02-19'].meals;
        expect(today.map((meal) => meal.name)).toEqual(['Oatmeal', 'Chicken Bowl']);
    });

    it('asks for a name and hands the last meal to onSaveTemplate', () => {
        seedYesterday([buildMeal({ mealType: 'breakfast' }), buildMeal({ id: 'm2', mealType: 'lunch' }), buildMeal({ id: 'm3', mealType: 'dinner' }), buildMeal({ id: 'm4', mealType: 'snack' })]);
        const onSaveTemplate = vi.fn();
        render(<SmartActions onLog={vi.fn()} onSaveTemplate={onSaveTemplate} />);

        fireEvent.click(screen.getByRole('button', { name: /save as template/i }));
        const input = screen.getByRole('textbox', { name: /template name/i });
        const save = screen.getByRole('button', { name: /^save$/i });
        expect(save).toBeDisabled();

        fireEvent.change(input, { target: { value: '  Morning Oats ' } });
        fireEvent.click(save);

        expect(onSaveTemplate).toHaveBeenCalledTimes(1);
        const [meals, name] = onSaveTemplate.mock.calls[0];
        expect(meals).toHaveLength(1);
        expect(name).toBe('Morning Oats');
        expect(screen.queryByRole('textbox', { name: /template name/i })).not.toBeInTheDocument();
    });

    it('offers no template save when there is no previous meal', () => {
        render(<SmartActions onLog={vi.fn()} onSaveTemplate={vi.fn()} />);
        expect(screen.queryByRole('button', { name: /save as template/i })).not.toBeInTheDocument();
    });
});
