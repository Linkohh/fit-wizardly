import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkoutLogger } from '../WorkoutLogger';

const mocks = vi.hoisted(() => ({
    startWorkout: vi.fn(),
    cancelWorkout: vi.fn(),
    getTodayLog: vi.fn(),
    activeWorkout: null as unknown,
}));

const planFixture = {
    id: 'plan-1',
    workoutDays: [
        {
            dayIndex: 0,
            name: 'Upper A',
            exercises: [{ exercise: { name: 'Bench Press' }, reps: '8', rir: 2, restSeconds: 90 }],
        },
    ],
    rirProgression: [{ week: 1, targetRIR: 2, isDeload: false }],
};

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
}));

vi.mock('@/stores/readinessStore', () => ({
    useReadinessStore: () => ({
        getTodayLog: mocks.getTodayLog,
    }),
}));

vi.mock('@/stores/planStore', () => ({
    usePlanStore: () => ({
        getPlanById: () => planFixture,
        activeWorkout: mocks.activeWorkout,
        startWorkout: mocks.startWorkout,
        cancelWorkout: mocks.cancelWorkout,
        logSet: vi.fn(),
        skipExercise: vi.fn(),
        completeWorkout: vi.fn(() => null),
        preferredWeightUnit: 'lbs',
        getLastPerformance: vi.fn(() => null),
        startRestTimer: vi.fn(),
    }),
}));

vi.mock('../ReadinessCheck', () => ({
    ReadinessCheck: () => <div data-testid="readiness-check">Readiness Check</div>,
}));

vi.mock('../SetLogger', () => ({
    SetLogger: () => <div />,
}));
vi.mock('../WorkoutSummary', () => ({
    WorkoutSummary: () => <div />,
}));
vi.mock('../RestTimer', () => ({
    RestTimer: () => <div />,
}));
vi.mock('../WarmUpSets', () => ({
    WarmUpSets: () => <div />,
}));
vi.mock('../SupersetIndicator', () => ({
    SupersetIndicator: () => <div />,
    getSupersetLabel: () => 'A1',
}));
vi.mock('@/hooks/useWorkoutTimer', () => ({
    useWorkoutTimer: () => ({ formattedTime: '00:00' }),
}));
vi.mock('@/hooks/useHaptics', () => ({
    useHaptics: () => ({
        impact: vi.fn(),
        notification: vi.fn(),
    }),
}));

describe('WorkoutLogger readiness gate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.activeWorkout = null;
    });

    it('shows readiness check before starting workout when no readiness log exists', async () => {
        mocks.getTodayLog.mockReturnValue(undefined);

        render(
            <MemoryRouter initialEntries={['/workout/plan-1/0']}>
                <Routes>
                    <Route path="/workout/:planId/:dayIndex" element={<WorkoutLogger />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('readiness-check')).toBeInTheDocument();
        });

        expect(mocks.startWorkout).not.toHaveBeenCalled();
    });

    it('starts workout immediately when readiness already logged today', async () => {
        mocks.getTodayLog.mockReturnValue({
            date: '2026-02-19',
            sleepQuality: 3,
            muscleSoreness: 2,
            energyLevel: 3,
            stressLevel: 2,
            overallScore: 3.25,
        });

        render(
            <MemoryRouter initialEntries={['/workout/plan-1/0']}>
                <Routes>
                    <Route path="/workout/:planId/:dayIndex" element={<WorkoutLogger />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mocks.startWorkout).toHaveBeenCalledWith('plan-1', 0);
        });
    });
});

describe('WorkoutLogger with an unfinished workout from another day', () => {
    const unfinishedWorkout = {
        planId: 'plan-old',
        dayIndex: 2,
        dayName: 'Lower B',
        startedAt: new Date('2026-11-16T17:00:00.000Z'),
        exercises: [],
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        restTimerEndTime: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.activeWorkout = unfinishedWorkout;
        mocks.getTodayLog.mockReturnValue({ date: '2026-11-17', overallScore: 3 });
    });

    function renderAt(path: string) {
        return render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/workout/plan-old/2" element={<div>Resumed unfinished workout</div>} />
                    <Route path="/workout/:planId/:dayIndex" element={<WorkoutLogger />} />
                </Routes>
            </MemoryRouter>
        );
    }

    it('asks to resume or discard instead of mixing the two workouts', () => {
        renderAt('/workout/plan-1/0');

        expect(screen.getByText('You have an unfinished workout')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Resume/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Discard/ })).toBeInTheDocument();
        expect(mocks.startWorkout).not.toHaveBeenCalled();
    });

    it('goes back to the unfinished workout on Resume', () => {
        renderAt('/workout/plan-1/0');

        fireEvent.click(screen.getByRole('button', { name: /Resume/ }));

        expect(screen.getByText('Resumed unfinished workout')).toBeInTheDocument();
        expect(mocks.cancelWorkout).not.toHaveBeenCalled();
    });

    it('discards the unfinished workout on Discard', () => {
        renderAt('/workout/plan-1/0');

        fireEvent.click(screen.getByRole('button', { name: /Discard/ }));

        expect(mocks.cancelWorkout).toHaveBeenCalledTimes(1);
    });
});
