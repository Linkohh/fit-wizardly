import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiftTruthMeterCard } from '@/components/analytics/LiftTruthMeterCard';
import { PlanFitReviewCard } from '@/components/analytics/PlanFitReviewCard';
import { SessionRescueCard } from '@/components/analytics/SessionRescueCard';
import { TrainingCompassCard } from '@/components/analytics/TrainingCompassCard';
import { WeeklyCoachSummaryCard } from '@/components/analytics/WeeklyCoachSummaryCard';
import type { ReadinessEntry } from '@/types/readiness';
import type { Exercise, Plan, SetLog, WorkoutLog } from '@/types/fitness';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const now = new Date('2026-04-30T12:00:00.000Z');

const mocks = vi.hoisted(() => ({
  planState: {
    currentPlan: null as Plan | null,
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

function exercise(id: string, name: string): Exercise {
  return {
    id,
    name,
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    equipment: ['barbell'],
    patterns: ['squat'],
    contraindications: [],
    cues: [],
  };
}

function currentPlan(): Plan {
  return {
    id: 'plan-1',
    createdAt: daysAgo(20),
    splitType: 'upper_lower',
    selections: {
      firstName: 'Test',
      lastName: 'User',
      personalGoalNote: '',
      isTrainer: false,
      coachNotes: '',
      goal: 'strength',
      experienceLevel: 'intermediate',
      equipment: ['barbell'],
      targetMuscles: ['quads'],
      constraints: [],
      daysPerWeek: 2,
      sessionDuration: 60,
    },
    workoutDays: [
      {
        dayIndex: 0,
        name: 'Lower',
        focusTags: ['Squat'],
        estimatedDuration: 60,
        exercises: [
          { exercise: exercise('squat', 'Back Squat'), sets: 4, reps: '5', rir: 2, restSeconds: 150 },
          { exercise: exercise('rdl', 'Romanian Deadlift'), sets: 3, reps: '8', rir: 2, restSeconds: 120 },
        ],
      },
      {
        dayIndex: 1,
        name: 'Upper',
        focusTags: ['Press'],
        estimatedDuration: 55,
        exercises: [
          { exercise: exercise('bench', 'Bench Press'), sets: 4, reps: '6', rir: 2, restSeconds: 150 },
        ],
      },
    ],
    weeklyVolume: [],
    rirProgression: [],
    notes: [],
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
    mocks.planState.currentPlan = currentPlan();
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

  it('renders lift truth meter with the top lift status', () => {
    render(<LiftTruthMeterCard now={now} />);

    expect(screen.getByText('Lift Truth Meter')).toBeInTheDocument();
    expect(screen.getByText('Back Squat')).toBeInTheDocument();
    expect(screen.getByText('Clean Progress')).toBeInTheDocument();
  });

  it('renders weekly coach notes from current logs', () => {
    render(<WeeklyCoachSummaryCard now={now} />);

    expect(screen.getByText('Weekly Coach Notes')).toBeInTheDocument();
    expect(screen.getAllByText(/3 sessions completed/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Repeat the core lifts/)).toBeInTheDocument();
  });

  it('renders plan fit review from the current plan only', () => {
    render(<PlanFitReviewCard now={now} />);

    expect(screen.getByText('Plan Fit Review')).toBeInTheDocument();
    expect(screen.getAllByText(/current plan/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/training day balance/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Autopsy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dayIndex/i)).not.toBeInTheDocument();
  });

  it('renders session rescue for the least recently completed plan day', () => {
    mocks.planState.workoutLogs = [workout(2, 100)];
    mocks.readinessState.logs = [readiness(0)];

    render(<SessionRescueCard now={now} />);

    expect(screen.getByText('Session Rescue')).toBeInTheDocument();
    expect(screen.getByText(/Upper/)).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });
});
