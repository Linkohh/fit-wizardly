import { describe, expect, it } from 'vitest';
import {
  buildLiftMomentum,
  buildTrainingCompass,
  buildWeeklyCoachSummary,
} from '@/lib/analyticsIntelligence';
import type { ReadinessEntry } from '@/types/readiness';
import type { PerceivedDifficulty, SetLog, WeightUnit, WorkoutLog } from '@/types/fitness';

const now = new Date('2026-04-30T12:00:00.000Z');

function daysAgo(days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function readiness(days: number, overrides: Partial<ReadinessEntry> = {}): ReadinessEntry {
  const date = daysAgo(days).toISOString().split('T')[0];
  const base: ReadinessEntry = {
    date,
    sleepQuality: 4,
    muscleSoreness: 2,
    energyLevel: 4,
    stressLevel: 2,
    overallScore: 4,
  };
  return { ...base, ...overrides };
}

function setLog(
  weight: number,
  reps: number,
  overrides: Partial<SetLog> = {},
): SetLog {
  return {
    setNumber: 1,
    weight,
    weightUnit: 'lbs',
    reps,
    rir: 2,
    completed: true,
    ...overrides,
  };
}

function workout(
  days: number,
  options: {
    id?: string;
    exerciseName?: string;
    exerciseId?: string;
    sets?: SetLog[];
    perceivedDifficulty?: PerceivedDifficulty;
    duration?: number;
    totalVolume?: number;
    planId?: string;
    unit?: WeightUnit;
  } = {},
): WorkoutLog {
  const sets = options.sets ?? [setLog(100, 5, { weightUnit: options.unit ?? 'lbs' })];
  const completedAt = daysAgo(days);
  const totalVolume =
    options.totalVolume ?? sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

  return {
    id: options.id ?? `log-${days}-${options.exerciseName ?? 'squat'}`,
    planId: options.planId ?? 'plan-1',
    dayIndex: 0,
    dayName: 'Training Day',
    startedAt: new Date(completedAt.getTime() - (options.duration ?? 55) * 60_000),
    completedAt,
    duration: options.duration ?? 55,
    perceivedDifficulty: options.perceivedDifficulty ?? 'just_right',
    totalVolume,
    exercises: [
      {
        exerciseId: options.exerciseId ?? 'squat',
        exerciseName: options.exerciseName ?? 'Back Squat',
        sets,
      },
    ],
  };
}

describe('buildTrainingCompass', () => {
  it('returns needs_data when readiness and workout history are missing', () => {
    const insight = buildTrainingCompass({ workoutLogs: [], readinessLogs: [], now });

    expect(insight.status).toBe('needs_data');
    expect(insight.confidence).toBe('low');
    expect(insight.nextAction).toContain('Log');
  });

  it('recommends push when readiness is high and recent workload is manageable', () => {
    const insight = buildTrainingCompass({
      workoutLogs: [workout(1), workout(3)],
      readinessLogs: [readiness(0, { overallScore: 4.5, muscleSoreness: 1, stressLevel: 1 })],
      now,
    });

    expect(insight.status).toBe('push');
    expect(insight.confidence).toBe('high');
    expect(insight.nextAction).toMatch(/Add 1 rep|2.5-5 lb/);
  });

  it('holds when signals are mixed instead of overreacting to one stressor', () => {
    const insight = buildTrainingCompass({
      workoutLogs: [workout(1, { perceivedDifficulty: 'challenging' }), workout(4)],
      readinessLogs: [readiness(0, { overallScore: 3.4, energyLevel: 3, stressLevel: 3 })],
      now,
    });

    expect(insight.status).toBe('hold');
    expect(insight.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('dials back only when poor readiness combines with high recent strain', () => {
    const insight = buildTrainingCompass({
      workoutLogs: [
        workout(1, { perceivedDifficulty: 'too_hard', duration: 95, totalVolume: 18_000 }),
        workout(3, { perceivedDifficulty: 'challenging', duration: 85, totalVolume: 16_000 }),
        workout(10, { totalVolume: 8_000 }),
      ],
      readinessLogs: [
        readiness(0, {
          overallScore: 2.1,
          sleepQuality: 2,
          muscleSoreness: 5,
          energyLevel: 2,
          stressLevel: 4,
        }),
      ],
      now,
    });

    expect(insight.status).toBe('dial_back');
    expect(insight.stressSignals.length).toBeGreaterThanOrEqual(3);
    expect(insight.nextAction).toMatch(/Reduce|cut/);
  });
});

describe('buildLiftMomentum', () => {
  it('marks lifts as needs_data until there are enough meaningful exposures', () => {
    const [insight] = buildLiftMomentum({
      workoutLogs: [workout(4), workout(1)],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(insight.status).toBe('needs_data');
    expect(insight.confidence).toBe('low');
  });

  it('marks a lift climbing when e1RM improves with stable effort', () => {
    const [insight] = buildLiftMomentum({
      workoutLogs: [
        workout(6, { sets: [setLog(100, 5, { rir: 2 })] }),
        workout(3, { sets: [setLog(105, 5, { rir: 2 })] }),
        workout(1, { sets: [setLog(110, 5, { rir: 2 })] }),
      ],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(insight.status).toBe('climbing');
    expect(insight.changePercent).toBeGreaterThan(3);
  });

  it('keeps a stable lift neutral instead of treating maintenance as failure', () => {
    const [insight] = buildLiftMomentum({
      workoutLogs: [
        workout(8, { sets: [setLog(100, 5, { rir: 2 })] }),
        workout(4, { sets: [setLog(101, 5, { rir: 2 })] }),
        workout(1, { sets: [setLog(100, 5, { rir: 2 })] }),
      ],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(insight.status).toBe('flat');
    expect(insight.interpretation).toContain('maintenance');
  });

  it('marks a lift fatigued when performance drops while effort stress rises', () => {
    const [insight] = buildLiftMomentum({
      workoutLogs: [
        workout(9, { sets: [setLog(120, 5, { rir: 3 })], perceivedDifficulty: 'just_right' }),
        workout(5, { sets: [setLog(116, 5, { rir: 1 })], perceivedDifficulty: 'challenging' }),
        workout(1, { sets: [setLog(108, 5, { rir: 0 })], perceivedDifficulty: 'too_hard' }),
      ],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(insight.status).toBe('fatigued');
    expect(insight.nextAction).toMatch(/Hold|reduce/);
  });
});

describe('buildWeeklyCoachSummary', () => {
  it('returns a low-confidence starter note when the week has no logs', () => {
    const summary = buildWeeklyCoachSummary({
      workoutLogs: [],
      readinessLogs: [],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(summary.confidence).toBe('low');
    expect(summary.title).toContain('weekly signal');
  });

  it('summarizes a normal training week with a concrete next-week focus', () => {
    const summary = buildWeeklyCoachSummary({
      workoutLogs: [workout(1), workout(3), workout(6), workout(10, { totalVolume: 900 })],
      readinessLogs: [readiness(0), readiness(2), readiness(5)],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(summary.stats.sessionsThisWeek).toBe(3);
    expect(summary.highlights.join(' ')).toContain('sessions completed');
    expect(summary.nextWeekFocus.length).toBeGreaterThan(10);
  });

  it('calls out strained recovery without making injury predictions', () => {
    const summary = buildWeeklyCoachSummary({
      workoutLogs: [
        workout(1, { perceivedDifficulty: 'too_hard', duration: 90, totalVolume: 16_000 }),
        workout(3, { perceivedDifficulty: 'challenging', duration: 85, totalVolume: 14_000 }),
      ],
      readinessLogs: [
        readiness(0, { overallScore: 2.2, muscleSoreness: 5, stressLevel: 4 }),
        readiness(3, { overallScore: 2.5, muscleSoreness: 4, stressLevel: 4 }),
      ],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(summary.summary).toContain('recovery looks strained');
    expect(summary.summary.toLowerCase()).not.toContain('injury');
  });

  it('flags low adherence as a coaching focus without shaming the user', () => {
    const summary = buildWeeklyCoachSummary({
      workoutLogs: [workout(2)],
      readinessLogs: [readiness(0, { overallScore: 4 })],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(summary.highlights.join(' ')).toContain('1 session completed');
    expect(summary.nextWeekFocus).toContain('repeatable');
  });
});
