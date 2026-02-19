import { describe, expect, it } from 'vitest';
import {
    detectMRVWarnings,
    suggestSplitAdjustment,
    type VolumeLandmarkGroup,
} from '@/lib/progressionEngine';
import type { Plan, WorkoutLog } from '@/types/fitness';

function buildPlan(daysPerWeek: number): Plan {
    return {
        id: 'plan-1',
        createdAt: new Date('2026-01-01'),
        selections: {
            firstName: 'Test',
            lastName: 'User',
            personalGoalNote: '',
            isTrainer: false,
            coachNotes: '',
            goal: 'hypertrophy',
            experienceLevel: 'intermediate',
            equipment: ['barbell', 'bench'],
            targetMuscles: ['chest'],
            constraints: [],
            daysPerWeek,
            sessionDuration: 60,
        },
        splitType: 'push_pull_legs',
        workoutDays: [
            {
                dayIndex: 0,
                name: 'Day 1',
                focusTags: ['chest'],
                estimatedDuration: 60,
                exercises: [
                    {
                        exercise: {
                            id: 'bench_press',
                            name: 'Bench Press',
                            primaryMuscles: ['chest'],
                            secondaryMuscles: ['triceps'],
                            equipment: ['barbell', 'bench'],
                            patterns: ['horizontal_push'],
                            contraindications: [],
                            cues: ['Brace'],
                        },
                        sets: 3,
                        reps: '8',
                        rir: 2,
                        restSeconds: 120,
                    },
                ],
            },
        ],
        weeklyVolume: [],
        rirProgression: [
            { week: 1, targetRIR: 3, isDeload: false },
            { week: 2, targetRIR: 2, isDeload: false },
            { week: 3, targetRIR: 1, isDeload: false },
            { week: 4, targetRIR: 4, isDeload: true },
        ],
        notes: [],
    };
}

function buildWorkoutLog(date: Date, sets: number): WorkoutLog {
    return {
        id: `log-${date.toISOString()}`,
        planId: 'plan-1',
        dayIndex: 0,
        dayName: 'Day 1',
        startedAt: date,
        completedAt: date,
        duration: 45,
        exercises: [
            {
                exerciseId: 'bench_press',
                exerciseName: 'Bench Press',
                sets: Array.from({ length: sets }, (_, index) => ({
                    setNumber: index + 1,
                    weight: 135,
                    weightUnit: 'lbs',
                    reps: 8,
                    rir: 2,
                    completed: true,
                })),
            },
        ],
        perceivedDifficulty: 'just_right',
        totalVolume: sets * 135 * 8,
    };
}

describe('progressionEngine phase 3 intelligence', () => {
    it('detects MRV warnings when weekly sets exceed landmark cap', () => {
        const plan = buildPlan(4);
        const log = buildWorkoutLog(new Date(), 23);

        const warnings = detectMRVWarnings([log], plan, 7);
        const warningGroups = warnings.map((warning) => warning.muscleGroup as VolumeLandmarkGroup);

        expect(warningGroups).toContain('chest');
        expect(warnings.find((warning) => warning.muscleGroup === 'chest')?.mrv).toBe(22);
    });

    it('suggests a lower-frequency split when adherence is consistently below plan', () => {
        const plan = buildPlan(5);
        const now = new Date('2026-02-19T10:00:00.000Z');

        const logs: WorkoutLog[] = [];
        for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
            const base = new Date(now);
            base.setDate(base.getDate() - weekOffset * 7);

            for (const dayOffset of [0, 2, 4]) {
                const date = new Date(base);
                date.setDate(base.getDate() - dayOffset);
                logs.push(buildWorkoutLog(date, 3));
            }
        }

        const suggestion = suggestSplitAdjustment(logs, plan, 28);

        expect(suggestion).not.toBeNull();
        expect(suggestion?.recommendedSplit).toBe('full_body');
        expect(suggestion?.plannedDaysPerWeek).toBe(5);
    });
});
