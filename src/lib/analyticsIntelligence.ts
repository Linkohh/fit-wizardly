import { calculateOneRepMax, convertWeight } from '@/lib/progressionEngine';
import type { ReadinessEntry } from '@/types/readiness';
import type { ExercisePrescription, PerceivedDifficulty, Plan, SetLog, WeightUnit, WorkoutLog } from '@/types/fitness';

export type AnalyticsConfidence = 'high' | 'medium' | 'low';
export type TrainingCompassStatus = 'push' | 'hold' | 'dial_back' | 'needs_data';
export type PlanFitStatus = 'fits_well' | 'too_dense' | 'recovery_mismatch' | 'under_dosed' | 'needs_data';
export type LiftTruthStatus = 'clean_progress' | 'grind_debt' | 'quiet_progress' | 'technique_check' | 'needs_data';
export type SessionRescueStatus = 'full_session_ok' | 'rescue_35' | 'rescue_25' | 'rescue_15' | 'needs_plan';
export type WeeklyChangeStatus = 'steady' | 'watch_recovery' | 'rebuild_rhythm' | 'build_momentum' | 'needs_data';

export interface TrainingCompassInsight {
  status: TrainingCompassStatus;
  score: number;
  confidence: AnalyticsConfidence;
  reasons: string[];
  stressSignals: string[];
  nextAction: string;
  metrics: {
    recentWorkouts: number;
    recentVolume: number;
    previousVolume: number;
    volumeChangePercent: number | null;
    readinessScore: number | null;
  };
}

export interface WeeklyCoachSummary {
  title: string;
  summary: string;
  highlights: string[];
  nextWeekFocus: string;
  confidence: AnalyticsConfidence;
  stats: {
    sessionsThisWeek: number;
    previousWeekSessions: number;
    volumeThisWeek: number;
    previousWeekVolume: number;
    volumeChangePercent: number | null;
    avgReadiness: number | null;
  };
}

export interface WeeklyChangeBrief {
  status: WeeklyChangeStatus;
  title: string;
  confidence: AnalyticsConfidence;
  summary: string;
  keySignals: string[];
  nextAction: string;
  metrics: {
    sessionsThisWeek: number;
    previousWeekSessions: number;
    volumeThisWeek: number;
    previousWeekVolume: number;
    volumeChangePercent: number | null;
    readinessAverage: number | null;
    readinessTrend: number | null;
  };
}

export interface PlanFitReviewInsight {
  status: PlanFitStatus;
  confidence: AnalyticsConfidence;
  fitScore: number;
  diagnosis: string;
  reasons: string[];
  frictionSignals: string[];
  suggestedAdjustment: string;
  metrics: {
    currentPlanLogs: number;
    expectedSessions: number;
    completionRatio: number;
    skippedExerciseRate: number;
    avgDuration: number | null;
    hardSessionRate: number;
    readinessAverage: number | null;
    readinessTrend: number | null;
    volumeChangePercent: number | null;
    dayIndexImbalance: number;
    leastLoggedDayIndex: number | null;
  };
}

export interface LiftTruthMeterInsight {
  exerciseId: string;
  exerciseName: string;
  status: LiftTruthStatus;
  confidence: AnalyticsConfidence;
  currentEstimate: number | null;
  changePercent: number;
  bestSetLabel: string;
  effortShift: number;
  sessionsAnalyzed: number;
  interpretation: string;
  nextCue: string;
  sparkline: Array<{ date: string; value: number }>;
}

export interface SessionRescueRecommendation {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  rir: number;
  restSeconds: number;
  note: string;
}

export interface SessionRescueInsight {
  status: SessionRescueStatus;
  confidence: AnalyticsConfidence;
  recommendedDuration: number;
  targetDayName: string | null;
  recommendations: SessionRescueRecommendation[];
  skipList: string[];
  reason: string;
  nextAction: string;
}

interface AnalyticsInput {
  workoutLogs: WorkoutLog[];
  readinessLogs: ReadinessEntry[];
  now?: Date;
}

interface LiftTruthMeterInput {
  workoutLogs: WorkoutLog[];
  preferredWeightUnit: WeightUnit;
  now?: Date;
  limit?: number;
}

interface WeeklyCoachSummaryInput extends AnalyticsInput {
  preferredWeightUnit: WeightUnit;
}

interface PlanFitReviewInput extends AnalyticsInput {
  currentPlan: Plan | null;
}

interface SessionRescueInput extends AnalyticsInput {
  currentPlan: Plan | null;
  targetDayIndex: number | null;
}

interface LiftExposure {
  exerciseId: string;
  exerciseName: string;
  date: Date;
  estimate: number;
  weight: number;
  reps: number;
  rir: number;
  difficulty: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 7;
const PREVIOUS_WINDOW_DAYS = 14;
const MIN_LIFT_EXPOSURES = 3;
const PLAN_REVIEW_WINDOW_DAYS = 14;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function readinessDate(entry: ReadinessEntry) {
  return new Date(`${entry.date}T00:00:00`);
}

function getDaysOld(date: Date, now: Date) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / DAY_MS);
}

