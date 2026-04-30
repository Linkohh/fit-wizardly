import { calculateOneRepMax, convertWeight } from '@/lib/progressionEngine';
import type { ReadinessEntry } from '@/types/readiness';
import type { PerceivedDifficulty, SetLog, WeightUnit, WorkoutLog } from '@/types/fitness';

export type AnalyticsConfidence = 'high' | 'medium' | 'low';
export type TrainingCompassStatus = 'push' | 'hold' | 'dial_back' | 'needs_data';
export type LiftMomentumStatus = 'climbing' | 'flat' | 'fatigued' | 'needs_data';

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

export interface LiftMomentumInsight {
  exerciseId: string;
  exerciseName: string;
  status: LiftMomentumStatus;
  confidence: AnalyticsConfidence;
  currentEstimate: number | null;
  changePercent: number;
  bestSetLabel: string;
  recentVolume: number;
  sessionsAnalyzed: number;
  interpretation: string;
  nextAction: string;
  sparkline: Array<{ date: string; value: number }>;
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

interface AnalyticsInput {
  workoutLogs: WorkoutLog[];
  readinessLogs: ReadinessEntry[];
  now?: Date;
}

interface LiftMomentumInput {
  workoutLogs: WorkoutLog[];
  preferredWeightUnit: WeightUnit;
  now?: Date;
  limit?: number;
}

interface WeeklyCoachSummaryInput extends AnalyticsInput {
  preferredWeightUnit: WeightUnit;
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
  volume: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 7;
const PREVIOUS_WINDOW_DAYS = 14;
const MIN_LIFT_EXPOSURES = 3;

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
        volume: completedSets.reduce((sum, set) => {
          const normalizedWeight = convertWeight(set.weight, set.weightUnit, preferredWeightUnit);
          return sum + normalizedWeight * set.reps;
        }, 0),
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

function getLiftStatus(
  exposures: LiftExposure[],
  changePercent: number,
): LiftMomentumStatus {
  if (exposures.length < MIN_LIFT_EXPOSURES) return 'needs_data';

  const recent = exposures.slice(-2);
  const earlier = exposures.slice(0, -2);
  const recentDifficulty = getAverage(recent.map((item) => item.difficulty)) ?? 1;
  const earlierDifficulty = getAverage(earlier.map((item) => item.difficulty)) ?? 1;
  const recentRir = getAverage(recent.map((item) => item.rir)) ?? 2;

  if (changePercent <= -3 && (recentDifficulty >= 2 || recentRir <= 1 || recentDifficulty > earlierDifficulty + 0.5)) {
    return 'fatigued';
  }

  if (changePercent >= 3 && recentDifficulty <= 2.2 && recentRir >= 1.5) {
    return 'climbing';
  }

  return 'flat';
}

function getLiftInterpretation(status: LiftMomentumStatus, changePercent: number) {
  switch (status) {
    case 'climbing':
      return `Up ${formatPercent(changePercent)} with manageable effort. This lift is climbing.`;
    case 'fatigued':
      return `Down ${formatPercent(changePercent)} while effort stress is rising. Treat this as fatigue, not failure.`;
    case 'flat':
      return 'Stable maintenance. Hold the pattern and look for cleaner reps before forcing load.';
    case 'needs_data':
      return `Needs ${MIN_LIFT_EXPOSURES} meaningful sessions before calling a trend.`;
    default:
      return 'Keep logging this lift to build a stronger signal.';
  }
}

function getLiftNextAction(status: LiftMomentumStatus) {
  switch (status) {
    case 'climbing':
      return 'Add 1 rep per set or 2.5-5 lb next time if RIR stays 2 or higher.';
    case 'fatigued':
      return 'Hold load steady or reduce 5% for one exposure, then reassess.';
    case 'flat':
      return 'Repeat the same load and aim for cleaner reps or one extra rep.';
    case 'needs_data':
      return 'Log one more loaded exposure for this lift.';
    default:
      return 'Keep the next session repeatable.';
  }
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

export function buildLiftMomentum({
  workoutLogs,
  preferredWeightUnit,
  limit = 3,
}: LiftMomentumInput): LiftMomentumInsight[] {
  const exposureMap = buildLiftExposures(workoutLogs, preferredWeightUnit);

  return Array.from(exposureMap.entries())
    .map(([exerciseId, exposures]) => {
      const first = exposures[0];
      const last = exposures[exposures.length - 1];
      const changePercent =
        first && last && first.estimate > 0 ? ((last.estimate - first.estimate) / first.estimate) * 100 : 0;
      const status = getLiftStatus(exposures, changePercent);
      const recentVolume = exposures.slice(-3).reduce((sum, exposure) => sum + exposure.volume, 0);

      return {
        exerciseId,
        exerciseName: last?.exerciseName ?? first?.exerciseName ?? 'Unknown lift',
        status,
        confidence: getLiftConfidence(exposures),
        currentEstimate: last ? Math.round(last.estimate) : null,
        changePercent,
        bestSetLabel: formatBestSet(last, preferredWeightUnit),
        recentVolume,
        sessionsAnalyzed: exposures.length,
        interpretation: getLiftInterpretation(status, changePercent),
        nextAction: getLiftNextAction(status),
        sparkline: exposures.map((exposure) => ({
          date: exposure.date.toISOString(),
          value: Math.round(exposure.estimate),
        })),
      };
    })
    .sort((a, b) => {
      const statusWeight = (status: LiftMomentumStatus) => (status === 'needs_data' ? 0 : 1);
      return statusWeight(b.status) - statusWeight(a.status) || b.sessionsAnalyzed - a.sessionsAnalyzed;
    })
    .slice(0, limit);
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
