import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExerciseDetailModal } from '../ExerciseDetailModal';
import type { Exercise } from '@/types/fitness';
import type { ReactNode } from 'react';

const mocks = vi.hoisted(() => ({
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(),
    favoriteToggle: vi.fn(),
    trackViewHook: vi.fn(),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
}));

vi.mock('@/hooks/useUserPreferences', () => ({
    usePreferencesStore: () => ({
        isFavorite: mocks.isFavorite,
        toggleFavorite: mocks.toggleFavorite,
    }),
}));

vi.mock('@/hooks/useExerciseInteraction', () => ({
    useTrackExerciseView: mocks.trackViewHook,
}));

vi.mock('@/hooks/useHaptics', () => ({
    useHaptics: () => ({
        favoriteToggle: mocks.favoriteToggle,
    }),
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => false,
}));

vi.mock('../RelatedExercises', () => ({
    RelatedExercises: () => <div data-testid="related-exercises" />,
}));

vi.mock('../ExerciseBadges', () => ({
    ExerciseBadges: () => <div data-testid="exercise-badges" />,
}));

vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialogContent: ({ children, className }: { children: ReactNode; className?: string }) => (
        <section className={className}>{children}</section>
    ),
}));

vi.mock('@/components/ui/tabs', () => ({
    Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TabsList: ({ children, className }: { children: ReactNode; className?: string }) => (
        <div role="tablist" className={className}>{children}</div>
    ),
    TabsTrigger: ({ children, className }: { children: ReactNode; className?: string }) => (
        <button role="tab" className={className}>{children}</button>
    ),
    TabsContent: ({ children, className }: { children: ReactNode; className?: string }) => (
        <div className={className}>{children}</div>
    ),
}));

function buildExercise(overrides: Partial<Exercise> = {}): Exercise {
    return {
        id: 'long-form-exercise',
        name: 'VeryLongExerciseNameThatShouldStillRenderCleanlyWithoutOverflowIssues',
        primaryMuscles: ['chest', 'front_deltoid'],
        secondaryMuscles: ['triceps'],
        equipment: ['bodyweight'],
        patterns: ['horizontal_push'],
        contraindications: [],
        cues: ['ExtremelyLongCueText_That_ShouldWrap_AndNotOverflowOutsideTheContainerAtAnyViewportWidth'],
        category: 'strength',
        difficulty: 'Beginner',
        description: 'VeryLongDescription_That_Should_BreakWords_Cleanly_WithoutOverflow_InTheModalBodySection_ForReadability.',
        steps: ['VeryLongExecutionStep_ThatShouldWrapWithoutPushingLayoutOutsideVisibleBounds.'],
        variations: [
            {
                name: 'Variation A',
                type: 'alternative',
                description: 'VeryLongVariationDescription_ThatNeedsToBreakWordsAndRemainContainedInsideItsPanel.',
            },
        ],
        ...overrides,
    };
}

describe('ExerciseDetailModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isFavorite.mockImplementation(() => false);
    });

    it('renders all four tab triggers', () => {
        render(
            <ExerciseDetailModal
                exercise={buildExercise()}
                isOpen
                onClose={vi.fn()}
            />
        );

        expect(screen.getAllByRole('tab')).toHaveLength(4);
        expect(screen.getByRole('tab', { name: /instructions/i })).toHaveClass('min-h-9');
        expect(screen.getByRole('tab', { name: /variations/i })).toHaveClass('min-h-9');
    });

    it('applies break-word classes on long content blocks', () => {
        render(
            <ExerciseDetailModal
                exercise={buildExercise()}
                isOpen
                onClose={vi.fn()}
            />
        );

        const description = screen.getByText(/VeryLongDescription_That_Should_BreakWords_Cleanly/i);
        expect(description).toHaveClass('break-words');

        const cue = screen.getByText(/ExtremelyLongCueText_That_ShouldWrap/i);
        expect(cue).toHaveClass('break-words');

        const variationDescription = screen.getByText(/VeryLongVariationDescription_ThatNeedsToBreakWords/i);
        expect(variationDescription).toHaveClass('break-words');
    });

    it('does not leak raw i18n exercise detail keys', () => {
        render(
            <ExerciseDetailModal
                exercise={buildExercise()}
                isOpen
                onClose={vi.fn()}
            />
        );

        expect(screen.queryByText(/exercises\.detail\./i)).not.toBeInTheDocument();
    });
});
