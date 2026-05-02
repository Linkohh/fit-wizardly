import { describe, expect, it } from 'vitest';
import {
  buildLiftTruthMeter,
  buildPlanFitReview,
  buildSessionRescue,
  buildTrainingCompass,
  buildWeeklyChangeBrief,
  buildWeeklyCoachSummary,
} from '@/lib/analyticsIntelligence';
import type { ReadinessEntry } from '@/types/readiness';
import type { Exercise, PerceivedDifficulty, Plan, SetLog, WeightUnit, WorkoutLog } from '@/types/fitness';

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
    dayIndex?: number;
    exerciseLogs?: WorkoutLog['exercises'];
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
    dayIndex: options.dayIndex ?? 0,
    dayName: 'Training Day',
    startedAt: new Date(completedAt.getTime() - (options.duration ?? 55) * 60_000),
    completedAt,
    duration: options.duration ?? 55,
    perceivedDifficulty: options.perceivedDifficulty ?? 'just_right',
    totalVolume,
    exercises: options.exerciseLogs ?? [
      {
        exerciseId: options.exerciseId ?? 'squat',
        exerciseName: options.exerciseName ?? 'Back Squat',
        sets,
      },
    ],
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

function plan(overrides: Partial<Plan> = {}): Plan {
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
        name: 'Lower A',
        focusTags: ['Squat'],
        estimatedDuration: 60,
        exercises: [
          { exercise: exercise('squat', 'Back Squat'), sets: 4, reps: '5', rir: 2, restSeconds: 150 },
          { exercise: exercise('rdl', 'Romanian Deadlift'), sets: 3, reps: '8', rir: 2, restSeconds: 120 },
        ],
      },
      {
        dayIndex: 1,
        name: 'Upper A',
        focusTags: ['Press'],
        estimatedDuration: 55,
        exercises: [
          { exercise: exercise('bench', 'Bench Press'), sets: 4, reps: '6', rir: 2, restSeconds: 150 },
          { exercise: exercise('row', 'Barbell Row'), sets: 3, reps: '8', rir: 2, restSeconds: 120 },
        ],
      },
    ],
    weeklyVolume: [],
    rirProgression: [],
    notes: [],
    ...overrides,
  };
}