function cutoffDate(now: Date, days: number) {
  return new Date(now.getTime() - days * DAY_MS);
}

function getRecentLogs(workoutLogs: WorkoutLog[], now: Date, days = RECENT_WINDOW_DAYS) {
  const cutoff = cutoffDate(now, days);
  return workoutLogs.filter((log) => {
    const completedAt = toDate(log.completedAt);
    return completedAt >= cutoff && completedAt <= now;
  });
}

function getPreviousLogs(workoutLogs: WorkoutLog[], now: Date) {
  const recentCutoff = cutoffDate(now, RECENT_WINDOW_DAYS);
  const previousCutoff = cutoffDate(now, PREVIOUS_WINDOW_DAYS);
  return workoutLogs.filter((log) => {
    const completedAt = toDate(log.completedAt);
    return completedAt >= previousCutoff && completedAt < recentCutoff;
  });
}

function sumVolume(logs: WorkoutLog[]) {
  return logs.reduce((sum, log) => sum + Math.max(0, log.totalVolume || 0), 0);
}

function getLatestReadiness(readinessLogs: ReadinessEntry[]) {
  return [...readinessLogs].sort(
    (a, b) => readinessDate(b).getTime() - readinessDate(a).getTime(),
  )[0];
}

function getDifficultyScore(difficulty: PerceivedDifficulty) {
  switch (difficulty) {
    case 'too_easy':
      return 0;
    case 'just_right':
      return 1;
    case 'challenging':
      return 2;
    case 'too_hard':
      return 3;
    default:
      return 1;
  }
}

function getAverage(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getVolumeChangePercent(recentVolume: number, previousVolume: number) {
  if (previousVolume <= 0) return null;
  return ((recentVolume - previousVolume) / previousVolume) * 100;
}

function getCompassConfidence(
  latestReadiness: ReadinessEntry | undefined,
  recentWorkoutCount: number,
  now: Date,
): AnalyticsConfidence {
  if (!latestReadiness || recentWorkoutCount === 0) return 'low';

  const readinessAge = getDaysOld(readinessDate(latestReadiness), now);
  if (readinessAge <= 1 && recentWorkoutCount >= 2) return 'high';
  if (readinessAge <= 3 && recentWorkoutCount >= 1) return 'medium';
  return 'low';
}

function pluralizeSession(count: number) {
  return count === 1 ? 'session' : 'sessions';
}

function formatPercent(value: number) {
  return `${Math.abs(Math.round(value))}%`;
}

function formatLoad(value: number) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return `${Math.round(value)}`;
}

function getReadinessAverage(readinessLogs: ReadinessEntry[], now: Date) {
  const cutoff = cutoffDate(now, RECENT_WINDOW_DAYS);
  const recent = readinessLogs.filter((entry) => readinessDate(entry) >= cutoff);
  return getAverage(recent.map((entry) => entry.overallScore));
}

function getReadinessTrend(readinessLogs: ReadinessEntry[], now: Date) {
  const recentCutoff = cutoffDate(now, RECENT_WINDOW_DAYS);
  const planCutoff = cutoffDate(now, PLAN_REVIEW_WINDOW_DAYS);
  const recent = readinessLogs.filter((entry) => readinessDate(entry) >= recentCutoff);
  const earlier = readinessLogs.filter((entry) => {
    const date = readinessDate(entry);
    return date >= planCutoff && date < recentCutoff;
  });
  const recentAverage = getAverage(recent.map((entry) => entry.overallScore));
  const earlierAverage = getAverage(earlier.map((entry) => entry.overallScore));
  if (recentAverage === null || earlierAverage === null) return null;
  return recentAverage - earlierAverage;
}

function getBestSetEstimate(
  sets: SetLog[],
  preferredWeightUnit: WeightUnit,
): { estimate: number; set: SetLog; weight: number } | null {
  let best: { estimate: number; set: SetLog; weight: number } | null = null;

  for (const set of sets) {
    if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;

    const normalizedWeight = convertWeight(set.weight, set.weightUnit, preferredWeightUnit);
    const estimate = calculateOneRepMax(normalizedWeight, set.reps);
    if (!best || estimate > best.estimate) {
      best = { estimate, set, weight: normalizedWeight };
    }
  }

  return best;
}

function buildLiftExposures(workoutLogs: WorkoutLog[], preferredWeightUnit: WeightUnit) {
  const exposures = new Map<string, LiftExposure[]>();
  const sortedLogs = [...workoutLogs].sort(
    (a, b) => toDate(a.completedAt).getTime() - toDate(b.completedAt).getTime(),
  );

  for (const log of sortedLogs) {
    for (const exercise of log.exercises) {
      if (exercise.skipped) continue;

      const best = getBestSetEstimate(exercise.sets, preferredWeightUnit);
      if (!best) continue;

      const completedSets = exercise.sets.filter((set) => set.completed);
      const avgRir = getAverage(completedSets.map((set) => set.rir)) ?? 2;
      const exposure: LiftExposure = {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        date: toDate(log.completedAt),
        estimate: best.estimate,
        weight: best.weight,
        reps: best.set.reps,
        rir: avgRir,
        difficulty: getDifficultyScore(log.perceivedDifficulty),
      };

      const current = exposures.get(exercise.exerciseId) ?? [];
      current.push(exposure);
      exposures.set(exercise.exerciseId, current);
    }
  }

  return exposures;
}

