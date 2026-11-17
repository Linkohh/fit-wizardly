import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PersonalRecord, Plan, WorkoutLog } from '@/types/fitness';
import {
  MAX_WORKOUT_LOGS,
  sanitizePlanPersistedState,
} from '@/stores/planStore.persistence';

const mocks = vi.hoisted(() => ({
  postWorkoutToCircles: vi.fn(async () => undefined),
  postPRToCircles: vi.fn(async () => undefined),
}));

vi.mock('@/lib/circleActivity', () => ({
  postWorkoutToCircles: mocks.postWorkoutToCircles,
  postPRToCircles: mocks.postPRToCircles,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: () => ({ user: null }) },
}));

function buildPlan(id: string): Plan {
  return {
    id,
    createdAt: new Date('2026-11-01T09:00:00.000Z'),
    splitType: 'full_body',
    selections: { daysPerWeek: 3 },
    workoutDays: [{ dayIndex: 0, name: 'Full Body A', exercises: [] }],
    weeklyVolume: [],
    rirProgression: [],
    notes: [],
  } as unknown as Plan;
}

function buildLog(id: string): WorkoutLog {
  return {
    id,
    planId: 'plan-1',
    dayIndex: 0,
    dayName: 'Full Body A',
    startedAt: new Date('2026-11-16T17:00:00.000Z'),
    completedAt: new Date('2026-11-16T17:50:00.000Z'),
    duration: 50,
    exercises: [],
    perceivedDifficulty: 'just_right',
    totalVolume: 4200,
  };
}

function buildRecord(id: string): PersonalRecord {
  return {
    id,
    exerciseId: 'barbell-squat',
    exerciseName: 'Barbell Squat',
    type: 'weight',
    previousValue: 200,
    newValue: 215,
    achievedAt: new Date('2026-11-16T17:40:00.000Z'),
    workoutLogId: 'log-1',
  };
}

/** Loads a fresh copy of the store, as if the app had just started. */
async function startApp() {
  vi.resetModules();
  const { usePlanStore } = await import('@/stores/planStore');
  await vi.waitFor(() => {
    expect(usePlanStore.persist.hasHydrated()).toBe(true);
  });
  return usePlanStore;
}

/** Waits until the saved copy on the device matches, so no write is still in flight. */
async function waitForSave(check: (saved: { state: Record<string, unknown> }) => boolean) {
  const { appStorage } = await import('@/lib/storage/appStorage');
  await vi.waitFor(async () => {
    const raw = await appStorage.getItem('fitwizard-plans');
    expect(raw).not.toBeNull();
    expect(check(JSON.parse(raw as string))).toBe(true);
  });
}

const hasLog = (id: string) => (saved: { state: Record<string, unknown> }) =>
  Array.isArray(saved.state.workoutLogs) &&
  (saved.state.workoutLogs as Array<{ id?: string }>).some((log) => log.id === id);

describe('planStore saves to the device', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    await startApp();
    // persist.clearStorage() doesn't return its promise, so clear directly.
    const { appStorage } = await import('@/lib/storage/appStorage');
    await appStorage.removeItem('fitwizard-plans');
    expect(await appStorage.getItem('fitwizard-plans')).toBeNull();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the plan, workout logs and personal records after a restart', async () => {
    const plan = buildPlan('plan-1');
    let store = await startApp();
    store.setState({
      currentPlan: plan,
      planHistory: [plan],
      workoutLogs: [buildLog('log-1')],
      personalRecords: [buildRecord('pr-1')],
      currentWeek: 2,
      preferredWeightUnit: 'kg',
    });
    await waitForSave(hasLog('log-1'));

    store = await startApp();
    const state = store.getState();

    expect(state.currentPlan?.id).toBe('plan-1');
    expect(state.planHistory.map((p) => p.id)).toEqual(['plan-1']);
    expect(state.workoutLogs.map((l) => l.id)).toEqual(['log-1']);
    expect(state.workoutLogs[0].completedAt).toBeInstanceOf(Date);
    expect(state.workoutLogs[0].completedAt.toISOString()).toBe('2026-11-16T17:50:00.000Z');
    expect(state.personalRecords[0].achievedAt).toBeInstanceOf(Date);
    expect(state.currentWeek).toBe(2);
    expect(state.preferredWeightUnit).toBe('kg');
  });

  it('resumes a workout that was in progress when the app closed', async () => {
    let store = await startApp();
    store.setState({
      activeWorkout: {
        planId: 'plan-1',
        dayIndex: 0,
        dayName: 'Full Body A',
        startedAt: new Date('2026-11-17T08:00:00.000Z'),
        exercises: [],
        currentExerciseIndex: 1,
        currentSetIndex: 2,
        restTimerEndTime: null,
      },
    });
    await waitForSave((saved) => saved.state.activeWorkout != null);

    store = await startApp();
    const active = store.getState().activeWorkout;

    expect(active?.planId).toBe('plan-1');
    expect(active?.currentExerciseIndex).toBe(1);
    expect(active?.startedAt).toBeInstanceOf(Date);
  });

  it('never writes this data to localStorage', async () => {
    const store = await startApp();
    store.setState({ workoutLogs: [buildLog('log-1')] });
    await waitForSave(hasLog('log-1'));

    expect(window.localStorage.getItem('fitwizard-plans')).toBeNull();
  });

  it('carries over settings saved by the previous app version in localStorage', async () => {
    window.localStorage.setItem(
      'fitwizard-plans',
      JSON.stringify({ state: { currentWeek: 3, preferredWeightUnit: 'kg' }, version: 0 }),
    );

    const store = await startApp();

    expect(store.getState().currentWeek).toBe(3);
    expect(store.getState().preferredWeightUnit).toBe('kg');
    expect(store.getState().workoutLogs).toEqual([]);
    expect(window.localStorage.getItem('fitwizard-plans')).toBeNull();
  });
});

