import { z } from 'zod';

// Minimal validation aligned to the frontend `Plan` shape.
// This intentionally allows extra fields (passthrough) to avoid breaking when the client evolves.

const ExerciseSchema = z
  .object({
    id: z.string().min(1).max(200),
    name: z.string().min(1).max(200),
  })
  .passthrough();

const ExercisePrescriptionSchema = z
  .object({
    exercise: ExerciseSchema,
    sets: z.number().int().min(1).max(20),
    reps: z.string().min(1).max(20),
    rir: z.number().int().min(0).max(10),
    tempo: z.string().max(20).optional(),
    restSeconds: z.number().int().min(0).max(600),
    supersetGroup: z.number().int().min(1).max(50).optional(),
    notes: z.string().max(2000).optional(),
    rationale: z.string().max(5000).optional(),
  })
  .passthrough();

const WorkoutDaySchema = z
  .object({
    dayIndex: z.number().int().min(0).max(6),
    name: z.string().min(1).max(100),
    focusTags: z.array(z.string().min(1).max(50)).max(50).default([]),
    exercises: z.array(ExercisePrescriptionSchema).max(200),
    estimatedDuration: z.number().int().min(0).max(600),
    warmUp: z.array(z.string().min(1).max(200)).max(50).optional(),
    coolDown: z.array(z.string().min(1).max(200)).max(50).optional(),
  })
  .passthrough();

const WeeklyVolumeSchema = z
  .object({
    muscleGroup: z.string().min(1).max(50),
    sets: z.number().int().min(0).max(200),
    isWithinCap: z.boolean(),
  })
  .passthrough();

const RirProgressionSchema = z
  .object({
    week: z.number().int().min(1).max(52),
    targetRIR: z.number().int().min(0).max(10),
    isDeload: z.boolean().optional(),
  })
  .passthrough();

const WizardSelectionsSchema = z
  .object({
    // Personal
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    personalGoalNote: z.string().max(200).optional(),

    // Trainer mode
    isTrainer: z.boolean().optional(),
    coachNotes: z.string().max(5000).optional(),

    // Training config (required)
    goal: z.string().min(1).max(50),
    experienceLevel: z.string().min(1).max(50),
    equipment: z.array(z.string().min(1).max(50)).max(50),
    targetMuscles: z.array(z.string().min(1).max(50)).max(50),
    constraints: z.array(z.string().min(1).max(50)).max(50),
    daysPerWeek: z.number().int().min(1).max(7),
    sessionDuration: z.number().int().min(15).max(240),

    // Optional additions
    optPhase: z.string().max(100).optional(),
  })
  .passthrough();

export const PlanPayloadSchema = z
  .object({
    id: z.string().min(1).max(200),
    createdAt: z.string().datetime().optional(),
    selections: WizardSelectionsSchema,
    splitType: z.string().min(1).max(50),
    workoutDays: z.array(WorkoutDaySchema).min(1).max(7),
    weeklyVolume: z.array(WeeklyVolumeSchema).max(100).default([]),
    rirProgression: z.array(RirProgressionSchema).max(52).default([]),
    notes: z.array(z.string().max(5000)).max(200).default([]),
    warmUp: z.array(z.string().min(1).max(200)).max(50).optional(),
    coolDown: z.array(z.string().min(1).max(200)).max(50).optional(),
    schemaVersion: z.number().int().min(1).max(100).optional().default(1),

    // Optional client-sent metadata (ignored/validated lightly)
    userId: z.string().uuid().optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .passthrough();

export type PlanPayload = z.infer<typeof PlanPayloadSchema>;

