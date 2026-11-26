import { useSyncExternalStore } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SetLog } from '@/types/fitness';
import { WorkoutLogger } from '../WorkoutLogger';

/**
 * Real SetLogger rows inside WorkoutLogger, with a small stateful stand-in for the plan
 * store, so logging a set re-renders the logger the way the real store does.
 */

interface FakeSet extends Partial<SetLog> {
    setNumber: number;
    completed: boolean;
}

interface FakeWorkout {
    planId: string;
    dayIndex: number;
    dayName: string;
    startedAt: Date;
    exercises: Array<{ exerciseId: string; sets: FakeSet[]; skipped?: boolean }>;
}

const store = vi.hoisted(() => {
    let workout: unknown = null;
    const listeners = new Set<() => void>();
    return {
        get: () => workout,
        set: (next: unknown) => {
            workout = next;
            listeners.forEach((listener) => listener());
        },
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        completeWorkout: vi.fn(),
        startWorkout: vi.fn(),
    };
});

const planFixture = {
    id: 'plan-1',
    workoutDays: [
        {
            dayIndex: 0,
            name: 'Upper A',
            exercises: [
                { exercise: { name: 'Bench Press' }, reps: '8-12', rir: 2, restSeconds: 90 },
                { exercise: { name: 'Barbell Row' }, reps: '8-12', rir: 2, restSeconds: 90 },
            ],
        },
    ],
    rirProgression: [{ week: 1, targetRIR: 2, isDeload: false }],
};

function freshWorkout(): FakeWorkout {
    const sets = (): FakeSet[] => [
        { setNumber: 1, completed: false },
        { setNumber: 2, completed: false },
    ];
    return {
        planId: 'plan-1',
        dayIndex: 0,
        dayName: 'Upper A',
        startedAt: new Date('2026-11-22T10:00:00.000Z'),
        exercises: [
            { exerciseId: 'bench', sets: sets() },
            { exerciseId: 'row', sets: sets() },
        ],
    };
}

function logSet(exerciseIndex: number, setLog: SetLog) {
    const workout = store.get() as FakeWorkout;
    store.set({
        ...workout,
        exercises: workout.exercises.map((exercise, index) =>
            index !== exerciseIndex
                ? exercise
                : {
                      ...exercise,
                      sets: exercise.sets.map((set) =>
                          set.setNumber === setLog.setNumber ? { ...setLog, completed: true } : set,
                      ),
                  },
        ),
    });
}

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key),
    }),
}));

vi.mock('@/stores/readinessStore', () => ({
    useReadinessStore: () => ({ getTodayLog: () => ({ date: '2026-11-22', overallScore: 3 }) }),
}));

vi.mock('@/stores/planStore', () => ({
    usePlanStore: () => {
        const activeWorkout = useSyncExternalStore(store.subscribe, store.get);
        return {
            getPlanById: () => planFixture,
            activeWorkout,
            startWorkout: store.startWorkout,
            cancelWorkout: vi.fn(),
            logSet,
            skipExercise: vi.fn(),
            completeWorkout: store.completeWorkout,
            preferredWeightUnit: 'lbs',
            getLastPerformance: () => null,
            startRestTimer: vi.fn(),
        };
    },
}));