function expectNoBannedCopy(value: unknown) {
  const serialized = JSON.stringify(value).toLowerCase();
  expect(serialized).not.toMatch(/\b(injury|injured|medical|blame|fault|lazy|missed calendar days?)\b/);
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

describe('buildWeeklyChangeBrief', () => {
  it('returns a starter brief when training and readiness data are missing', () => {
    const brief = buildWeeklyChangeBrief({
      workoutLogs: [],
      readinessLogs: [],
      now,
    });

    expect(brief.status).toBe('needs_data');
    expect(brief.confidence).toBe('low');
    expect(brief.title).toContain('Weekly Change Brief');
    expect(brief.summary).toContain('Log');
    expect(brief.keySignals).toHaveLength(2);
    expectNoBannedCopy(brief);
  });

  it('flags higher load with lower readiness as the priority signal', () => {
    const brief = buildWeeklyChangeBrief({
      workoutLogs: [
        workout(1, { totalVolume: 6_000, perceivedDifficulty: 'challenging' }),
        workout(3, { totalVolume: 5_000, perceivedDifficulty: 'too_hard' }),
        workout(9, { totalVolume: 3_000 }),
      ],
      readinessLogs: [
        readiness(0, { overallScore: 2.5, energyLevel: 2, stressLevel: 4 }),
        readiness(2, { overallScore: 2.7, energyLevel: 2 }),
        readiness(10, { overallScore: 4.1 }),
      ],
      now,
    });

    expect(brief.status).toBe('watch_recovery');
    expect(brief.summary).toMatch(/load.*up/i);
    expect(brief.summary).toMatch(/readiness.*down/i);
    expect(brief.nextAction).toMatch(/Hold|stable|repeatable/i);
    expect(brief.metrics.volumeChangePercent).toBeGreaterThan(0);
    expect(brief.metrics.readinessTrend).toBeLessThan(0);
    expectNoBannedCopy(brief);
  });

  it('keeps the brief positive when load and readiness are stable', () => {
    const brief = buildWeeklyChangeBrief({
      workoutLogs: [
        workout(1, { totalVolume: 4_000 }),
        workout(3, { totalVolume: 3_800 }),
        workout(8, { totalVolume: 4_100 }),
        workout(11, { totalVolume: 3_900 }),
      ],
      readinessLogs: [
        readiness(0, { overallScore: 4.1 }),
        readiness(3, { overallScore: 4 }),
        readiness(9, { overallScore: 4.2 }),
      ],
      now,
    });

    expect(brief.status).toBe('steady');
    expect(brief.confidence).toBe('high');
    expect(brief.summary).toContain('steady');
    expect(brief.nextAction).toMatch(/Repeat|small/i);
    expectNoBannedCopy(brief);
  });

  it('identifies a quieter week without shaming missed sessions', () => {
    const brief = buildWeeklyChangeBrief({
      workoutLogs: [
        workout(2, { totalVolume: 1_500 }),
        workout(8, { totalVolume: 3_000 }),
        workout(11, { totalVolume: 3_200 }),
      ],
      readinessLogs: [readiness(0, { overallScore: 4.4 }), readiness(9, { overallScore: 3.8 })],
      now,
    });

    expect(brief.status).toBe('rebuild_rhythm');
    expect(brief.summary).toMatch(/quieter|down/i);
    expect(brief.nextAction).toContain('repeatable');
    expectNoBannedCopy(brief);
  });
});

describe('buildPlanFitReview', () => {
  it('returns needs_data when the active plan or current-plan logs are missing', () => {
    const insight = buildPlanFitReview({
      workoutLogs: [workout(1, { planId: 'old-plan' })],
      readinessLogs: [readiness(0)],
      currentPlan: plan(),
      now,
    });

    expect(insight.status).toBe('needs_data');
    expect(insight.confidence).toBe('low');
    expect(insight.metrics.completionRatio).toBe(0);
    expectNoBannedCopy(insight);
  });

  it('ignores old-plan logs when judging plan fit', () => {
    const insight = buildPlanFitReview({
      workoutLogs: [
        workout(1, { planId: 'old-plan', duration: 95, perceivedDifficulty: 'too_hard' }),
        workout(2, { planId: 'old-plan', duration: 90, perceivedDifficulty: 'too_hard' }),
      ],
      readinessLogs: [readiness(0)],
      currentPlan: plan(),
      now,
    });

    expect(insight.status).toBe('needs_data');
    expect(insight.metrics.currentPlanLogs).toBe(0);
  });

  it('marks a plan as fitting well when completion and recovery signals are steady', () => {
    const insight = buildPlanFitReview({
      workoutLogs: [workout(1), workout(3, { dayIndex: 1 }), workout(6), workout(8, { dayIndex: 1 })],
      readinessLogs: [readiness(0), readiness(3), readiness(6)],
      currentPlan: plan(),
      now,
    });

    expect(insight.status).toBe('fits_well');
    expect(insight.fitScore).toBeGreaterThanOrEqual(75);
    expect(insight.metrics.dayIndexImbalance).toBeLessThanOrEqual(1);
    expectNoBannedCopy(insight);
  });

  it('requires multiple friction signals before calling a plan too dense', () => {
    const lightFriction = buildPlanFitReview({
      workoutLogs: [workout(1, { duration: 90 }), workout(3, { dayIndex: 1, duration: 88 })],
      readinessLogs: [readiness(0), readiness(2)],
      currentPlan: plan(),
      now,
    });
    const dense = buildPlanFitReview({
      workoutLogs: [
        workout(1, {
          duration: 96,
          perceivedDifficulty: 'challenging',
          exerciseLogs: [
            { exerciseId: 'squat', exerciseName: 'Back Squat', sets: [setLog(100, 5)] },
            { exerciseId: 'rdl', exerciseName: 'Romanian Deadlift', sets: [], skipped: true },
          ],
        }),
        workout(3, {
          duration: 92,
          perceivedDifficulty: 'too_hard',
          exerciseLogs: [
            { exerciseId: 'squat', exerciseName: 'Back Squat', sets: [setLog(100, 5)] },
            { exerciseId: 'rdl', exerciseName: 'Romanian Deadlift', sets: [], skipped: true },
          ],
        }),
        workout(6, { duration: 94, perceivedDifficulty: 'challenging' }),
      ],
      readinessLogs: [readiness(0), readiness(2)],
      currentPlan: plan(),
      now,
    });

    expect(lightFriction.status).not.toBe('too_dense');
    expect(dense.status).toBe('too_dense');
    expect(dense.metrics.leastLoggedDayIndex).toBe(1);
    expect(dense.reasons.join(' ')).toContain('day pattern');
    expectNoBannedCopy(dense);
  });

  it('detects recovery mismatch and under-dosed plans without false precision', () => {
    const recoveryMismatch = buildPlanFitReview({
      workoutLogs: [
        workout(1, { perceivedDifficulty: 'too_hard', duration: 82 }),
        workout(3, { dayIndex: 1, perceivedDifficulty: 'challenging', duration: 78 }),
        workout(6, { perceivedDifficulty: 'too_hard', duration: 84 }),
      ],
      readinessLogs: [
        readiness(0, { overallScore: 2.2, energyLevel: 2, stressLevel: 4 }),
        readiness(4, { overallScore: 3.1 }),
        readiness(8, { overallScore: 3.8 }),
      ],
      currentPlan: plan(),
      now,
    });
    const underDosed = buildPlanFitReview({
      workoutLogs: [
        workout(1, { duration: 31, perceivedDifficulty: 'too_easy' }),
        workout(3, { dayIndex: 1, duration: 34, perceivedDifficulty: 'too_easy' }),
        workout(5, { duration: 32, perceivedDifficulty: 'just_right' }),
        workout(7, { dayIndex: 1, duration: 33, perceivedDifficulty: 'too_easy' }),
      ],
      readinessLogs: [readiness(0, { overallScore: 4.8 }), readiness(2, { overallScore: 4.6 })],
      currentPlan: plan(),
      now,
    });

    expect(recoveryMismatch.status).toBe('recovery_mismatch');
    expect(recoveryMismatch.confidence).not.toBe('high');
    expect(underDosed.status).toBe('under_dosed');
    expectNoBannedCopy(recoveryMismatch);
    expectNoBannedCopy(underDosed);
  });
});

describe('buildLiftTruthMeter', () => {
  it('returns needs_data until lifts have enough meaningful exposures', () => {
    const [insight] = buildLiftTruthMeter({
      workoutLogs: [workout(4), workout(1)],
      preferredWeightUnit: 'lbs',
      now,
    });

    expect(insight.status).toBe('needs_data');
    expect(insight.confidence).toBe('low');
  });

  it('distinguishes clean progress, grind debt, quiet progress, and technique checks', () => {
    const workoutLogs = [
      workout(12, { exerciseId: 'squat', exerciseName: 'Back Squat', sets: [setLog(100, 5, { rir: 2 })] }),
      workout(8, { exerciseId: 'squat', exerciseName: 'Back Squat', sets: [setLog(105, 5, { rir: 2 })] }),
      workout(2, { exerciseId: 'squat', exerciseName: 'Back Squat', sets: [setLog(110, 5, { rir: 2 })] }),
      workout(12, { exerciseId: 'bench', exerciseName: 'Bench Press', sets: [setLog(100, 5, { rir: 3 })] }),
      workout(8, { exerciseId: 'bench', exerciseName: 'Bench Press', sets: [setLog(108, 5, { rir: 1 })], perceivedDifficulty: 'challenging' }),
      workout(2, { exerciseId: 'bench', exerciseName: 'Bench Press', sets: [setLog(114, 5, { rir: 0 })], perceivedDifficulty: 'too_hard' }),
      workout(12, { exerciseId: 'row', exerciseName: 'Barbell Row', sets: [setLog(95, 8, { rir: 1 })], perceivedDifficulty: 'challenging' }),
      workout(8, { exerciseId: 'row', exerciseName: 'Barbell Row', sets: [setLog(95, 8, { rir: 2 })] }),
      workout(2, { exerciseId: 'row', exerciseName: 'Barbell Row', sets: [setLog(96, 8, { rir: 3 })], perceivedDifficulty: 'too_easy' }),
      workout(12, { exerciseId: 'press', exerciseName: 'Overhead Press', sets: [setLog(90, 5, { rir: 1 })], perceivedDifficulty: 'challenging' }),
      workout(8, { exerciseId: 'press', exerciseName: 'Overhead Press', sets: [setLog(84, 5, { rir: 0 })], perceivedDifficulty: 'too_hard' }),
      workout(2, { exerciseId: 'press', exerciseName: 'Overhead Press', sets: [setLog(88, 5, { rir: 0 })], perceivedDifficulty: 'too_hard' }),
    ];

    const insights = buildLiftTruthMeter({ workoutLogs, preferredWeightUnit: 'lbs', now, limit: 4 });

    expect(insights.find((item) => item.exerciseId === 'squat')?.status).toBe('clean_progress');
    expect(insights.find((item) => item.exerciseId === 'bench')?.status).toBe('grind_debt');
    expect(insights.find((item) => item.exerciseId === 'row')?.status).toBe('quiet_progress');
    expect(insights.find((item) => item.exerciseId === 'press')?.status).toBe('technique_check');
    insights.forEach(expectNoBannedCopy);
  });
});

describe('buildSessionRescue', () => {
  it('returns needs_plan when plan or target day is missing', () => {
    const rescue = buildSessionRescue({
      currentPlan: null,
      targetDayIndex: null,
      workoutLogs: [],
      readinessLogs: [],
      now,
    });

    expect(rescue.status).toBe('needs_plan');
    expect(rescue.recommendations).toEqual([]);
  });

  it('chooses compact rescue durations from readiness and recent strain without mutating the plan', () => {
    const currentPlan = plan();
    const originalSetCount = currentPlan.workoutDays[0].exercises[0].sets;
    const full = buildSessionRescue({
      currentPlan,
      targetDayIndex: 0,
      workoutLogs: [workout(4)],
      readinessLogs: [readiness(0, { overallScore: 4.5 })],
      now,
    });
    const rescue15 = buildSessionRescue({
      currentPlan,
      targetDayIndex: 0,
      workoutLogs: [
        workout(1, { perceivedDifficulty: 'too_hard', duration: 95 }),
        workout(3, { perceivedDifficulty: 'challenging', duration: 90 }),
      ],
      readinessLogs: [readiness(0, { overallScore: 2.1, energyLevel: 2, stressLevel: 5 })],
      now,
    });

    expect(full.status).toBe('full_session_ok');
    expect(full.recommendedDuration).toBeGreaterThanOrEqual(35);
    expect(rescue15.status).toBe('rescue_15');
    expect(rescue15.recommendedDuration).toBe(15);
    expect(rescue15.recommendations).toHaveLength(2);
    expect(new Set(rescue15.recommendations.map((item) => item.exerciseId)).size).toBe(rescue15.recommendations.length);
    expect(currentPlan.workoutDays[0].exercises[0].sets).toBe(originalSetCount);
    expectNoBannedCopy(rescue15);
  });

  it('does not duplicate exercises when the target day is shorter than the rescue template', () => {
    const oneLiftPlan = plan({
      workoutDays: [
        {
          dayIndex: 0,
          name: 'Press',
          focusTags: ['Press'],
          estimatedDuration: 35,
          exercises: [
            { exercise: exercise('bench', 'Bench Press'), sets: 4, reps: '6', rir: 2, restSeconds: 150 },
          ],
        },
      ],
    });

    const rescue = buildSessionRescue({
      currentPlan: oneLiftPlan,
      targetDayIndex: 0,
      workoutLogs: [
        workout(1, { perceivedDifficulty: 'too_hard', duration: 95 }),
        workout(3, { perceivedDifficulty: 'challenging', duration: 90 }),
      ],
      readinessLogs: [readiness(0, { overallScore: 2.1, energyLevel: 2, stressLevel: 5 })],
      now,
    });

    expect(rescue.status).toBe('rescue_15');
    expect(rescue.recommendations).toHaveLength(1);
    expect(rescue.recommendations[0].exerciseName).toBe('Bench Press');
  });
});