function formatBestSet(exposure: LiftExposure | undefined, unit: WeightUnit) {
  if (!exposure) return 'No loaded sets yet';
  return `${Math.round(exposure.weight)} ${unit} x ${exposure.reps}`;
}

function getLiftConfidence(exposures: LiftExposure[]): AnalyticsConfidence {
  if (exposures.length < MIN_LIFT_EXPOSURES) return 'low';
  if (exposures.length >= 5) return 'high';
  return 'medium';
}

export function buildTrainingCompass({
  workoutLogs,
  readinessLogs,
  now = new Date(),
}: AnalyticsInput): TrainingCompassInsight {
  const recentLogs = getRecentLogs(workoutLogs, now);
  const previousLogs = getPreviousLogs(workoutLogs, now);
  const latestReadiness = getLatestReadiness(readinessLogs);
  const recentVolume = sumVolume(recentLogs);
  const previousVolume = sumVolume(previousLogs);
  const volumeChangePercent = getVolumeChangePercent(recentVolume, previousVolume);
  const confidence = getCompassConfidence(latestReadiness, recentLogs.length, now);

  if (!latestReadiness || recentLogs.length === 0 || confidence === 'low') {
    return {
      status: 'needs_data',
      score: latestReadiness ? Math.round(latestReadiness.overallScore * 20) : 45,
      confidence: 'low',
      reasons: [
        !latestReadiness ? 'Readiness is missing.' : 'Readiness data is stale or incomplete.',
        recentLogs.length === 0 ? 'No recent workout logs are available.' : 'More recent training data will improve this signal.',
      ],
      stressSignals: [],
      nextAction: 'Log one workout and one readiness check-in to unlock today\'s training compass.',
      metrics: {
        recentWorkouts: recentLogs.length,
        recentVolume,
        previousVolume,
        volumeChangePercent,
        readinessScore: latestReadiness?.overallScore ?? null,
      },
    };
  }

  const stressSignals: string[] = [];
  if (latestReadiness.overallScore < 2.7) stressSignals.push('Readiness score is low today.');
  if (latestReadiness.sleepQuality <= 2) stressSignals.push('Sleep quality is dragging recovery down.');
  if (latestReadiness.muscleSoreness >= 4) stressSignals.push('Muscle soreness is elevated.');
  if (latestReadiness.energyLevel <= 2) stressSignals.push('Energy is low.');
  if (latestReadiness.stressLevel >= 4) stressSignals.push('Stress is running high.');
  if (volumeChangePercent !== null && volumeChangePercent >= 25 && recentLogs.length >= 2) {
    stressSignals.push('Recent workload jumped quickly.');
  }

  const avgDuration = getAverage(recentLogs.map((log) => log.duration)) ?? 0;
  if (avgDuration >= 80) stressSignals.push('Recent sessions have been running long.');

  const hardSessions = recentLogs.filter(
    (log) => log.perceivedDifficulty === 'challenging' || log.perceivedDifficulty === 'too_hard',
  ).length;
  if (hardSessions >= Math.max(1, Math.ceil(recentLogs.length / 2))) {
    stressSignals.push('Recent sessions felt hard.');
  }

  const poorReadiness = latestReadiness.overallScore < 2.7;
  const isDialBack = (poorReadiness && stressSignals.length >= 3) || stressSignals.length >= 4;
  const isPush =
    latestReadiness.overallScore >= 4 &&
    latestReadiness.energyLevel >= 4 &&
    latestReadiness.muscleSoreness <= 2 &&
    latestReadiness.stressLevel <= 2 &&
    stressSignals.length === 0;

  const status: TrainingCompassStatus = isDialBack ? 'dial_back' : isPush ? 'push' : 'hold';
  const scoreAdjustment = status === 'push' ? 6 : status === 'dial_back' ? -18 : -4;
  const score = clamp(Math.round(latestReadiness.overallScore * 20 + scoreAdjustment), 0, 100);

  if (status === 'push') {
    return {
      status,
      score,
      confidence,
      reasons: [
        'Readiness is strong today.',
        'Soreness and stress are low.',
        'Recent workload looks manageable.',
      ],
      stressSignals,
      nextAction: 'Add 1 rep per set or 2.5-5 lb on your main lift if warm-ups feel sharp.',
      metrics: {
        recentWorkouts: recentLogs.length,
        recentVolume,
        previousVolume,
        volumeChangePercent,
        readinessScore: latestReadiness.overallScore,
      },
    };
  }

  if (status === 'dial_back') {
    return {
      status,
      score,
      confidence,
      reasons: stressSignals.slice(0, 3),
      stressSignals,
      nextAction: 'Reduce top-set load 5-10% or cut 1-2 sets, then keep reps crisp.',
      metrics: {
        recentWorkouts: recentLogs.length,
        recentVolume,
        previousVolume,
        volumeChangePercent,
        readinessScore: latestReadiness.overallScore,
      },
    };
  }

  return {
    status,
    score,
    confidence,
    reasons: [
      'Recovery and workload signals are mixed.',
      stressSignals[0] ?? 'Training data is steady enough to keep moving.',
      'A normal session gives you the best read today.',
    ],
    stressSignals,
    nextAction: 'Run the plan as written. Repeat last session loads and aim for cleaner reps.',
    metrics: {
      recentWorkouts: recentLogs.length,
      recentVolume,
      previousVolume,
      volumeChangePercent,
      readinessScore: latestReadiness.overallScore,
    },
  };
}

