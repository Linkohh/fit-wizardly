import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExerciseCard } from '../ExerciseCard';
import type { Exercise } from '@/types/fitness';

const mocks = vi.hoisted(() => ({
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(),
    isTrending: vi.fn(() => false),
    trackView: vi.fn(),
    impact: vi.fn(),
    selection: vi.fn(),
}));

vi.mock('@/hooks/useUserPreferences', () => ({
    usePreferencesStore: () => ({
        isFavorite: mocks.isFavorite,
        toggleFavorite: mocks.toggleFavorite,
    }),
}));

vi.mock('@/hooks/useExerciseInteraction', () => ({
    useExerciseInteraction: () => ({
        isTrending: mocks.isTrending,
        trackView: mocks.trackView,
    }),
}));

vi.mock('@/hooks/useHaptics', () => ({
    useHaptics: () => ({
        impact: mocks.impact,
        selection: mocks.selection,
    }),
}));

function buildExercise(overrides: Partial<Exercise> = {}): Exercise {
    return {
        id: 'pushup',
        name: 'Push-Up',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps'],
        equipment: ['bodyweight'],
        patterns: ['horizontal_push'],
        contraindications: [],
        cues: ['Keep a straight line'],
        category: 'strength',
        difficulty: 'Beginner',
        ...overrides,
    };
}

describe('ExerciseCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isFavorite.mockImplementation(() => false);
        mocks.isTrending.mockImplementation(() => false);
    });

    it('shows recommended badge only for recommended variant', () => {
        const exercise = buildExercise();

        const { rerender } = render(
            <ExerciseCard exercise={exercise} onClick={vi.fn()} variant="recommended" />
        );
        expect(screen.getByText('Recommended')).toBeInTheDocument();

        rerender(<ExerciseCard exercise={exercise} onClick={vi.fn()} variant="library" />);
        expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
    });

    it('does not open card when favorite button is clicked', () => {
        const onClick = vi.fn();
        render(<ExerciseCard exercise={buildExercise()} onClick={onClick} variant="library" />);

        fireEvent.click(screen.getByRole('button', { name: /add to favorites/i }));

        expect(onClick).not.toHaveBeenCalled();
        expect(mocks.trackView).not.toHaveBeenCalled();
        expect(mocks.toggleFavorite).toHaveBeenCalledTimes(1);
    });

    it('marks card root for click feedback', () => {
        const onClick = vi.fn();
        render(<ExerciseCard exercise={buildExercise()} onClick={onClick} variant="library" />);

        const cardRoot = document.querySelector('article[data-click-feedback="on"]');
        expect(cardRoot).not.toBeNull();
        expect(cardRoot).toHaveAttribute('data-click-feedback', 'on');
    });
});