vi.mock('@/components/tools/PlateCalculator', () => ({ PlateCalculatorDialog: () => null }));
vi.mock('../WorkoutSummary', () => ({ WorkoutSummary: () => <div>Workout summary</div> }));
vi.mock('../RestTimer', () => ({ RestTimer: () => null }));
vi.mock('../WarmUpSets', () => ({ WarmUpSets: () => null }));
vi.mock('../SupersetIndicator', () => ({ SupersetIndicator: () => null, getSupersetLabel: () => 'A1' }));
vi.mock('@/hooks/useWorkoutTimer', () => ({ useWorkoutTimer: () => ({ formattedTime: '00:00' }) }));
vi.mock('@/hooks/useHaptics', () => ({
    useHaptics: () => ({ impact: vi.fn(), notification: vi.fn() }),
    NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));

function renderLogger() {
    return render(
        <MemoryRouter initialEntries={['/workout/plan-1/0']}>
            <Routes>
                <Route path="/workout/:planId/:dayIndex" element={<WorkoutLogger />} />
            </Routes>
        </MemoryRouter>,
    );
}

function completeSet(setNumber: number, weight: string, reps: string) {
    const row = screen.getByRole('group', { name: `Set ${setNumber}` });
    fireEvent.change(within(row).getByRole('spinbutton', { name: 'Weight (lbs)' }), { target: { value: weight } });
    fireEvent.change(within(row).getByRole('spinbutton', { name: 'Reps' }), { target: { value: reps } });
    fireEvent.click(within(row).getByRole('button', { name: 'Complete Set' }));
}

describe('WorkoutLogger across exercises', () => {
    beforeEach(() => {
        store.completeWorkout.mockReset();
        store.startWorkout.mockReset();
        // Like the real store: completing returns the log and clears the active workout.
        store.completeWorkout.mockImplementation(() => {
            const workout = store.get() as FakeWorkout;
            store.set(null);
            return { id: 'log-1', dayName: workout.dayName };
        });
        store.set(freshWorkout());
    });

    it('unlocks the next exercise after one is completed, and keeps the logged one', () => {
        renderLogger();
        expect(screen.getByRole('heading', { name: 'Bench Press' })).toBeInTheDocument();

        completeSet(1, '40', '10');
        completeSet(2, '40', '9');
        expect(screen.getAllByRole('img', { name: 'Set completed' })).toHaveLength(2);

        fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
        expect(screen.getByRole('heading', { name: 'Barbell Row' })).toBeInTheDocument();

        // Before DEBT-095 the reused rows stayed locked with Bench Press's numbers.
        expect(screen.queryByRole('img', { name: 'Set completed' })).not.toBeInTheDocument();
        const firstRow = screen.getByRole('group', { name: 'Set 1' });
        expect(within(firstRow).getByRole('spinbutton', { name: 'Weight (lbs)' })).toBeEnabled();
        expect(within(firstRow).getByRole('button', { name: 'Complete Set' })).toBeInTheDocument();

        completeSet(1, '60', '8');
        expect(screen.getAllByRole('img', { name: 'Set completed' })).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { name: 'Previous exercise' }));
        expect(screen.getByRole('heading', { name: 'Bench Press' })).toBeInTheDocument();
        expect(screen.getAllByRole('img', { name: 'Set completed' })).toHaveLength(2);
        const benchSecond = screen.getByRole('group', { name: 'Set 2' });
        expect(within(benchSecond).getByRole('spinbutton', { name: 'Reps' })).toHaveValue(9);
    });

    it('shows saved sets as completed when the logger mounts on a saved workout', () => {
        const saved = freshWorkout();
        saved.exercises[0].sets[0] = { setNumber: 1, weight: 45, weightUnit: 'lbs', reps: 10, rir: 2, completed: true };
        store.set(saved);

        renderLogger();

        const firstRow = screen.getByRole('group', { name: 'Set 1' });
        expect(within(firstRow).getByRole('img', { name: 'Set completed' })).toBeInTheDocument();
        expect(within(firstRow).getByRole('spinbutton', { name: 'Weight (lbs)' })).toHaveValue(45);
        expect(within(screen.getByRole('group', { name: 'Set 2' })).getByRole('button', { name: 'Complete Set' })).toBeInTheDocument();
    });

    it('offers Finish workout once a set is logged; rating it shows the summary', () => {
        renderLogger();
        const finish = screen.getByRole('button', { name: 'Finish workout' });
        expect(finish).toBeDisabled();

        completeSet(1, '40', '10');
        expect(finish).toBeEnabled();

        fireEvent.click(finish);
        expect(screen.getByRole('alertdialog', { name: 'How was the workout?' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Just Right' }));
        expect(store.completeWorkout).toHaveBeenCalledWith('just_right', '');
        // The summary shows, rather than a readiness check or a fresh workout.
        expect(screen.getByText('Workout summary')).toBeInTheDocument();
        expect(store.startWorkout).not.toHaveBeenCalled();
    });
});
