import {
  analyzePerformance,
  calculateTotalVolume,
  detectPersonalRecords,
  generateWeeklySummary,
} from '@/lib/progressionEngine';
import type {
  PersonalRecord,
  Plan,
  ProgressionRecommendation,
  WeeklySummary,
  WorkoutLog,
  ExerciseLog,
  PerceivedDifficulty,
  WeightUnit,
} from '@/types/fitness';
import type { ActiveWorkout } from '@/stores/planStore.types';

function createWorkoutLogId() {
  return `log_${crypto.randomUUID()}`;
}

export function buildWorkoutLog(
  activeWorkout: ActiveWorkout,
  perceivedDifficulty: PerceivedDifficulty,
  notes?: string,
) {
  const completedAt = new Date();
  const duration = Math.round(
    (completedAt.getTime() - new Date(activeWorkout.startedAt).getTime()) / 60000,
  );

  let totalVolume = 0;
  for (const exercise of activeWorkout.exercises) {
    totalVolume += calculateTotalVolume(exercise.sets);
  }

  const workoutLog: WorkoutLog = {
    id: createWorkoutLogId(),
    planId: activeWorkout.planId,
    dayIndex: activeWorkout.dayIndex,
    dayName: activeWorkout.dayName,
    startedAt: activeWorkout.startedAt,
    completedAt,
    duration,
    exercises: activeWorkout.exercises,
    perceivedDifficulty,
    notes,
    totalVolume,
  };

  return workoutLog;
}

export function detectNewPersonalRecords(workoutLog: WorkoutLog, workoutLogs: WorkoutLog[]) {
  return detectPersonalRecords(workoutLog, workoutLogs);
}

export function buildWeeklyPlanSummary(
  planId: string,
  weekNumber: number,
  workoutLogs: WorkoutLog[],
  personalRecords: PersonalRecord[],
  plan: Plan | null,
): WeeklySummary | null {
  if (!plan) {
    return null;
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (weekNumber - 1) * 7 - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weekLogs = workoutLogs.filter((log) => {
    const logDate = new Date(log.completedAt);
    return log.planId === planId && logDate >= weekStart && logDate < weekEnd;
  });

  const weekPRs = personalRecords.filter((record) => {
    const recordDate = new Date(record.achievedAt);
    return recordDate >= weekStart && recordDate < weekEnd;
  });

  return generateWeeklySummary(weekLogs, plan, weekNumber, weekStart, weekPRs);
}

export function buildProgressionRecommendations(currentPlan: Plan | null, workoutLogs: WorkoutLog[]) {
  if (!currentPlan) {
    return [];
  }

  const planLogs = workoutLogs.filter((log) => log.planId === currentPlan.id);
  return analyzePerformance(planLogs, currentPlan);
}

export function applyRecommendationsToPlan(
  currentPlan: Plan,
  recommendations: ProgressionRecommendation[],
  preferredWeightUnit: WeightUnit,
) {
  return {
    ...currentPlan,
    workoutDays: currentPlan.workoutDays.map((day) => ({
      ...day,
      exercises: day.exercises.map((prescription) => {
        const recommendation = recommendations.find(
          (item) => item.exerciseId === prescription.exercise.id && item.action === 'increase',
        );

        if (!recommendation) {
          return prescription;
        }

        return {
          ...prescription,
          notes: `Target: ${recommendation.recommendedLoad} ${preferredWeightUnit} (+${recommendation.changePercentage.toFixed(1)}%)`,
        };
      }),
    })),
  };
}

export function findLastExercisePerformance(workoutLogs: WorkoutLog[], exerciseId: string): ExerciseLog | null {
  for (const workoutLog of workoutLogs) {
    const exerciseLog = workoutLog.exercises.find((exercise) => exercise.exerciseId === exerciseId);
    if (exerciseLog) {
      return exerciseLog;
    }
  }

  return null;
}
