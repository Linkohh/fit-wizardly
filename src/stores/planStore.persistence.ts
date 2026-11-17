import type { PersonalRecord, Plan, WeightUnit, WorkoutLog } from '@/types/fitness';
import type { ActiveWorkout } from '@/stores/planStore.types';
import { isFiniteNumber, isRecord, sanitizeList, toValidDate } from '@/lib/storage/sanitize';

/**
 * What the plan store saves on the device, and how saved data is checked
 * when it is read back. See ADR 11 (local-first user data).
 *
 * Reading is defensive: a malformed entry is dropped, never thrown, so one
 * corrupt workout can't stop the app from opening.
 */

export const PLAN_STORE_NAME = 'fitwizard-plans';
/** v1 (April 2026) saved only currentWeek and preferredWeightUnit. */
export const PLAN_STORE_VERSION = 2;
export const MAX_WORKOUT_LOGS = 1000;
export const MAX_PERSONAL_RECORDS = 500;

export interface PersistedPlanState {
  currentPlan: Plan | null;
  planHistory: Plan[];
  workoutLogs: WorkoutLog[];
  personalRecords: PersonalRecord[];
  activeWorkout: ActiveWorkout | null;
  currentWeek: number;
  preferredWeightUnit: WeightUnit;
}

export function sanitizePlan(value: unknown): Plan | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.workoutDays)) {
    return null;
  }
  const createdAt = toValidDate(value.createdAt) ?? new Date(0);
  // Shape checked above for the fields the app depends on.
  return { ...value, createdAt } as unknown as Plan;
}

export function sanitizeWorkoutLog(value: unknown): WorkoutLog | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.planId !== 'string' ||
    !isFiniteNumber(value.dayIndex) ||
    typeof value.dayName !== 'string' ||
    !Array.isArray(value.exercises)
  ) {
    return null;
  }

  const startedAt = toValidDate(value.startedAt);
  const completedAt = toValidDate(value.completedAt);
  if (!startedAt || !completedAt) {
    return null;
  }

  return {
    ...value,
    startedAt,
    completedAt,
    duration: isFiniteNumber(value.duration) ? value.duration : 0,
    totalVolume: isFiniteNumber(value.totalVolume) ? value.totalVolume : 0,
  } as unknown as WorkoutLog;
}

const PR_TYPES = new Set(['weight', 'reps', 'volume']);

export function sanitizePersonalRecord(value: unknown): PersonalRecord | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.exerciseId !== 'string' ||
    typeof value.exerciseName !== 'string' ||
    typeof value.type !== 'string' ||
    !PR_TYPES.has(value.type) ||
    !isFiniteNumber(value.newValue)
  ) {
    return null;
  }

  const achievedAt = toValidDate(value.achievedAt);
  if (!achievedAt) {
    return null;
  }

  return {
    ...value,
    previousValue: isFiniteNumber(value.previousValue) ? value.previousValue : 0,
    achievedAt,
    workoutLogId: typeof value.workoutLogId === 'string' ? value.workoutLogId : '',
  } as unknown as PersonalRecord;
}

export function sanitizeActiveWorkout(value: unknown): ActiveWorkout | null {
  if (
    !isRecord(value) ||
    typeof value.planId !== 'string' ||
    !isFiniteNumber(value.dayIndex) ||
    typeof value.dayName !== 'string' ||
    !Array.isArray(value.exercises)
  ) {
    return null;
  }

  const startedAt = toValidDate(value.startedAt);
  if (!startedAt) {
    return null;
  }

  return {
    planId: value.planId,
    dayIndex: value.dayIndex,
    dayName: value.dayName,
    startedAt,
    exercises: value.exercises as ActiveWorkout['exercises'],
    currentExerciseIndex: isFiniteNumber(value.currentExerciseIndex) ? value.currentExerciseIndex : 0,
    currentSetIndex: isFiniteNumber(value.currentSetIndex) ? value.currentSetIndex : 0,
    restTimerEndTime: isFiniteNumber(value.restTimerEndTime) ? value.restTimerEndTime : null,
  };
}

/** Checks saved data read back from storage. Anything malformed is dropped. */
export function sanitizePlanPersistedState(state: unknown): PersistedPlanState {
  const source = isRecord(state) ? state : {};
  const currentWeek = isFiniteNumber(source.currentWeek) ? Math.max(1, Math.min(4, source.currentWeek)) : 1;

  return {
    currentPlan: source.currentPlan == null ? null : sanitizePlan(source.currentPlan),
    planHistory: sanitizeList(source.planHistory, sanitizePlan, Number.POSITIVE_INFINITY),
    workoutLogs: sanitizeList(source.workoutLogs, sanitizeWorkoutLog, MAX_WORKOUT_LOGS),
    personalRecords: sanitizeList(source.personalRecords, sanitizePersonalRecord, MAX_PERSONAL_RECORDS),
    activeWorkout: source.activeWorkout == null ? null : sanitizeActiveWorkout(source.activeWorkout),
    currentWeek,
    preferredWeightUnit: source.preferredWeightUnit === 'kg' ? 'kg' : 'lbs',
  };
}

/** Picks what to save. Cheap (no validation), because it runs on every change. */
export function pickPersistedPlanState(state: PersistedPlanState): PersistedPlanState {
  return {
    currentPlan: state.currentPlan,
    planHistory: state.planHistory,
    workoutLogs: state.workoutLogs.slice(0, MAX_WORKOUT_LOGS),
    personalRecords: state.personalRecords.slice(0, MAX_PERSONAL_RECORDS),
    activeWorkout: state.activeWorkout,
    currentWeek: state.currentWeek,
    preferredWeightUnit: state.preferredWeightUnit,
  };
}
