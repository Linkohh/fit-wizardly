import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MealSuggestions } from './MealSuggestions';
import { useNutritionStore } from '@/stores/nutritionStore';

describe('MealSuggestions', () => {
    beforeEach(() => {
        useNutritionStore.setState({ favorites: [] });
    });

    it('renders icon tiles instead of external images', () => {
        const { container } = render(<MealSuggestions goal="maintain" isWorkoutDay={false} />);

        expect(screen.getByText('Power Quinoa Bowl')).toBeInTheDocument();
        expect(container.querySelectorAll('img')).toHaveLength(0);
        expect(screen.getAllByTestId('meal-icon-tile').length).toBeGreaterThan(0);
    });

    it('does not load an image for a favourite that has an image URL', () => {
        useNutritionStore.setState({
            favorites: [
                {
                    id: 'fav-1',
                    name: 'Greek Yogurt',
                    calories: 150,
                    protein: 15,
                    carbs: 8,
                    fats: 4,
                    mealType: 'snack',
                    timestamp: new Date('2026-11-17T08:00:00.000Z'),
                    imageUrl: 'https://images.example.com/yogurt.jpg',
                },
            ],
        });

        const { container } = render(<MealSuggestions goal="cut" isWorkoutDay />);

        expect(screen.getByText('Greek Yogurt')).toBeInTheDocument();
        expect(container.innerHTML).not.toContain('https://');
    });
});