function buildPlanFitMetrics(workoutLogs: WorkoutLog[], readinessLogs: ReadinessEntry[], currentPlan: Plan | null, now: Date) {
  const workoutDayIndexes = currentPlan?.workoutDays.map((day) => day.dayIndex) ?? [];
  const expectedSessions = workoutDayIndexes.length * 2;
  const currentPlanLogs = currentPlan
    ? getRecentLogs(workoutLogs, now, PLAN_REVIEW_WINDOW_DAYS).filter((log) => log.planId === currentPlan.id)
    : [];
  const previousPlanLogs = currentPlan
    ? workoutLogs.filter((log) => {
        const completedAt = toDate(log.completedAt);
        return log.planId === currentPlan.id && completedAt >= cutoffDate(now, 28) && completedAt < cutoffDate(now, 14);
      })
    : [];
  const exerciseCount = currentPlanLogs.reduce((sum, log) => sum + log.exercises.length, 0);
  const skippedCount = currentPlanLogs.reduce(
    (sum, log) => sum + log.exercises.filter((exercise) => exercise.skipped).length,
    0,
  );
  const dayCounts = new Map(workoutDayIndexes.map((dayIndex) => [dayIndex, 0]));
  currentPlanLogs.forEach((log) => dayCounts.set(log.dayIndex, (dayCounts.get(log.dayIndex) ?? 0) + 1));
  const counts = Array.from(dayCounts.values());
  const minCount = counts.length ? Math.min(...counts) : 0;
  const maxCount = counts.length ? Math.max(...counts) : 0;

  return {
    currentPlanLogs,
    metrics: {
      currentPlanLogs: currentPlanLogs.length,
      expectedSessions,
      completionRatio: expectedSessions > 0 ? clamp(currentPlanLogs.length / expectedSessions, 0, 1) : 0,
      skippedExerciseRate: exerciseCount > 0 ? skippedCount / exerciseCount : 0,
      avgDuration: getAverage(currentPlanLogs.map((log) => log.duration)),
      hardSessionRate:
        currentPlanLogs.length > 0
          ? currentPlanLogs.filter((log) => log.perceivedDifficulty === 'challenging' || log.perceivedDifficulty === 'too_hard').length /
            currentPlanLogs.length
          : 0,
      readinessAverage: getReadinessAverage(readinessLogs, now),
      readinessTrend: getReadinessTrend(readinessLogs, now),
      volumeChangePercent: getVolumeChangePercent(sumVolume(currentPlanLogs), sumVolume(previousPlanLogs)),
      dayIndexImbalance: maxCount - minCount,
      leastLoggedDayIndex:
        workoutDayIndexes.length > 0
          ? [...dayCounts.entries()].sort((a, b) => a[1] - b[1] || a[0] - b[0])[0][0]
          : null,
    },
  };
}

function getPlanFitConfidence(logCount: number, readinessCount: number, status: PlanFitStatus): AnalyticsConfidence {
  if (logCount < 2) return 'low';
  if (status === 'recovery_mismatch') return readinessCount >= 2 ? 'medium' : 'low';
  if (logCount >= 4 && readinessCount >= 2) return 'high';
  return 'medium';
}

