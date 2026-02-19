import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkoutLogger } from '../WorkoutLogger';

const mocks = vi.hoisted(() => ({
    startWorkout: vi.fn(),
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
        cancelWorkout: vi.fn(),
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
