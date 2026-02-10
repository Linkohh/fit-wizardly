/**
 * Progression Engine
 * 
 * Analyzes workout logs and generates intelligent load progression recommendations
 * based on RIR (Reps in Reserve) performance, stagnation detection, and NASM principles.
 */

import type {
    WorkoutLog,
    ExerciseLog,
    SetLog,
    ProgressionRecommendation,
    ProgressionConfidence,
    ProgressionAction,
    WeeklySummary,
    PersonalRecord,
    Plan,
    MuscleGroup,
} from '@/types/fitness';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Group workout logs by exercise ID for analysis
 */
function groupLogsByExercise(logs: WorkoutLog[]): Map<string, ExerciseLog[]> {
    const grouped = new Map<string, ExerciseLog[]>();

    for (const log of logs) {
        for (const exerciseLog of log.exercises) {
            if (exerciseLog.skipped) continue;

            const existing = grouped.get(exerciseLog.exerciseId) || [];
            existing.push(exerciseLog);
            grouped.set(exerciseLog.exerciseId, existing);
        }
    }

    return grouped;
}

/**
 * Calculate average RIR across all sets for an exercise
 */
function calculateAvgRIR(exerciseLogs: ExerciseLog[]): number {
    let totalRIR = 0;
    let setCount = 0;

    for (const log of exerciseLogs) {
        for (const set of log.sets) {
            if (set.completed) {
                totalRIR += set.rir;
                setCount++;
            }
        }
    }

    return setCount > 0 ? totalRIR / setCount : 0;
}

/**
 * Calculate average load (weight) for an exercise
 */
function calculateAvgLoad(exerciseLogs: ExerciseLog[]): number {
    let totalWeight = 0;
    let setCount = 0;

    for (const log of exerciseLogs) {
        for (const set of log.sets) {
            if (set.completed) {
                totalWeight += set.weight;
                setCount++;
            }
        }
    }

    return setCount > 0 ? totalWeight / setCount : 0;
}

/**
 * Detect if an exercise has stagnated (same load for 3+ weeks)
 */
function isStagnant(exerciseLogs: ExerciseLog[], weeksToCheck = 3): boolean {
    if (exerciseLogs.length < weeksToCheck) return false;

    const recentLogs = exerciseLogs.slice(-weeksToCheck);
    const loads = recentLogs.map(log => {
        const completedSets = log.sets.filter(s => s.completed);
        if (completedSets.length === 0) return 0;
        return completedSets.reduce((sum, s) => sum + s.weight, 0) / completedSets.length;
    });

    // Check if all loads are within 2.5% of each other
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
    return loads.every(load => Math.abs(load - avgLoad) / avgLoad < 0.025);
}

/**
 * Calculate RIR variance to assess consistency
 */
function calculateRIRVariance(exerciseLogs: ExerciseLog[]): number {
    const rirValues: number[] = [];

    for (const log of exerciseLogs) {
        for (const set of log.sets) {
            if (set.completed) {
                rirValues.push(set.rir);
            }
        }
    }

    if (rirValues.length < 2) return 0;

    const mean = rirValues.reduce((a, b) => a + b, 0) / rirValues.length;
    const squaredDiffs = rirValues.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / rirValues.length);
}

/**
 * Round weight to nearest practical increment (2.5 lbs or 1 kg)
 */
