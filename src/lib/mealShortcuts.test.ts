import { describe, expect, it } from 'vitest';
import { copyableMeals, previousDate, templateFromMeal } from './mealShortcuts';
import type { DailyNutritionLog, MealEntry } from '@/types/nutrition';

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
        tags: ['Custom'],
        ...overrides,
    };
}

function buildLog(date: string, meals: MealEntry[]): DailyNutritionLog {
    return {
        id: date,
        date: new Date(date).toISOString(),
        meals,
        water: 0,
        targets: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        isWorkoutDay: false,
    };
}

describe('copyableMeals', () => {
    const source = [buildMeal(), buildMeal({ id: 'meal-2', name: 'Chicken Bowl', calories: 650, mealType: 'lunch' })];
    const history = { '2026-02-18': buildLog('2026-02-18', source) };

    it('copies every meal of the source day with new ids and the same nutrition', () => {
        const copies = copyableMeals(history, '2026-02-18');

        expect(copies).toHaveLength(2);
        copies.forEach((copy, index) => {
            expect(copy.id).not.toBe(source[index].id);
            expect(copy.name).toBe(source[index].name);
            expect(copy.calories).toBe(source[index].calories);
            expect(copy.protein).toBe(source[index].protein);
            expect(copy.carbs).toBe(source[index].carbs);
            expect(copy.fats).toBe(source[index].fats);
        });
        expect(new Set(copies.map((copy) => copy.id)).size).toBe(2);
    });

    it('stamps the copies with the current time', () => {
        const before = Date.now();
        const [copy] = copyableMeals(history, '2026-02-18');
        expect(copy.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('returns an empty list for a day with no meals', () => {
        expect(copyableMeals({ '2026-02-18': buildLog('2026-02-18', []) }, '2026-02-18')).toEqual([]);
    });

    it('returns an empty list for a day that is not in the history', () => {
        expect(copyableMeals(history, '2026-02-17')).toEqual([]);
    });

    it('does not share object identity with the source meals', () => {
        const [copy] = copyableMeals(history, '2026-02-18');
        copy.name = 'Changed';
        copy.tags?.push('Mutated');

        expect(source[0].name).toBe('Oatmeal');
        expect(source[0].tags).toEqual(['Custom']);
    });
});

describe('templateFromMeal', () => {
    it('builds a template with a trimmed name and summed totals', () => {
        const template = templateFromMeal(
            [buildMeal(), buildMeal({ id: 'meal-2', calories: 100, protein: 10, carbs: 5, fats: 3 })],
            '  Morning Oats  '
        );

        expect(template.name).toBe('Morning Oats');
        expect(template.items).toHaveLength(2);
        expect(template.totalCalories).toBe(500);
        expect(template.totalProtein).toBe(40);
        expect(template.totalCarbs).toBe(50);
        expect(template.totalFats).toBe(15);
    });

    it('accepts a single meal', () => {
        expect(templateFromMeal(buildMeal(), 'Oats').items).toHaveLength(1);
    });

    it('throws when the name is empty after trimming', () => {
        expect(() => templateFromMeal(buildMeal(), '  ')).toThrow('Template name is required');
    });
});

describe('previousDate', () => {
    it('returns the day before', () => {
        expect(previousDate('2026-02-19')).toBe('2026-02-18');
    });

    it('crosses month and year boundaries', () => {
        expect(previousDate('2026-03-01')).toBe('2026-02-28');
        expect(previousDate('2026-01-01')).toBe('2025-12-31');
    });
});
