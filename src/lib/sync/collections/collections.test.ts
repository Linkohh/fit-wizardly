import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncRow } from '@/lib/sync/types';
import type { BodyMeasurement, WorkoutLog, PersonalRecord } from '@/types/fitness';
import type { MealEntry } from '@/types/nutrition';
import { FAKE_USER, FakeServer } from '@/test/sync/fakeServer';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(() => null, { getState: () => ({ user: null }) }),
}));

const DEVICE_KEYS = [
  'fitwizard-plans',
  'fitwizard-nutrition-storage',
  'fitwizard-measurements',
  'readiness-storage',
  'fitwizard-achievements',
  'fitwizard-custom-exercises',
  'fitwizard-sync-outbox',
  'fitwizard-sync-cursor',
];

/** Fresh module copies, as if the app had just started on this device. */
async function startApp() {
  vi.resetModules();
  const [collections, outbox, engine, plan, nutrition, measurements, readiness, achievements, custom] = await Promise.all([
    import('@/lib/sync/collections'),
    import('@/lib/sync/outbox'),
    import('@/lib/sync/engine'),
    import('@/stores/planStore'),
    import('@/stores/nutritionStore'),
    import('@/stores/measurementsStore'),
    import('@/stores/readinessStore'),
    import('@/stores/achievementStore'),
    import('@/stores/customExerciseStore'),
  ]);
  await collections.startSyncCollections();
  return {
    ...collections,
    ...outbox,
    ...engine,
    plan: plan.usePlanStore,
    nutrition: nutrition.useNutritionStore,
    measurements: measurements.useMeasurementsStore,
    readiness: readiness.useReadinessStore,
    achievements: achievements.useAchievementStore,
    custom: custom.useCustomExerciseStore,
  };
}

async function eraseDevice() {
  const { appStorage } = await import('@/lib/storage/appStorage');
  for (const key of DEVICE_KEYS) await appStorage.removeItem(key);
  window.localStorage.clear();
}

/** What the server would send back: JSON columns serialised, plus its own updated_at. */
function asServerRow(row: Omit<SyncRow, 'updated_at'>): SyncRow {
  return { ...(JSON.parse(JSON.stringify(row)) as SyncRow), updated_at: '2026-11-18T10:00:00.000Z' };
}

const measurement: BodyMeasurement = { id: 'm-1', date: '2026-11-17T07:30:00.000Z', weight: 82.5, waist: 84, unit: 'metric' };

const meal: MealEntry = {
  id: 'meal-1',
  name: 'Oatmeal',
  calories: 400,
  protein: 30,
  carbs: 45,
  fats: 12,
  mealType: 'breakfast',
  timestamp: new Date('2026-11-17T08:00:00.000Z'),
};

const workoutLog = {
  id: 'log-1',
  planId: 'plan_abc',
  dayIndex: 0,
  dayName: 'Push',
  startedAt: new Date('2026-11-17T17:00:00.000Z'),
  completedAt: new Date('2026-11-17T18:00:00.000Z'),
  duration: 60,
  exercises: [],
  perceivedDifficulty: 'moderate',
  totalVolume: 5400,
} as unknown as WorkoutLog;

const personalRecord: PersonalRecord = {
  id: 'pr-1',
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  type: 'weight',
  previousValue: 80,
  newValue: 85,
  achievedAt: new Date('2026-11-17T18:00:00.000Z'),
  workoutLogId: 'log-1',
};

const readinessMetrics = { sleepQuality: 4, muscleSoreness: 2, energyLevel: 4, stressLevel: 2 } as const;

