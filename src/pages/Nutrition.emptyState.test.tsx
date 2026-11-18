import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import '@/lib/i18n';
import NutritionPage from './Nutrition';
import { useNutritionStore } from '@/stores/nutritionStore';

function renderNutrition() {
    return render(
        <MemoryRouter>
            <NutritionPage />
        </MemoryRouter>,
    );
}

describe('Nutrition page empty state', () => {
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

    it('says nothing is logged today and offers to log a meal', () => {
        renderNutrition();

        expect(screen.getByTestId('nutrition-empty-state')).toHaveTextContent('Nothing logged today.');
        expect(screen.getByRole('button', { name: 'Log a meal' })).toBeInTheDocument();
    });

    it('opens the existing food logger from the empty state', () => {
        renderNutrition();
        expect(screen.getByRole('button', { name: /Add Food/ })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Log a meal' }));

        // The logger leaves its collapsed view, so its "Add Food" button goes away.
        expect(screen.queryByRole('button', { name: /Add Food/ })).not.toBeInTheDocument();
    });

    it('hides the empty state once a meal is logged', () => {
        const today = new Date().toISOString().split('T')[0];
        useNutritionStore.setState({
            history: {
                [today]: {
                    id: today,
                    date: today,
                    meals: [
                        {
                            id: 'meal-1',
                            name: 'Empty State Oats',
                            calories: 400,
                            protein: 30,
                            carbs: 45,
                            fats: 12,
                            mealType: 'breakfast',
                            timestamp: new Date(),
                        },
                    ],
                    water: 0,
                    targets: { calories: 2500, protein: 150, carbs: 300, fats: 70 },
                    isWorkoutDay: false,
                },
            },
        });

        renderNutrition();

        expect(screen.queryByTestId('nutrition-empty-state')).not.toBeInTheDocument();
        expect(screen.getByText('Empty State Oats')).toBeInTheDocument();
    });
});