describe('completing a workout', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function finishOneWorkout() {
    const store = await startApp();
    const { useAchievementStore } = await import('@/stores/achievementStore');
    useAchievementStore.setState({
      currentStreak: 0,
      lastActivityDate: null,
      weeklyProgress: 0,
      weekStart: null,
    });
    store.setState({
      workoutLogs: [],
      personalRecords: [],
      activeWorkout: {
        planId: 'plan-1',
        dayIndex: 0,
        dayName: 'Full Body A',
        startedAt: new Date(Date.now() - 45 * 60_000),
        exercises: [
          {
            exerciseId: 'barbell-squat',
            exerciseName: 'Barbell Squat',
            sets: [{ setNumber: 1, weight: 185, weightUnit: 'lbs', reps: 5, rir: 2, completed: true }],
          },
        ],
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        restTimerEndTime: null,
      },
    });

    const log = store.getState().completeWorkout('just_right');
    return { log, store };
  }

  it('updates the streak and the weekly goal', async () => {
    const { log, store } = await finishOneWorkout();
    const { useAchievementStore } = await import('@/stores/achievementStore');

    expect(log).not.toBeNull();
    expect(store.getState().workoutLogs).toHaveLength(1);
    await vi.waitFor(() => {
      expect(useAchievementStore.getState().currentStreak).toBe(1);
      expect(useAchievementStore.getState().weeklyProgress).toBe(1);
    });
  });

  it('does not post to Circles while the circles flag is off', async () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'false');
    await finishOneWorkout();

    expect(mocks.postWorkoutToCircles).not.toHaveBeenCalled();
  });

  it('posts to Circles when the circles flag is on', async () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');
    await finishOneWorkout();

    expect(mocks.postWorkoutToCircles).toHaveBeenCalledTimes(1);
  });
});

describe('sanitizePlanPersistedState', () => {
  it('drops malformed entries and keeps the rest', () => {
    const state = sanitizePlanPersistedState({
      workoutLogs: [
        buildLog('good-log'),
        { id: 'missing-fields' },
        { ...buildLog('bad-date'), completedAt: 'not a date' },
        null,
      ],
      personalRecords: [buildRecord('good-pr'), { id: 'pr-without-type', newValue: 5 }],
      planHistory: [buildPlan('good-plan'), { id: 'no-days' }],
      currentPlan: 'corrupt',
      activeWorkout: { planId: 'plan-1' },
      currentWeek: 99,
      preferredWeightUnit: 'stone',
    });

    expect(state.workoutLogs.map((l) => l.id)).toEqual(['good-log']);
    expect(state.personalRecords.map((r) => r.id)).toEqual(['good-pr']);
    expect(state.planHistory.map((p) => p.id)).toEqual(['good-plan']);
    expect(state.currentPlan).toBeNull();
    expect(state.activeWorkout).toBeNull();
    expect(state.currentWeek).toBe(4);
    expect(state.preferredWeightUnit).toBe('lbs');
  });

  it('turns date strings back into dates', () => {
    const state = sanitizePlanPersistedState({
      workoutLogs: [{ ...buildLog('log'), startedAt: '2026-11-16T17:00:00.000Z', completedAt: '2026-11-16T17:50:00.000Z' }],
    });

    expect(state.workoutLogs[0].startedAt).toBeInstanceOf(Date);
  });

  it('returns safe defaults for missing or non-object data', () => {
    for (const input of [undefined, null, 'text', 42, []]) {
      const state = sanitizePlanPersistedState(input);
      expect(state.workoutLogs).toEqual([]);
      expect(state.currentPlan).toBeNull();
      expect(state.currentWeek).toBe(1);
    }
  });

  it(`keeps at most ${MAX_WORKOUT_LOGS} workout logs`, () => {
    const logs = Array.from({ length: MAX_WORKOUT_LOGS + 5 }, (_, index) => buildLog(`log-${index}`));
    expect(sanitizePlanPersistedState({ workoutLogs: logs }).workoutLogs).toHaveLength(MAX_WORKOUT_LOGS);
  });
});