describe('sync collections', () => {
  beforeEach(async () => {
    await eraseDevice();
  });

  it('round-trips every collection through its cloud row', async () => {
    const app = await startApp();
    app.plan.setState({ workoutLogs: [workoutLog], personalRecords: [personalRecord] });
    app.nutrition.getState().logMeal(meal);
    app.nutrition.getState().setProfile(
      { age: 30, gender: 'male', height: 180, weight: 82, activityLevel: 'moderate', goal: 'maintain' } as never,
      { calories: 2500, protein: 180, carbs: 250, fats: 80 },
    );
    app.measurements.getState().addMeasurement(measurement);
    app.readiness.getState().logReadiness(readinessMetrics);
    app.custom.getState().addCustomExercise({ name: 'Cable fly', primaryMuscles: ['chest'], equipment: ['cable'] } as never);
    app.achievements.setState({ currentStreak: 3, longestStreak: 5 });

    for (const collection of app.SYNC_COLLECTIONS) {
      const items = collection.readLocal() as unknown[];
      expect(items.length, collection.table).toBeGreaterThan(0);
      for (const item of items) {
        const row = (collection.toRow as (item: unknown, userId: string) => Omit<SyncRow, 'updated_at'>)(item, FAKE_USER);
        expect(row.user_id).toBe(FAKE_USER);
        const back = (collection.fromRow as (row: SyncRow) => unknown)(asServerRow(row));
        expect(JSON.stringify(back), collection.table).toBe(JSON.stringify(item));
        expect((collection.key as (item: unknown) => string)(back)).toBe((collection.key as (item: unknown) => string)(item));
      }
    }
  });

  it('marks every kind of local change dirty, and deletions as deletions', async () => {
    const app = await startApp();
    expect(app.countPendingChanges()).toBe(0);

    app.measurements.getState().addMeasurement(measurement);
    expect(app.getOutboxEntries('body_measurements')['m-1']).toMatchObject({ deleted: false });
    app.measurements.getState().deleteMeasurement('m-1');
    expect(app.getOutboxEntries('body_measurements')['m-1']).toMatchObject({ deleted: true });

    app.nutrition.getState().logMeal(meal);
    const day = app.nutrition.getState().selectedDate;
    expect(app.getOutboxEntries('nutrition_days')[day]).toMatchObject({ deleted: false });

    app.nutrition.getState().setProfile(
      { age: 30, gender: 'male', height: 180, weight: 82, activityLevel: 'moderate', goal: 'maintain' } as never,
      { calories: 2500, protein: 180, carbs: 250, fats: 80 },
    );
    expect(app.getOutboxEntries('nutrition_settings').settings).toBeDefined();

    app.readiness.getState().logReadiness(readinessMetrics);
    expect(Object.keys(app.getOutboxEntries('readiness_entries'))).toHaveLength(1);

    app.achievements.getState().unlockBadge('first_workout');
    expect(app.getOutboxEntries('user_state').state).toBeDefined();

    app.plan.setState({ workoutLogs: [workoutLog], personalRecords: [personalRecord] });
    expect(app.getOutboxEntries('workout_logs')['log-1']).toBeDefined();
    expect(app.getOutboxEntries('personal_records')['pr-1']).toBeDefined();
  });

  it("doesn't mark anything when an unrelated part of the store changes", async () => {
    const app = await startApp();
    app.plan.getState().setCurrentWeek(2);
    app.nutrition.getState().changeDate('2026-01-01');
    expect(app.countPendingChanges()).toBe(0);
  });

  it("doesn't count loading the saved copy at startup as an edit", async () => {
    let app = await startApp();
    app.measurements.getState().addMeasurement(measurement);
    await vi.waitFor(async () => {
      const { appStorage } = await import('@/lib/storage/appStorage');
      expect(await appStorage.getItem('fitwizard-measurements')).toContain('m-1');
    });
    await app.clearOutbox();

    app = await startApp();
    expect(app.measurements.getState().measurements.map((m) => m.id)).toEqual(['m-1']);
    expect(app.countPendingChanges()).toBe(0);
  });

  it("doesn't let a fresh second device overwrite the account on its first upload", async () => {
    const server = new FakeServer();

    // Phone A has real history in the cloud.
    let app = await startApp();
    app.achievements.setState({ currentStreak: 7, longestStreak: 9, totalPlansGenerated: 4 });
    app.measurements.getState().addMeasurement(measurement);
    await app.syncAll(FAKE_USER, { client: server.client() });
    expect(server.rows('user_state')).toHaveLength(1);

    // Phone B: fresh, used as a guest for a moment (a pending edit on the
    // one-row user_state, plus a measurement only this phone has).
    await eraseDevice();
    app = await startApp();
    // m-2 was saved before sync existed on this phone: nothing is queued for it.
    app.measurements.getState().addMeasurement({ ...measurement, id: 'm-2', date: '2026-11-18T07:30:00.000Z' });
    await vi.waitFor(async () => {
      const { appStorage } = await import('@/lib/storage/appStorage');
      expect(await appStorage.getItem('fitwizard-measurements')).toContain('m-2');
    });
    await app.clearOutbox();
    app = await startApp();
    expect(app.countPendingChanges()).toBe(0);
    app.achievements.setState({ totalPlansGenerated: 1 });
    expect(app.getOutboxEntries('user_state').state).toBeDefined();

    const result = await app.syncAll(FAKE_USER, { client: server.client(), uploadLocalOnly: true });
    expect(result.failed).toBe(0);

    // The account's achievements win, on the phone and in the cloud.
    expect(app.achievements.getState().currentStreak).toBe(7);
    expect(app.achievements.getState().totalPlansGenerated).toBe(4);
    expect((server.rows('user_state')[0].achievements as { currentStreak: number }).currentStreak).toBe(7);
    // The phone-only measurement is uploaded, and both phones' measurements are here.
    expect(server.rows('body_measurements').map((row) => row.id).sort()).toEqual(['m-1', 'm-2']);
    expect(app.measurements.getState().measurements.map((m) => m.id).sort()).toEqual(['m-1', 'm-2']);
    expect(app.countPendingChanges()).toBe(0);
  });

  it('sends edits made while signed out on the next sync', async () => {
    const server = new FakeServer();
    let app = await startApp();
    app.measurements.getState().addMeasurement(measurement);
    await app.syncAll(FAKE_USER, { client: server.client() });

    // Restart signed out (tracking runs anyway), edit, then sign back in.
    app = await startApp();
    app.measurements.getState().updateMeasurement('m-1', { weight: 80 });
    expect(app.getOutboxEntries('body_measurements')['m-1']).toBeDefined();
    await app.syncAll(FAKE_USER, { client: server.client() });

    expect((server.rows('body_measurements')[0].data as BodyMeasurement).weight).toBe(80);
    expect(app.measurements.getState().measurements[0].weight).toBe(80);
  });

  it('keeps workouts, records and measurements newest first after a pull', async () => {
    const server = new FakeServer();
    const olderLog = { ...workoutLog, id: 'log-0', completedAt: new Date('2026-11-10T18:00:00.000Z') } as WorkoutLog;
    const olderRecord = { ...personalRecord, id: 'pr-0', achievedAt: new Date('2026-11-10T18:00:00.000Z') };
    const olderMeasurement = { ...measurement, id: 'm-0', date: '2026-11-10T07:30:00.000Z' };

    // The newest items reach the cloud first, so a fresh device pulls them first.
    let app = await startApp();
    app.plan.setState({ workoutLogs: [workoutLog], personalRecords: [personalRecord] });
    app.measurements.getState().addMeasurement(measurement);
    await app.syncAll(FAKE_USER, { client: server.client() });
    app.plan.setState({ workoutLogs: [workoutLog, olderLog], personalRecords: [personalRecord, olderRecord] });
    app.measurements.getState().addMeasurement(olderMeasurement);
    await app.syncAll(FAKE_USER, { client: server.client() });

    await eraseDevice();
    app = await startApp();
    await app.syncAll(FAKE_USER, { client: server.client() });

    expect(app.plan.getState().workoutLogs.map((log) => log.id)).toEqual(['log-1', 'log-0']);
    expect(app.plan.getState().personalRecords.map((record) => record.id)).toEqual(['pr-1', 'pr-0']);
    expect(app.measurements.getState().measurements.map((m) => m.id)).toEqual(['m-1', 'm-0']);
    expect(app.measurements.getState().getLatestMeasurement()?.id).toBe('m-1');
  });

  it("doesn't push back records it has just pulled", async () => {
    const app = await startApp();
    const collection = app.SYNC_COLLECTIONS.find((c) => c.table === 'body_measurements');
    (collection?.writeLocal as (items: BodyMeasurement[]) => void)([measurement]);
    expect(app.measurements.getState().measurements).toHaveLength(1);
    expect(app.countPendingChanges()).toBe(0);
  });

  it('moves data from one device to another through the cloud', async () => {
    const server = new FakeServer();

    // Phone A: log things offline, then sync.
    let app = await startApp();
    app.measurements.getState().addMeasurement(measurement);
    app.nutrition.getState().logMeal(meal);
    app.readiness.getState().logReadiness(readinessMetrics);
    app.plan.setState({ workoutLogs: [workoutLog] });
    app.achievements.setState({ currentStreak: 4 });
    const first = await app.syncAll(FAKE_USER, { client: server.client() });
    expect(first.failed).toBe(0);
    expect(app.countPendingChanges()).toBe(0);
    expect(server.rows('body_measurements')).toHaveLength(1);
    expect(server.rows('nutrition_days')).toHaveLength(1);
    expect(server.rows('user_state')).toHaveLength(1);

    // Phone B: empty, same account.
    await eraseDevice();
    app = await startApp();
    const second = await app.syncAll(FAKE_USER, { client: server.client() });
    expect(second.failed).toBe(0);
    expect(app.measurements.getState().measurements.map((m) => m.id)).toEqual(['m-1']);
    expect(app.plan.getState().workoutLogs.map((log) => log.id)).toEqual(['log-1']);
    expect(app.plan.getState().workoutLogs[0].completedAt).toBeInstanceOf(Date);
    expect(Object.values(app.nutrition.getState().history)[0].meals.map((m) => m.id)).toEqual(['meal-1']);
    expect(app.readiness.getState().logs).toHaveLength(1);
    expect(app.achievements.getState().currentStreak).toBe(4);
    // Pulled data isn't queued to be sent back.
    expect(app.countPendingChanges()).toBe(0);

    // Phone B deletes the measurement; the cloud gets a tombstone.
    app.measurements.getState().deleteMeasurement('m-1');
    await app.syncAll(FAKE_USER, { client: server.client() });
    expect(server.rows('body_measurements')[0].deleted_at).not.toBeNull();
  });
});