export function buildPlanFitReview({
  workoutLogs,
  readinessLogs,
  currentPlan,
  now = new Date(),
}: PlanFitReviewInput): PlanFitReviewInsight {
  const { currentPlanLogs, metrics } = buildPlanFitMetrics(workoutLogs, readinessLogs, currentPlan, now);

  if (!currentPlan || currentPlan.workoutDays.length === 0 || currentPlanLogs.length < 2) {
    return {
      status: 'needs_data',
      confidence: 'low',
      fitScore: 45,
      diagnosis: 'Plan Fit Review needs more current plan signal.',
      reasons: ['Log at least two current plan sessions to compare the pattern.'],
      frictionSignals: [],
      suggestedAdjustment: 'Keep the next session simple and log exercise completion, effort, and readiness.',
      metrics,
    };
  }

  const frictionSignals: string[] = [];
  if ((metrics.avgDuration ?? 0) >= 85) frictionSignals.push('Sessions are running longer than the plan target.');
  if (metrics.skippedExerciseRate >= 0.2) frictionSignals.push('Exercise skips are clustering inside current plan sessions.');
  if (metrics.dayIndexImbalance >= 2) frictionSignals.push('The training day pattern is uneven across the current plan.');
  if (metrics.hardSessionRate >= 0.55) frictionSignals.push('Most recent current-plan sessions landed hard.');
  if ((metrics.readinessAverage ?? 5) < 3 || (metrics.readinessTrend ?? 0) <= -0.8) {
    frictionSignals.push('Readiness is trending below the workload pattern.');
  }

  const tooDenseSignals = [
    (metrics.avgDuration ?? 0) >= 85,
    metrics.skippedExerciseRate >= 0.2,
    metrics.dayIndexImbalance >= 2,
  ].filter(Boolean).length;
  const recoverySignals = [
    (metrics.readinessAverage ?? 5) < 3,
    (metrics.readinessTrend ?? 0) <= -0.8,
    metrics.hardSessionRate >= 0.55,
    (metrics.avgDuration ?? 0) >= 75 || metrics.skippedExerciseRate >= 0.15,
  ].filter(Boolean).length;

  let status: PlanFitStatus = 'fits_well';
  if (tooDenseSignals >= 2) status = 'too_dense';
  else if (recoverySignals >= 3) status = 'recovery_mismatch';
  else if (
    metrics.completionRatio >= 0.85 &&
    (metrics.avgDuration ?? 99) <= 40 &&
    metrics.hardSessionRate <= 0.25 &&
    (metrics.readinessAverage ?? 0) >= 4
  ) {
    status = 'under_dosed';
  }

  const fitScore = clamp(
    Math.round(
      55 +
        metrics.completionRatio * 28 -
        metrics.skippedExerciseRate * 26 -
        metrics.dayIndexImbalance * 6 -
        metrics.hardSessionRate * 14 +
        ((metrics.readinessAverage ?? 3.5) - 3.5) * 8,
    ),
    0,
    100,
  );
  const confidence = getPlanFitConfidence(currentPlanLogs.length, readinessLogs.length, status);

  const copy: Record<PlanFitStatus, Pick<PlanFitReviewInsight, 'diagnosis' | 'reasons' | 'suggestedAdjustment'>> = {
    fits_well: {
      diagnosis: 'This plan is matching your current training rhythm.',
      reasons: ['Completion is steady.', 'Exercise completion and effort look manageable.', 'Readiness is supporting the plan.'],
      suggestedAdjustment: 'Keep the structure and make progressions small enough to repeat.',
    },
    too_dense: {
      diagnosis: 'The plan may be packed tighter than your current rhythm supports.',
      reasons: frictionSignals.slice(0, 3),
      suggestedAdjustment: 'Trim one accessory block or rotate the under-logged day earlier in the week.',
    },
    recovery_mismatch: {
      diagnosis: 'Workload and readiness are not lining up cleanly yet.',
      reasons: frictionSignals.slice(0, 3),
      suggestedAdjustment: 'Hold loads steady and keep the next session repeatable before adding work.',
    },
    under_dosed: {
      diagnosis: 'The plan may have room for a little more productive work.',
      reasons: ['Completion is high.', 'Sessions are short and controlled.', 'Readiness is consistently strong.'],
      suggestedAdjustment: 'Add one focused set to the main lift or add a small rep target next week.',
    },
    needs_data: {
      diagnosis: 'Plan Fit Review needs more current plan signal.',
      reasons: ['Log at least two current plan sessions to compare the pattern.'],
      suggestedAdjustment: 'Keep logging current-plan sessions.',
    },
  };

  return {
    status,
    confidence,
    fitScore,
    frictionSignals,
    metrics,
    ...copy[status],
  };
}

function getLiftTruthStatus(exposures: LiftExposure[], changePercent: number): LiftTruthStatus {
  if (exposures.length < MIN_LIFT_EXPOSURES) return 'needs_data';

  const first = exposures[0];
  const recent = exposures.slice(-2);
  const earlier = exposures.slice(0, -2);
  const recentRir = getAverage(recent.map((item) => item.rir)) ?? first.rir;
  const earlierRir = getAverage(earlier.map((item) => item.rir)) ?? first.rir;
  const recentDifficulty = getAverage(recent.map((item) => item.difficulty)) ?? first.difficulty;
  const earlierDifficulty = getAverage(earlier.map((item) => item.difficulty)) ?? first.difficulty;
  const rirShift = recentRir - earlierRir;
  const difficultyShift = recentDifficulty - earlierDifficulty;
  const minDropPercent = Math.min(...exposures.map((item) => ((item.estimate - first.estimate) / first.estimate) * 100));

  if ((changePercent < 0 || minDropPercent <= -5) && recentRir <= 1 && recentDifficulty >= 2) return 'technique_check';
  if (changePercent >= 3 && (rirShift <= -1 || difficultyShift >= 0.75 || recentRir <= 1)) return 'grind_debt';
  if (changePercent >= 3 && rirShift >= -0.5 && difficultyShift <= 0.5) return 'clean_progress';
  if (Math.abs(changePercent) < 3 && (rirShift >= 0.75 || difficultyShift <= -0.75)) return 'quiet_progress';
  return 'technique_check';
}

