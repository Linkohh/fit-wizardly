import { describe, it, expect } from 'vitest';
import { generatePlan, validateWizardInputs } from '@/lib/planGenerator';
import type { WizardSelections } from '@/types/fitness';

describe('planGenerator', () => {
    const validSelections: WizardSelections = {
        goal: 'hypertrophy',
        experienceLevel: 'intermediate',
        equipment: ['barbell', 'dumbbells', 'bench', 'squat_rack'],
        targetMuscles: ['chest', 'upper_back', 'lats', 'quads', 'hamstrings'],
        constraints: [],
        daysPerWeek: 4,
        sessionDuration: 60,
    };

    describe('generatePlan', () => {
        it('generates a plan with correct number of workout days', () => {
            const plan = generatePlan(validSelections);
            expect(plan.workoutDays.length).toBe(validSelections.daysPerWeek);
        });

        it('assigns exercises to each workout day', () => {
            const plan = generatePlan(validSelections);
            plan.workoutDays.forEach(day => {
                expect(day.exercises.length).toBeGreaterThan(0);
            });
        });

        it('uses a stable plan id for identical selections', () => {
            const planA = generatePlan(validSelections);
            const planB = generatePlan(validSelections);
            expect(planA.id).toBe(planB.id);
        });

        it('can append a timestamp when requested', () => {
            const plan = generatePlan(validSelections, { appendTimestamp: true });
            expect(plan.id).toMatch(/^plan_[a-f0-9]{64}_[0-9]{12}$/);
        });

        it('selects correct split type based on days per week', () => {
            const threeDayPlan = generatePlan({ ...validSelections, daysPerWeek: 3 });
            expect(threeDayPlan.splitType).toBe('full_body');

            const fourDayPlan = generatePlan({ ...validSelections, daysPerWeek: 4 });
            expect(fourDayPlan.splitType).toBe('upper_lower');

            const fiveDayPlan = generatePlan({ ...validSelections, daysPerWeek: 5 });
            expect(fiveDayPlan.splitType).toBe('push_pull_legs');
        });

        it('respects equipment constraints', () => {
            const bodyweightPlan = generatePlan({
                ...validSelections,
                equipment: ['bodyweight'],
            });

            bodyweightPlan.workoutDays.forEach(day => {
                day.exercises.forEach(ex => {
                    ex.exercise.equipment.forEach(eq => {
                        expect(eq).toBe('bodyweight');
                    });
                });
            });
        });

        it('adds rationale to each exercise', () => {
            const plan = generatePlan(validSelections);
            plan.workoutDays.forEach(day => {
                day.exercises.forEach(ex => {
                    expect(ex.rationale).toBeDefined();
                    expect(ex.rationale!.length).toBeGreaterThan(0);
                });
            });
        });

        it('respects volume caps based on experience level', () => {
            const beginnerPlan = generatePlan({
                ...validSelections,
                experienceLevel: 'beginner',
            });

            beginnerPlan.weeklyVolume.forEach(vol => {
                expect(vol.isWithinCap).toBe(true);
            });
        });

        it('generates rep ranges based on goal', () => {
            const strengthPlan = generatePlan({ ...validSelections, goal: 'strength' });
            strengthPlan.workoutDays.forEach(day => {
                day.exercises.forEach(ex => {
                    expect(ex.reps).toMatch(/3-6/);
                });
            });

            const hypertrophyPlan = generatePlan({ ...validSelections, goal: 'hypertrophy' });
            hypertrophyPlan.workoutDays.forEach(day => {
                day.exercises.forEach(ex => {
                    expect(ex.reps).toMatch(/8-12/);
                });
            });
        });
    });

    describe('validateWizardInputs', () => {
        it('validates correct inputs', () => {
            const result = validateWizardInputs(validSelections);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('requires goal', () => {
            const result = validateWizardInputs({ ...validSelections, goal: '' as any });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Please select a training goal');
        });

        it('requires at least one equipment', () => {
            const result = validateWizardInputs({ ...validSelections, equipment: [] });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Please select at least one equipment option');
        });

        it('requires at least one target muscle', () => {
            const result = validateWizardInputs({ ...validSelections, targetMuscles: [] });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Please select at least one muscle group to target');
        });

        it('validates days per week range', () => {
            const tooFew = validateWizardInputs({ ...validSelections, daysPerWeek: 1 });
            expect(tooFew.valid).toBe(false);

            const tooMany = validateWizardInputs({ ...validSelections, daysPerWeek: 7 });
            expect(tooMany.valid).toBe(false);
        });
    });
});
