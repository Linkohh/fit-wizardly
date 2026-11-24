import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { EXERCISE_DATABASE } from '@/test/fixtures/exercises';
import { generatePlanFromExercises, validateWizardInputs } from '@/lib/planGenerator';
import type { Exercise, MuscleGroup, WizardSelections } from '@/types/fitness';

describe('planGenerator', () => {
    const validSelections: WizardSelections = {
        firstName: 'Test',
        lastName: 'User',
        personalGoalNote: '',
        isTrainer: false,
        coachNotes: '',
        goal: 'hypertrophy',
        experienceLevel: 'intermediate',
        equipment: ['barbell', 'dumbbells', 'bench', 'squat_rack'],
        targetMuscles: ['chest', 'upper_back', 'lats', 'quads', 'hamstrings'],
        constraints: [],
        daysPerWeek: 4,
        sessionDuration: 60,
    };

    const generatePlan = (selections: WizardSelections, appendTimestamp = false) =>
        generatePlanFromExercises(EXERCISE_DATABASE, selections, { appendTimestamp });

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
            const plan = generatePlan(validSelections, true);
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

        it('generates rep ranges based on OPT phase', () => {
            const strengthPlan = generatePlan({ ...validSelections, goal: 'strength' });
            strengthPlan.workoutDays.forEach(day => {
                day.exercises.forEach(ex => {
                    // Intermediate + strength -> Phase 2 (Strength Endurance)
                    expect(ex.reps).toMatch(/8-12/);
                });
            });

            const hypertrophyPlan = generatePlan({ ...validSelections, goal: 'hypertrophy' });
            hypertrophyPlan.workoutDays.forEach(day => {
                day.exercises.forEach(ex => {
                    // Intermediate + hypertrophy -> Phase 3 (Muscular Development)
                    expect(ex.reps).toMatch(/6-12/);
                });
            });
        });
    });

    describe('a single target muscle on a full body split', () => {
        const chestOnly: WizardSelections = {
            ...validSelections,
            equipment: [...validSelections.equipment, 'bodyweight'],
            targetMuscles: ['chest'],
            daysPerWeek: 3,
        };

        it('gives every day exercises (no empty "Full Body C")', () => {
            for (const experienceLevel of ['beginner', 'intermediate', 'advanced'] as const) {
                for (const goal of ['hypertrophy', 'strength', 'general'] as const) {
                    const plan = generatePlan({ ...chestOnly, experienceLevel, goal });
                    expect(plan.workoutDays.map(day => day.name)).toEqual([
                        'Full Body A',
                        'Full Body B',
                        'Full Body C',
                    ]);
                    plan.workoutDays.forEach(day => {
                        expect(day.exercises.length, `${experienceLevel}/${goal} ${day.name}`).toBeGreaterThan(0);
                    });
                    plan.weeklyVolume.forEach(volume => {
                        expect(volume.isWithinCap).toBe(true);
                    });
                }
            }
        });

        it('rotates exercises across days when the catalog has more than one day needs', () => {
            const bench = EXERCISE_DATABASE.find(exercise => exercise.id === 'barbell_bench_press');
            expect(bench).toBeDefined();
            const presses = ['press_a', 'press_b', 'press_c'].map(id => ({ ...bench!, id, name: id }));

            const plan = generatePlanFromExercises(presses, chestOnly);
            const firstExercisePerDay = plan.workoutDays.map(day => day.exercises[0]?.exercise.id);

            expect(new Set(firstExercisePerDay).size).toBe(3);
        });
    });

    describe('session budget is shared across the muscles trained that day', () => {
        // The real catalog, as the app ships it, so this checks the exercises users actually get.
        const catalog = JSON.parse(
            readFileSync(resolve(__dirname, '../../../public/exercise-data/legacy-exercises.v1.json'), 'utf-8'),
        ) as Exercise[];
        const allEquipment = [...new Set(catalog.flatMap(exercise => exercise.equipment))];
        const targetSets: MuscleGroup[][] = [
            ['quads', 'hamstrings', 'glutes'],
            ['chest', 'upper_back', 'lats', 'quads', 'hamstrings'],
        ];

        it.each([3, 4, 5, 6])('gives every target muscle at least 1 set a week on %i days', (daysPerWeek) => {
            for (const targetMuscles of targetSets) {
                const plan = generatePlanFromExercises(catalog, {
                    ...validSelections,
                    equipment: allEquipment,
                    targetMuscles,
                    daysPerWeek,
                    sessionDuration: 45,
                });
                const starved = plan.weeklyVolume.filter(volume => volume.sets < 1).map(volume => volume.muscleGroup);
                expect(starved, `${targetMuscles.join('+')} on ${daysPerWeek} days`).toEqual([]);
                plan.weeklyVolume.forEach(volume => expect(volume.isWithinCap).toBe(true));
                plan.workoutDays.forEach(day => {
                    const daySets = day.exercises.reduce((sum, prescription) => sum + prescription.sets, 0);
                    expect(daySets).toBeLessThanOrEqual(15);
                });
            }
        });

        it('never gives two separate supersets on one day the same group number', () => {
            const plan = generatePlanFromExercises(catalog, {
                ...validSelections,
                goal: 'strength',
                equipment: allEquipment,
                targetMuscles: ['chest', 'upper_back', 'lats'],
                daysPerWeek: 3,
            });
            const supersetCount = plan.workoutDays.flatMap(day => day.exercises).filter(prescription => prescription.supersetGroup !== undefined).length;
            expect(supersetCount).toBeGreaterThan(2);
            plan.workoutDays.forEach(day => {
                const groups = day.exercises.map(prescription => prescription.supersetGroup).filter(group => group !== undefined);
                const counts = new Map<number, number>();
                groups.forEach(group => counts.set(group, (counts.get(group) ?? 0) + 1));
                counts.forEach(count => expect(count).toBeLessThanOrEqual(2));
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
            const result = validateWizardInputs({
                ...validSelections,
                goal: '' as unknown as WizardSelections['goal'],
            });
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