function getTruthInterpretation(status: LiftTruthStatus, changePercent: number) {
  switch (status) {
    case 'clean_progress':
      return `Estimate is up ${formatPercent(changePercent)} while effort stays controlled.`;
    case 'grind_debt':
      return `Estimate is up ${formatPercent(changePercent)}, but the effort cost is rising.`;
    case 'quiet_progress':
      return 'Load is steady, but reps are costing less effort.';
    case 'technique_check':
      return 'Output is uneven while effort is high. Treat the next exposure as a quality check.';
    case 'needs_data':
      return `Needs ${MIN_LIFT_EXPOSURES} meaningful exposures before calling the pattern.`;
    default:
      return 'Keep logging this lift to sharpen the read.';
  }
}

function getTruthNextCue(status: LiftTruthStatus) {
  switch (status) {
    case 'clean_progress':
      return 'Add a small rep or load step only if warm-ups feel repeatable.';
    case 'grind_debt':
      return 'Hold load and win the same reps with one more rep in reserve.';
    case 'quiet_progress':
      return 'Keep the load and add one clean rep before increasing weight.';
    case 'technique_check':
      return 'Use the same or slightly lighter load and prioritize clean positions.';
    case 'needs_data':
      return 'Log one more loaded exposure for this lift.';
    default:
      return 'Keep the next exposure repeatable.';
  }
}

export function buildLiftTruthMeter({
  workoutLogs,
  preferredWeightUnit,
  limit = 3,
}: LiftTruthMeterInput): LiftTruthMeterInsight[] {
  const exposureMap = buildLiftExposures(workoutLogs, preferredWeightUnit);

  return Array.from(exposureMap.entries())
    .map(([exerciseId, exposures]) => {
      const first = exposures[0];
      const last = exposures[exposures.length - 1];
      const changePercent =
        first && last && first.estimate > 0 ? ((last.estimate - first.estimate) / first.estimate) * 100 : 0;
      const status = getLiftTruthStatus(exposures, changePercent);
      const recentRir = getAverage(exposures.slice(-2).map((item) => item.rir)) ?? 0;
      const earlierRir = getAverage(exposures.slice(0, -2).map((item) => item.rir)) ?? recentRir;

      return {
        exerciseId,
        exerciseName: last?.exerciseName ?? first?.exerciseName ?? 'Unknown lift',
        status,
        confidence: getLiftConfidence(exposures),
        currentEstimate: last ? Math.round(last.estimate) : null,
        changePercent,
        bestSetLabel: formatBestSet(last, preferredWeightUnit),
        effortShift: recentRir - earlierRir,
        sessionsAnalyzed: exposures.length,
        interpretation: getTruthInterpretation(status, changePercent),
        nextCue: getTruthNextCue(status),
        sparkline: exposures.map((exposure) => ({
          date: exposure.date.toISOString(),
          value: Math.round(exposure.estimate),
        })),
      };
    })
    .sort((a, b) => b.sessionsAnalyzed - a.sessionsAnalyzed)
    .slice(0, limit);
}

function compactPrescription(prescription: ExercisePrescription, status: SessionRescueStatus): SessionRescueRecommendation {
  const setCaps: Record<SessionRescueStatus, number> = {
    full_session_ok: prescription.sets,
    rescue_35: 3,
    rescue_25: 2,
    rescue_15: 2,
    needs_plan: 0,
  };
  return {
    exerciseId: prescription.exercise.id,
    exerciseName: prescription.exercise.name,
    sets: Math.max(1, Math.min(prescription.sets, setCaps[status])),
    reps: prescription.reps,
    rir: Math.max(prescription.rir, status === 'full_session_ok' ? prescription.rir : 2),
    restSeconds: Math.min(prescription.restSeconds, status === 'full_session_ok' ? prescription.restSeconds : 90),
    note: status === 'full_session_ok' ? 'Run as planned.' : 'Keep this crisp and leave room to repeat.',
  };
}

function getSessionRescueStatus(workoutLogs: WorkoutLog[], readinessLogs: ReadinessEntry[], now: Date): SessionRescueStatus {
  const latestReadiness = getLatestReadiness(readinessLogs);
  const recentLogs = getRecentLogs(workoutLogs, now);
  const hardSessions = recentLogs.filter(
    (log) => log.perceivedDifficulty === 'challenging' || log.perceivedDifficulty === 'too_hard',
  ).length;
  const avgDuration = getAverage(recentLogs.map((log) => log.duration)) ?? 0;
  let strainScore = 0;
  if (latestReadiness && latestReadiness.overallScore < 2.7) strainScore += 2;
  if (latestReadiness && (latestReadiness.energyLevel <= 2 || latestReadiness.stressLevel >= 4)) strainScore += 1;
  if (hardSessions >= 2) strainScore += 2;
  else if (hardSessions === 1) strainScore += 1;
  if (avgDuration >= 85) strainScore += 1;

  if (strainScore >= 5) return 'rescue_15';
  if (strainScore >= 3) return 'rescue_25';
  if (strainScore >= 1) return 'rescue_35';
  return 'full_session_ok';
}