function roundToIncrement(weight: number, unit: 'lbs' | 'kg' = 'lbs'): number {
    const increment = unit === 'lbs' ? 2.5 : 1;
    return Math.round(weight / increment) * increment;
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Analyze workout performance and generate progression recommendations
 * 
 * @param logs - Recent workout logs (ideally 1-4 weeks)
 * @param currentPlan - The current training plan
 * @returns Array of progression recommendations
 */
export function analyzePerformance(
    logs: WorkoutLog[],
    currentPlan: Plan
): ProgressionRecommendation[] {
    const recommendations: ProgressionRecommendation[] = [];

    if (logs.length === 0) return recommendations;

    const exercisePerformance = groupLogsByExercise(logs);

    // Get target RIR from plan's current week
    const currentWeek = Math.min(logs.length, 4);
    const targetRIR = currentPlan.rirProgression.find(r => r.week === currentWeek)?.targetRIR ?? 2;

    for (const [exerciseId, exerciseLogs] of exercisePerformance) {
        // Find exercise details from plan
        let exerciseName = exerciseId;
        for (const day of currentPlan.workoutDays) {
            const found = day.exercises.find(e => e.exercise.id === exerciseId);
            if (found) {
                exerciseName = found.exercise.name;
                break;
            }
        }

        const avgRIR = calculateAvgRIR(exerciseLogs);
        const currentLoad = calculateAvgLoad(exerciseLogs);
        const rirVariance = calculateRIRVariance(exerciseLogs);
        const stagnant = isStagnant(exerciseLogs);

        let recommendedLoad = currentLoad;
        let rationale = '';
        let confidence: ProgressionConfidence = 'medium';
        let action: ProgressionAction = 'maintain';

        // Rule 1: RIR consistently higher than target (too easy) → increase load
        if (avgRIR > targetRIR + 0.5 && rirVariance < 1.5) {
            const increasePercent = stagnant ? 0.10 : 0.05; // 10% if stagnant, 5% otherwise
            recommendedLoad = roundToIncrement(currentLoad * (1 + increasePercent));
            action = 'increase';
            rationale = stagnant
                ? `Plateau detected after 3+ weeks at same weight. Avg RIR ${avgRIR.toFixed(1)} is above target ${targetRIR}. Time for a bigger jump!`
                : `Consistently hitting RIR ${avgRIR.toFixed(1)} (target: ${targetRIR}). You have room to push harder!`;
            confidence = rirVariance < 0.5 ? 'high' : 'medium';
        }

        // Rule 2: RIR consistently lower than target (too hard) → decrease or maintain
        else if (avgRIR < targetRIR - 0.5) {
            if (avgRIR < 1) {
                // Very close to failure - consider decreasing
                recommendedLoad = roundToIncrement(currentLoad * 0.95);
                action = 'decrease';
                rationale = `Struggling to maintain target RIR. Avg RIR ${avgRIR.toFixed(1)} is very close to failure. Reducing load for recovery.`;
                confidence = 'high';
            } else {
                action = 'maintain';
                rationale = `RIR ${avgRIR.toFixed(1)} is below target ${targetRIR}. Maintain current load until consistent.`;
                confidence = 'medium';
            }
        }

        // Rule 3: RIR on target with low variance → progressive overload
        else if (rirVariance < 1.0) {
            recommendedLoad = roundToIncrement(currentLoad * 1.025); // 2.5% increase
            action = 'increase';
            rationale = `Excellent execution at target RIR ${targetRIR}. Applying progressive overload (+2.5%).`;
            confidence = 'high';
        }

        // Rule 4: High variance → maintain until consistent
        else {
            action = 'maintain';
            rationale = `RIR variance is high (${rirVariance.toFixed(1)}). Focus on consistency before progressing.`;
            confidence = 'low';
        }

        // Only add recommendation if there's a meaningful change or insight
        if (action !== 'maintain' || exerciseLogs.length >= 2) {
            recommendations.push({
                exerciseId,
                exerciseName,
                action,
                currentLoad: roundToIncrement(currentLoad),
                recommendedLoad: roundToIncrement(recommendedLoad),
                changePercentage: currentLoad > 0
                    ? ((recommendedLoad - currentLoad) / currentLoad) * 100
                    : 0,
                rationale,
                confidence,
            });
        }
    }

    // Sort recommendations: increases first, then maintains, then decreases
    const actionOrder: ProgressionAction[] = ['increase', 'maintain', 'decrease', 'swap'];
    recommendations.sort((a, b) => actionOrder.indexOf(a.action) - actionOrder.indexOf(b.action));

    return recommendations;
}

// ============================================
// WEEKLY SUMMARY GENERATION
// ============================================

/**
 * Generate a weekly summary from workout logs
 */
export function generateWeeklySummary(
    logs: WorkoutLog[],
    plan: Plan,
    weekNumber: number,
    startDate: Date,
    personalRecords: PersonalRecord[] = []
): WeeklySummary {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const workoutsPlanned = plan.workoutDays.length;
    const workoutsCompleted = logs.length;

    // Calculate total volume
    let totalVolume = 0;
    let totalRIR = 0;
    let totalSets = 0;

    // Track per-muscle stats
    const muscleStats = new Map<MuscleGroup, { sets: number; totalLoad: number }>();

    for (const log of logs) {
        totalVolume += log.totalVolume;

        for (const exerciseLog of log.exercises) {
            if (exerciseLog.skipped) continue;

            // Find the exercise in plan to get muscle groups
            for (const day of plan.workoutDays) {
                const prescription = day.exercises.find(e => e.exercise.id === exerciseLog.exerciseId);
                if (prescription) {
                    const muscles = prescription.exercise.primaryMuscles;

                    for (const muscle of muscles) {
                        const existing = muscleStats.get(muscle) || { sets: 0, totalLoad: 0 };
                        existing.sets += exerciseLog.sets.filter(s => s.completed).length;
                        existing.totalLoad += exerciseLog.sets
                            .filter(s => s.completed)
                            .reduce((sum, s) => sum + s.weight, 0);
                        muscleStats.set(muscle, existing);
                    }

                    for (const set of exerciseLog.sets) {
                        if (set.completed) {
                            totalRIR += set.rir;
                            totalSets++;
                        }
                    }
                    break;
                }
            }
        }
    }

    const avgRIR = totalSets > 0 ? totalRIR / totalSets : 0;
    const targetRIR = plan.rirProgression.find(r => r.week === weekNumber)?.targetRIR ?? 2;

    const muscleGroupBreakdown = Array.from(muscleStats.entries()).map(([muscleGroup, stats]) => ({
        muscleGroup,
        sets: stats.sets,
        avgLoad: stats.sets > 0 ? stats.totalLoad / stats.sets : 0,
    }));

    return {
        weekNumber,
        startDate,
        endDate,
        workoutsCompleted,
        workoutsPlanned,
        completionRate: workoutsPlanned > 0 ? (workoutsCompleted / workoutsPlanned) * 100 : 0,
        totalVolume,
        avgRIR,
        targetRIR,
        muscleGroupBreakdown,
        personalRecords,
    };
}

// ============================================
// PERSONAL RECORD DETECTION
// ============================================

/**
 * Detect personal records from a workout log
 */
export function detectPersonalRecords(
    currentLog: WorkoutLog,
    historicalLogs: WorkoutLog[]
): PersonalRecord[] {
    const records: PersonalRecord[] = [];
    const now = new Date();

    for (const exerciseLog of currentLog.exercises) {
        if (exerciseLog.skipped) continue;

        // Find historical best for this exercise
        const historicalBests = {
            weight: 0,
            reps: 0,
            volume: 0,
        };

        for (const log of historicalLogs) {
            if (log.id === currentLog.id) continue; // Skip current

            const histExercise = log.exercises.find(e => e.exerciseId === exerciseLog.exerciseId);
            if (!histExercise) continue;

            for (const set of histExercise.sets) {
                if (!set.completed) continue;

                if (set.weight > historicalBests.weight) {
                    historicalBests.weight = set.weight;
                }
                if (set.reps > historicalBests.reps) {
                    historicalBests.reps = set.reps;
                }
                const setVolume = set.weight * set.reps;
                if (setVolume > historicalBests.volume) {
                    historicalBests.volume = setVolume;
                }
            }
        }

        // Check current workout for new PRs
        for (const set of exerciseLog.sets) {
            if (!set.completed) continue;

            // Weight PR
            if (set.weight > historicalBests.weight && historicalBests.weight > 0) {
                records.push({
                    id: `${currentLog.id}-${exerciseLog.exerciseId}-weight`,
                    exerciseId: exerciseLog.exerciseId,
                    exerciseName: exerciseLog.exerciseName,
                    type: 'weight',
                    previousValue: historicalBests.weight,
                    newValue: set.weight,
                    achievedAt: now,
                    workoutLogId: currentLog.id,
                });
                historicalBests.weight = set.weight; // Update to avoid duplicates
            }

            // Volume PR (weight × reps for single set)
            const setVolume = set.weight * set.reps;
            if (setVolume > historicalBests.volume && historicalBests.volume > 0) {
                records.push({
                    id: `${currentLog.id}-${exerciseLog.exerciseId}-volume`,
                    exerciseId: exerciseLog.exerciseId,
                    exerciseName: exerciseLog.exerciseName,
                    type: 'volume',
                    previousValue: historicalBests.volume,
                    newValue: setVolume,
                    achievedAt: now,
                    workoutLogId: currentLog.id,
                });
                historicalBests.volume = setVolume;
            }
        }
    }

    return records;
}

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Calculate Estimated One Rep Max (e1RM) using Epley formula
 */
export function calculateOneRepMax(weight: number, reps: number): number {
    if (reps === 1) return weight;
    // Epley formula: w * (1 + r/30)
    return weight * (1 + reps / 30);
}

export function calculateTotalVolume(sets: SetLog[]): number {
    return sets
        .filter(s => s.completed)
        .reduce((sum, s) => sum + (s.weight * s.reps), 0);
}

export function convertWeight(weight: number, from: 'lbs' | 'kg', to: 'lbs' | 'kg'): number {
    if (from === to) return weight;
    if (from === 'lbs' && to === 'kg') return weight * 0.453592;
    return weight * 2.20462; // kg to lbs
}
