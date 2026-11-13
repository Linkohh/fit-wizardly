import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import '@/lib/i18n';
import NutritionPage from './Nutrition';
import { useNutritionStore } from '@/stores/nutritionStore';

describe('Nutrition page', () => {
    beforeEach(() => {
        window.localStorage.clear();
        useNutritionStore.setState({
            profile: {
                weight: 80,
                height: 180,
                age: 30,
                gender: 'male',
                activityLevel: 'moderate',
                goal: 'maintain',
                dailyWaterGoal: 2500,
            },
            targets: { calories: 2500, protein: 150, carbs: 300, fats: 70 },
            history: {},
            selectedDate: new Date().toISOString().split('T')[0],
            customFoods: [],
            favorites: [],
            savedMeals: [],
        });
    });

    it('shows a meal as soon as it is logged, without changing the date', () => {
        render(
            <MemoryRouter>
                <NutritionPage />
            </MemoryRouter>
        );
        expect(screen.getByText('0 meals logged')).toBeInTheDocument();

        act(() => {
            useNutritionStore.getState().logMeal({
                id: 'meal-1',
                name: 'Refresh Check Oats',
                calories: 400,
                protein: 30,
                carbs: 45,
                fats: 12,
                mealType: 'breakfast',
                timestamp: new Date(),
            });
        });

        expect(screen.getByText('1 meals logged')).toBeInTheDocument();
        expect(screen.getByText('Refresh Check Oats')).toBeInTheDocument();
    });
});