export function buildSessionRescue({
  currentPlan,
  targetDayIndex,
  workoutLogs,
  readinessLogs,
  now = new Date(),
}: SessionRescueInput): SessionRescueInsight {
  const targetDay = currentPlan?.workoutDays.find((day) => day.dayIndex === targetDayIndex);
  if (!currentPlan || !targetDay) {
    return {
      status: 'needs_plan',
      confidence: 'low',
      recommendedDuration: 0,
      targetDayName: null,
      recommendations: [],
      skipList: [],
      reason: 'Choose an active plan day to build a rescue session.',
      nextAction: 'Select a plan day, then log readiness and recent training effort.',
    };
  }

  const status = getSessionRescueStatus(workoutLogs, readinessLogs, now);
  const durationByStatus: Record<SessionRescueStatus, number> = {
    full_session_ok: targetDay.estimatedDuration,
    rescue_35: 35,
    rescue_25: 25,
    rescue_15: 15,
    needs_plan: 0,
  };
  const targetCount = status === 'rescue_15' ? 3 : status === 'rescue_25' ? 4 : Math.min(5, targetDay.exercises.length);
  const selected = targetDay.exercises.slice(0, targetCount);
  const recommendations = selected.map((prescription) => compactPrescription(prescription, status));

  return {
    status,
    confidence: readinessLogs.length > 0 || workoutLogs.length > 0 ? 'medium' : 'low',
    recommendedDuration: durationByStatus[status],
    targetDayName: targetDay.name,
    recommendations,
    skipList: targetDay.exercises.slice(recommendations.length).map((item) => item.exercise.name),
    reason:
      status === 'full_session_ok'
        ? 'Recent readiness and effort support the planned session.'
        : 'Recent readiness or effort signals favor a compact version today.',
    nextAction:
      status === 'full_session_ok'
        ? 'Run the day as written and keep effort honest.'
        : 'Start with the first lift, stop after the rescue list, and log how it felt.',
  };
}

export function buildWeeklyCoachSummary({
  workoutLogs,
  readinessLogs,
  preferredWeightUnit,
  now = new Date(),
}: WeeklyCoachSummaryInput): WeeklyCoachSummary {
  const thisWeekLogs = getRecentLogs(workoutLogs, now);
  const previousWeekLogs = getPreviousLogs(workoutLogs, now);
  const volumeThisWeek = sumVolume(thisWeekLogs);
  const previousWeekVolume = sumVolume(previousWeekLogs);
  const volumeChangePercent = getVolumeChangePercent(volumeThisWeek, previousWeekVolume);
  const avgReadiness = getReadinessAverage(readinessLogs, now);

  if (thisWeekLogs.length === 0) {
    return {
      title: 'Build your first weekly signal',
      summary: 'Log a workout this week and FitWizardly will turn the pattern into coach notes.',
      highlights: ['No completed sessions in the last 7 days.', 'Readiness and workload need more signal.'],
      nextWeekFocus: 'Start with one repeatable session and one readiness check-in.',
      confidence: 'low',
      stats: {
        sessionsThisWeek: 0,
        previousWeekSessions: previousWeekLogs.length,
        volumeThisWeek: 0,
        previousWeekVolume,
        volumeChangePercent,
        avgReadiness,
      },
    };
  }

  const hardSessions = thisWeekLogs.filter(
    (log) => log.perceivedDifficulty === 'challenging' || log.perceivedDifficulty === 'too_hard',
  ).length;
  const highStrain = (avgReadiness !== null && avgReadiness < 3) || hardSessions >= 2;
  const confidence: AnalyticsConfidence =
    thisWeekLogs.length >= 2 && readinessLogs.length >= 2 ? 'high' : thisWeekLogs.length >= 1 ? 'medium' : 'low';

  const highlights = [
    `${thisWeekLogs.length} ${pluralizeSession(thisWeekLogs.length)} completed.`,
    volumeChangePercent === null
      ? `${formatLoad(volumeThisWeek)} ${preferredWeightUnit} of logged volume this week.`
      : `Volume ${volumeChangePercent >= 0 ? 'increased' : 'decreased'} ${formatPercent(volumeChangePercent)} from last week.`,
  ];

  if (avgReadiness !== null) {
    highlights.push(`Readiness averaged ${avgReadiness.toFixed(1)}/5.`);
  }

  if (hardSessions > 0) {
    highlights.push(`${hardSessions} ${pluralizeSession(hardSessions)} felt challenging or harder.`);
  }

  const summary = highStrain
    ? `${thisWeekLogs.length} ${pluralizeSession(thisWeekLogs.length)} completed, but recovery looks strained. Keep the next progression small and let readiness rebound.`
    : `${thisWeekLogs.length} ${pluralizeSession(thisWeekLogs.length)} completed with a workable recovery signal. This is a good week to keep progress repeatable.`;

  const nextWeekFocus =
    thisWeekLogs.length <= 1
      ? 'Make next week repeatable: lock in 2 sessions before chasing more volume.'
      : highStrain
        ? 'Keep loads stable next week and add reps only if RIR stays 2 or higher.'
        : 'Repeat the core lifts, then add a small rep or load increase where effort stays controlled.';

  return {
    title: 'Weekly Coach Notes',
    summary,
    highlights,
    nextWeekFocus,
    confidence,
    stats: {
      sessionsThisWeek: thisWeekLogs.length,
      previousWeekSessions: previousWeekLogs.length,
      volumeThisWeek,
      previousWeekVolume,
      volumeChangePercent,
      avgReadiness,
    },
  };
}

