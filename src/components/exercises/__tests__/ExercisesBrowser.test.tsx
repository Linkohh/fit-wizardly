import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExercisesBrowser } from '../ExercisesBrowser';

const mocks = vi.hoisted(() => {
    const recommendedExercises = Array.from({ length: 12 }).map((_, index) => ({
        id: `rec-${index + 1}`,
        name: `Recommended ${index + 1}`,
    }));

    return {
        recommendedExercises,
        filterExercises: vi.fn(() => []),
        getRecommendedExercises: vi.fn(() => recommendedExercises),
    };
});

vi.mock('@/lib/exercise-utils', () => ({
    filterExercises: mocks.filterExercises,
    getRecommendedExercises: mocks.getRecommendedExercises,
}));

vi.mock('@/stores/wizardStore', () => ({
    useWizardStore: () => ({
        selections: {
            targetMuscles: ['chest'],
            equipment: ['bodyweight'],
        },
    }),
}));

vi.mock('../ExerciseCard', () => ({
    ExerciseCard: ({ exercise, variant }: { exercise: { name: string }; variant?: 'library' | 'recommended' }) => (
        <div data-testid={variant === 'recommended' ? 'recommended-card' : 'library-card'}>{exercise.name}</div>
    ),
}));

vi.mock('../ExerciseFilters', () => ({
    ExerciseFilters: () => <div data-testid="exercise-filters" />,
}));

vi.mock('../ExerciseDetailModal', () => ({
    ExerciseDetailModal: () => null,
}));

vi.mock('./../ExerciseOfTheDay', () => ({
    ExerciseOfTheDay: () => <div data-testid="exercise-of-the-day" />,
}));

vi.mock('@/components/community/CommunityPulse', () => ({
    CommunityPulse: () => <div data-testid="community-pulse" />,
}));

describe('ExercisesBrowser', () => {
    it('renders maximum of 10 recommended cards in rail', () => {
        render(<ExercisesBrowser />);

        expect(screen.getAllByTestId('recommended-card')).toHaveLength(10);
    });

    it('applies horizontal snap rail classes', () => {
        render(<ExercisesBrowser />);

        const rail = screen.getByTestId('recommended-rail-track');
        expect(rail).toHaveClass('snap-x', 'snap-mandatory', 'overflow-x-auto');
    });
});
