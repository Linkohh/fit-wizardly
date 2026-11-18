import { usePlanStore } from '@/stores/planStore';
import { PLAN_STORE_NAME, sanitizePersonalRecord, sanitizeWorkoutLog } from '@/stores/planStore.persistence';
import { createStoreCollection, required } from '@/lib/sync/storeCollection';
import type { PersonalRecord, WorkoutLog } from '@/types/fitness';

const planStores = [{ store: usePlanStore, persistName: PLAN_STORE_NAME }];

function toIso(value: Date | string): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

/** `workout_logs` (migration 007): one row per finished workout. */
export const workoutLogsCollection = createStoreCollection<WorkoutLog>({
  table: 'workout_logs',
  keyColumn: 'id',
  onConflict: 'user_id,id',
  stores: planStores,
  readItems: () => usePlanStore.getState().workoutLogs,
  writeItems: (workoutLogs) => usePlanStore.setState({ workoutLogs }),
  key: (log) => log.id,
  toRow: (log, userId) => ({
    user_id: userId,
    id: log.id,
    plan_id: log.planId,
    completed_at: toIso(log.completedAt),
    total_volume: log.totalVolume,
    log,
    schema_version: 1,
    deleted_at: null,
  }),
  fromRow: (row) => required(sanitizeWorkoutLog(row.log), 'workout_logs row'),
});

/** `personal_records` (migration 007). */
export const personalRecordsCollection = createStoreCollection<PersonalRecord>({
  table: 'personal_records',
  keyColumn: 'id',
  onConflict: 'user_id,id',
  stores: planStores,
  readItems: () => usePlanStore.getState().personalRecords,
  writeItems: (personalRecords) => usePlanStore.setState({ personalRecords }),
  key: (record) => record.id,
  toRow: (record, userId) => ({
    user_id: userId,
    id: record.id,
    exercise_id: record.exerciseId,
    type: record.type,
    value: record.newValue,
    achieved_at: toIso(record.achievedAt),
    record,
    deleted_at: null,
  }),
  fromRow: (row) => required(sanitizePersonalRecord(row.record), 'personal_records row'),
});