export function buildWeeklyChangeBrief({
  workoutLogs,
  readinessLogs,
  now = new Date(),
}: AnalyticsInput): WeeklyChangeBrief {
  const thisWeekLogs = getRecentLogs(workoutLogs, now);
  const previousWeekLogs = getPreviousLogs(workoutLogs, now);
  const volumeThisWeek = sumVolume(thisWeekLogs);
  const previousWeekVolume = sumVolume(previousWeekLogs);
  const volumeChangePercent = getVolumeChangePercent(volumeThisWeek, previousWeekVolume);
  const readinessAverage = getReadinessAverage(readinessLogs, now);
  const readinessTrend = getReadinessTrend(readinessLogs, now);

  const metrics = {
    sessionsThisWeek: thisWeekLogs.length,
    previousWeekSessions: previousWeekLogs.length,
    volumeThisWeek,
    previousWeekVolume,
    volumeChangePercent,
    readinessAverage,
    readinessTrend,
  };

  if (thisWeekLogs.length === 0) {
    return {
      status: 'needs_data',
      title: 'Weekly Change Brief',
      confidence: 'low',
      summary: 'Log a workout and readiness check-in to compare this week against last week.',
      keySignals: ['No completed sessions in the last 7 days.', 'Readiness trend needs more entries.'],
      nextAction: 'Start with one repeatable session and record how ready you feel.',
      metrics,
    };
  }

  const confidence: AnalyticsConfidence =
    thisWeekLogs.length >= 2 && readinessLogs.length >= 2 ? 'high' : thisWeekLogs.length >= 1 ? 'medium' : 'low';
  const loadIsUp = volumeChangePercent !== null && volumeChangePercent >= 15;
  const loadIsDown = volumeChangePercent !== null && volumeChangePercent <= -20;
  const readinessIsDown = (readinessTrend ?? 0) <= -0.5 || (readinessAverage ?? 5) < 3;
  const quieterWeek = loadIsDown || thisWeekLogs.length < previousWeekLogs.length;

  if (loadIsUp && readinessIsDown) {
    return {
      status: 'watch_recovery',
      title: 'Weekly Change Brief',
      confidence,
      summary: `Training load is up ${formatPercent(volumeChangePercent)}, while readiness is down. The priority is keeping progress repeatable.`,
      keySignals: [
        `Volume climbed from ${formatLoad(previousWeekVolume)} to ${formatLoad(volumeThisWeek)}.`,
        readinessAverage === null ? 'Readiness entries are limited.' : `Readiness is averaging ${readinessAverage.toFixed(1)}/5.`,
      ],
      nextAction: 'Hold loads stable for the next session and add work only if reps stay clean.',
      metrics,
    };
  }

  if (quieterWeek) {
    return {
      status: 'rebuild_rhythm',
      title: 'Weekly Change Brief',
      confidence,
      summary: 'This was a quieter training week. Treat the next step as rhythm-building, not catch-up work.',
      keySignals: [
        `${thisWeekLogs.length} ${pluralizeSession(thisWeekLogs.length)} completed this week.`,
        volumeChangePercent === null ? 'Last-week volume is limited.' : `Volume is down ${formatPercent(volumeChangePercent)} from last week.`,
      ],
      nextAction: 'Book one repeatable session first, then rebuild volume gradually.',
      metrics,
    };
  }

  if (loadIsUp) {
    return {
      status: 'build_momentum',
      title: 'Weekly Change Brief',
      confidence,
      summary: `Training load is up ${formatPercent(volumeChangePercent)} and recovery is holding well enough to build momentum.`,
      keySignals: [
        `${thisWeekLogs.length} ${pluralizeSession(thisWeekLogs.length)} completed this week.`,
        readinessAverage === null ? 'Readiness trend is still forming.' : `Readiness is averaging ${readinessAverage.toFixed(1)}/5.`,
      ],
      nextAction: 'Repeat the core lifts and make only one small progression at a time.',
      metrics,
    };
  }

  return {
    status: 'steady',
    title: 'Weekly Change Brief',
    confidence,
    summary: 'Load and readiness look steady. This is the right window for controlled, boring progress.',
    keySignals: [
      `${thisWeekLogs.length} ${pluralizeSession(thisWeekLogs.length)} completed this week.`,
      volumeChangePercent === null
        ? `${formatLoad(volumeThisWeek)} logged volume this week.`
        : `Volume changed ${formatPercent(volumeChangePercent)} from last week.`,
    ],
    nextAction: 'Repeat the plan and add a small rep or load step only where effort stays controlled.',
    metrics,
  };
}
