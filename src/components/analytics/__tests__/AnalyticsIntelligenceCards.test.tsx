import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiftMomentumCard } from '@/components/analytics/LiftMomentumCard';
import { TrainingCompassCard } from '@/components/analytics/TrainingCompassCard';
import { WeeklyCoachSummaryCard } from '@/components/analytics/WeeklyCoachSummaryCard';
import type { ReadinessEntry } from '@/types/readiness';
import type { SetLog, WorkoutLog } from '@/types/fitness';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const now = new Date('2026-04-30T12:00:00.000Z');

const mocks = vi.hoisted(() => ({
  planState: {
    workoutLogs: [] as WorkoutLog[],
    preferredWeightUnit: 'lbs' as const,
  },
  readinessState: {
    logs: [] as ReadinessEntry[],
  },
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: <T,>(selector?: Selector<typeof mocks.planState, T>) =>
    selectState(mocks.planState, selector),
}));

vi.mock('@/stores/readinessStore', () => ({
  useReadinessStore: <T,>(selector?: Selector<typeof mocks.readinessState, T>) =>
    selectState(mocks.readinessState, selector),
}));

function daysAgo(days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function readiness(days: number): ReadinessEntry {
  return {
    date: daysAgo(days).toISOString().split('T')[0],
    sleepQuality: 5,
    muscleSoreness: 1,
    energyLevel: 5,
    stressLevel: 1,
    overallScore: 4.7,
  };
}

function setLog(weight: number, reps: number): SetLog {
  return {
    setNumber: 1,
    weight,
    weightUnit: 'lbs',
    reps,
    rir: 2,
    completed: true,
  };
}

function workout(days: number, weight = 100): WorkoutLog {
  const completedAt = daysAgo(days);
  return {
    id: `log-${days}`,
    planId: 'plan-1',
    dayIndex: 0,
    dayName: 'Lower',
    startedAt: new Date(completedAt.getTime() - 55 * 60_000),
    completedAt,
    duration: 55,
    perceivedDifficulty: 'just_right',
    totalVolume: weight * 5,
    exercises: [
      {
        exerciseId: 'squat',
        exerciseName: 'Back Squat',
        sets: [setLog(weight, 5)],
      },
    ],
  };
}

describe('Analytics intelligence cards', () => {
  beforeEach(() => {
    mocks.planState.workoutLogs = [workout(6, 100), workout(3, 105), workout(1, 110)];
    mocks.planState.preferredWeightUnit = 'lbs';
    mocks.readinessState.logs = [readiness(0), readiness(2)];
  });

  it('renders the daily training compass recommendation', () => {
    render(<TrainingCompassCard now={now} />);

    expect(screen.getByText('Daily Training Compass')).toBeInTheDocument();
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText(/Add 1 rep per set/)).toBeInTheDocument();
  });

  it('renders lift momentum with the top lift status', () => {
    render(<LiftMomentumCard now={now} />);

    expect(screen.getByText('Lift Momentum')).toBeInTheDocument();
    expect(screen.getByText('Back Squat')).toBeInTheDocument();
    expect(screen.getByText('Climbing')).toBeInTheDocument();
  });

  it('renders weekly coach notes from current logs', () => {
    render(<WeeklyCoachSummaryCard now={now} />);

    expect(screen.getByText('Weekly Coach Notes')).toBeInTheDocument();
    expect(screen.getAllByText(/3 sessions completed/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Repeat the core lifts/)).toBeInTheDocument();
  });
});
