import { usePlanStore } from '@/stores/planStore';
import {
  MAX_PERSONAL_RECORDS,
  MAX_WORKOUT_LOGS,
  PLAN_STORE_NAME,
  sanitizePersonalRecord,
  sanitizePlan,
  sanitizeWorkoutLog,
} from '@/stores/planStore.persistence';
import { MAX_PLAN_HISTORY } from '@/lib/plans/planSyncService';
import { planToRow, rowToPlan } from '@/lib/plans/supabasePlansRepo';
import type { Database } from '@/types/supabase';
import { createStoreCollection, required } from '@/lib/sync/storeCollection';
import type { PersonalRecord, Plan, WorkoutLog } from '@/types/fitness';

const planStores = [{ store: usePlanStore, persistName: PLAN_STORE_NAME }];

function toIso(value: Date | string): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

/** Newest first, as completeWorkout() keeps them (getLastPerformance() reads the first match). */
function newestFirst<T>(items: T[], time: (item: T) => Date | string, max: number): T[] {
  return [...items].sort((a, b) => new Date(time(b)).getTime() - new Date(time(a)).getTime()).slice(0, max);
}

/** `workout_logs` (migration 007): one row per finished workout. */
export const workoutLogsCollection = createStoreCollection<WorkoutLog>({
  table: 'workout_logs',
  keyColumn: 'id',
  onConflict: 'user_id,id',
  stores: planStores,
  readItems: () => usePlanStore.getState().workoutLogs,
  writeItems: (logs) => usePlanStore.setState({ workoutLogs: newestFirst(logs, (log) => log.completedAt, MAX_WORKOUT_LOGS) }),
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
  writeItems: (records) =>
    usePlanStore.setState({ personalRecords: newestFirst(records, (record) => record.achievedAt, MAX_PERSONAL_RECORDS) }),
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

type PlansRow = Database['public']['Tables']['plans']['Row'];

/**
 * `plans` (migration 004, plus `deleted_at` from 007): saved plans, keyed by plan id.
 * Replaces the old plan-only sync (`planSyncService.syncPlanStateWithRemote`).
 *
 * - Deletions are marked by `deletePlanFromHistory()`, not by the tracker: the device
 *   keeps the latest 20 plans, and a plan dropping off that list is not a delete.
 * - After a pull, the current plan follows the merged copy. If it was deleted on
 *   another device it is cleared, and a device with no current plan takes the newest.
 */
export const plansCollection = createStoreCollection<Plan>({
  table: 'plans',
  keyColumn: 'id',
  onConflict: 'user_id,id',
  stores: planStores,
  trackDeletions: false,
  readItems: () => usePlanStore.getState().planHistory,
  writeItems: (plans) => {
    const { currentPlan, planHistory } = usePlanStore.getState();
    const history = newestFirst(plans, (plan) => plan.createdAt, MAX_PLAN_HISTORY);
    let nextCurrent: Plan | null = currentPlan;
    if (currentPlan) {
      const merged = plans.find((plan) => plan.id === currentPlan.id);
      if (merged) nextCurrent = merged;
      else if (planHistory.some((plan) => plan.id === currentPlan.id)) nextCurrent = null; // deleted elsewhere
    } else {
      nextCurrent = history[0] ?? null;
    }
    usePlanStore.setState({ planHistory: history, currentPlan: nextCurrent });
  },
  key: (plan) => plan.id,
  toRow: (plan, userId) => ({ ...planToRow(plan, userId), deleted_at: null }),
  // rowToPlan reads only the plans columns; sanitizePlan checks the result like a device load.
  fromRow: (row) => required(sanitizePlan(rowToPlan(row as unknown as PlansRow)), 'plans row'),
});
