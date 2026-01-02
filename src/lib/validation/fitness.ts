import { z } from 'zod';

// ============================================================================
// ENUMS & LITERALS
// ============================================================================

export const GoalSchema = z.enum(['strength', 'hypertrophy', 'general']);
export const ExperienceLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const EquipmentSchema = z.enum([
    'bodyweight', 'dumbbells', 'barbell', 'kettlebells', 'cables',
    'machines', 'pullup_bar', 'bench', 'squat_rack', 'resistance_bands'
]);

export const MuscleGroupSchema = z.enum([
    'chest', 'front_deltoid', 'side_deltoid', 'rear_deltoid', 'biceps',
    'triceps', 'forearms', 'abs', 'obliques', 'quads', 'hip_flexors',
    'adductors', 'traps', 'upper_back', 'lats', 'lower_back', 'glutes',
    'hamstrings', 'calves', 'neck'
]);

export const ConstraintSchema = z.enum([
    'no_overhead', 'no_heavy_spinal_load', 'no_impact', 'no_rotation',
    'shoulder_injury', 'back_injury', 'knee_injury', 'wrist_injury'
]);

export const MovementPatternSchema = z.enum([
    'horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull',
    'squat', 'hinge', 'lunge', 'carry', 'isolation', 'rotation'
]);

export const SplitTypeSchema = z.enum(['full_body', 'upper_lower', 'push_pull_legs']);

// ============================================================================
// WIZARD SELECTIONS
// ============================================================================

export const WizardSelectionsSchema = z.object({
    goal: GoalSchema,
    experienceLevel: ExperienceLevelSchema,
    equipment: z.array(EquipmentSchema).min(1, 'Select at least one equipment'),
    targetMuscles: z.array(MuscleGroupSchema).min(1, 'Select at least one muscle'),
    constraints: z.array(ConstraintSchema).default([]),
    daysPerWeek: z.number().int().min(2).max(6),
    sessionDuration: z.number().int().min(30).max(120),
});

export type WizardSelectionsInput = z.input<typeof WizardSelectionsSchema>;

// ============================================================================
// EXERCISE
// ============================================================================

export const ExerciseSchema = z.object({
    id: z.string(),
    name: z.string(),
    primaryMuscles: z.array(MuscleGroupSchema),
    secondaryMuscles: z.array(MuscleGroupSchema),
    equipment: z.array(EquipmentSchema),
    patterns: z.array(MovementPatternSchema),
    contraindications: z.array(ConstraintSchema),
    cues: z.array(z.string()),
    videoUrl: z.string().url().optional(),
});

// ============================================================================
// EXERCISE PRESCRIPTION
// ============================================================================

export const ExercisePrescriptionSchema = z.object({
    exercise: ExerciseSchema,
    sets: z.number().int().min(1).max(10),
    reps: z.string(), // e.g., "8-12"
    rir: z.number().int().min(0).max(5),
    restSeconds: z.number().int().min(30).max(300),
    notes: z.string().optional(),
    rationale: z.string().optional(),
});

// ============================================================================
// WORKOUT DAY
// ============================================================================

export const WorkoutDaySchema = z.object({
    dayIndex: z.number().int().min(0),
    name: z.string(),
    focusTags: z.array(z.string()),
    exercises: z.array(ExercisePrescriptionSchema),
    estimatedDuration: z.number().int(),
});

// ============================================================================
// PLAN
// ============================================================================

export const WeeklyVolumeSchema = z.object({
    muscleGroup: MuscleGroupSchema,
    sets: z.number().int().min(0),
    isWithinCap: z.boolean(),
});

export const RIRProgressionSchema = z.object({
    week: z.number().int().min(1).max(4),
    targetRIR: z.number().int().min(0).max(5),
    isDeload: z.boolean(),
});

export const PlanSchema = z.object({
    id: z.string(),
    createdAt: z.coerce.date(),
    selections: WizardSelectionsSchema,
    splitType: SplitTypeSchema,
    workoutDays: z.array(WorkoutDaySchema),
    weeklyVolume: z.array(WeeklyVolumeSchema),
    rirProgression: z.array(RIRProgressionSchema),
    notes: z.array(z.string()),
    schemaVersion: z.number().int().optional().default(1),
});

export type PlanInput = z.input<typeof PlanSchema>;

// ============================================================================
// API PAYLOADS
// ============================================================================

export const CreatePlanPayloadSchema = z.object({
    selections: WizardSelectionsSchema,
});

export const UpdateExercisePayloadSchema = z.object({
    dayIndex: z.number().int().min(0),
    exerciseIndex: z.number().int().min(0),
    updates: z.object({
        sets: z.number().int().min(1).max(10).optional(),
        reps: z.string().optional(),
        rir: z.number().int().min(0).max(5).optional(),
        restSeconds: z.number().int().min(30).max(300).optional(),
        notes: z.string().optional(),
    }),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateWizardSelections(data: unknown) {
    return WizardSelectionsSchema.safeParse(data);
}

export function validatePlan(data: unknown) {
    return PlanSchema.safeParse(data);
}
