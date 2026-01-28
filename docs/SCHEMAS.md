# SCHEMAS.md - Zod Schema Registry

> **Purpose**: Central catalog of all Zod validation schemas across the application.
> **Audience**: AI assistants, developers adding features, anyone working with data validation.

---

## Table of Contents

1. [Overview](#overview)
2. [Frontend Schemas](#frontend-schemas)
   - [Enums & Literals](#enums--literals)
   - [Core Object Schemas](#core-object-schemas)
   - [API Payload Schemas](#api-payload-schemas)
3. [Form Schemas](#form-schemas)
4. [Server Schemas](#server-schemas)
5. [Type Inference Patterns](#type-inference-patterns)
6. [Schema Composition](#schema-composition)
7. [Validation Helpers](#validation-helpers)
8. [Best Practices](#best-practices)

---

## Overview

This application uses **Zod 4** for runtime validation and TypeScript type inference. Schemas are organized into three layers:

| Layer | Location | Purpose |
|-------|----------|---------|
| Frontend | `src/lib/validation/fitness.ts` | Domain models, API payloads |
| Forms | `src/hooks/useWizardForm.ts` | Step-by-step wizard validation |
| Server | `server/src/index.ts` | API input validation |

### Key Principles

- **Single Source of Truth**: Zod schemas define both validation AND TypeScript types
- **Fail Fast**: Validate at system boundaries (API, forms, storage)
- **Explicit Errors**: Use `.min()`, `.max()` with descriptive messages
- **Strict Mode**: Server schemas use `.strict()` to reject unknown fields

---

## Frontend Schemas

**Source**: [`src/lib/validation/fitness.ts`](../src/lib/validation/fitness.ts)

### Enums & Literals

These enums define the valid values for categorical data throughout the app:

#### GoalSchema
```typescript
export const GoalSchema = z.enum(['strength', 'hypertrophy', 'general']);
```
**Usage**: User's primary training goal. Affects rep ranges, rest times, and exercise selection.

| Value | Rep Range | Rest Period | Focus |
|-------|-----------|-------------|-------|
| `strength` | 3-6 | 3-5 min | Heavy compound lifts |
| `hypertrophy` | 8-12 | 60-90 sec | Volume and time under tension |
| `general` | 6-15 | 60-120 sec | Balanced approach |

#### ExperienceLevelSchema
```typescript
export const ExperienceLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
```
**Usage**: Determines exercise complexity, volume recommendations, and RIR targets.

| Level | Weekly Sets/Muscle | RIR Range | Exercise Complexity |
|-------|-------------------|-----------|---------------------|
| `beginner` | 6-10 | 3-4 | Basic patterns |
| `intermediate` | 10-16 | 2-3 | Moderate complexity |
| `advanced` | 16-22+ | 0-2 | Advanced techniques |

#### EquipmentSchema
```typescript
export const EquipmentSchema = z.enum([
    'bodyweight', 'dumbbells', 'barbell', 'kettlebells', 'cables',
    'machines', 'pullup_bar', 'bench', 'squat_rack', 'resistance_bands'
]);
```
**Usage**: Filters available exercises based on user's available equipment.

#### MuscleGroupSchema
```typescript
export const MuscleGroupSchema = z.enum([
    'chest', 'front_deltoid', 'side_deltoid', 'rear_deltoid', 'biceps',
    'triceps', 'forearms', 'abs', 'obliques', 'quads', 'hip_flexors',
    'adductors', 'traps', 'upper_back', 'lats', 'lower_back', 'glutes',
    'hamstrings', 'calves', 'neck'
]);
```
**Usage**: Granular muscle targeting for exercise selection and volume tracking.

**Grouped by Region**:
- **Upper Push**: chest, front_deltoid, side_deltoid, triceps
- **Upper Pull**: rear_deltoid, biceps, forearms, traps, upper_back, lats
- **Core**: abs, obliques, lower_back
- **Lower**: quads, hip_flexors, adductors, glutes, hamstrings, calves
- **Other**: neck

#### ConstraintSchema
```typescript
export const ConstraintSchema = z.enum([
    'no_overhead', 'no_heavy_spinal_load', 'no_impact', 'no_rotation',
    'shoulder_injury', 'back_injury', 'knee_injury', 'wrist_injury'
]);
```
**Usage**: Filters out contraindicated exercises based on user limitations.

| Constraint | Excluded Movements | Example Exercises Excluded |
|------------|-------------------|---------------------------|
| `no_overhead` | Vertical push | Overhead press, push press |
| `no_heavy_spinal_load` | Axial loading | Back squat, deadlift |
| `no_impact` | Plyometrics | Box jumps, burpees |
| `no_rotation` | Rotational | Russian twists, wood chops |
| `shoulder_injury` | Shoulder stress | Dips, behind-neck press |
| `back_injury` | Spinal flexion/extension | Good mornings, sit-ups |
| `knee_injury` | Deep knee flexion | Deep squats, lunges |
| `wrist_injury` | Wrist load | Push-ups, front squats |

#### MovementPatternSchema
```typescript
export const MovementPatternSchema = z.enum([
    'horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull',
    'squat', 'hinge', 'lunge', 'carry', 'isolation', 'rotation'
]);
```
**Usage**: Ensures balanced programming across fundamental movement patterns.

#### SplitTypeSchema
```typescript
export const SplitTypeSchema = z.enum(['full_body', 'upper_lower', 'push_pull_legs']);
```
**Usage**: Determines workout structure based on training frequency.

| Split | Days/Week | Best For |
|-------|-----------|----------|
| `full_body` | 2-3 | Beginners, time-constrained |
| `upper_lower` | 4 | Intermediate, balanced |
| `push_pull_legs` | 5-6 | Advanced, high frequency |

---

### Core Object Schemas

#### WizardSelectionsSchema
```typescript
export const WizardSelectionsSchema = z.object({
    goal: GoalSchema,
    experienceLevel: ExperienceLevelSchema,
    equipment: z.array(EquipmentSchema).min(1, 'Select at least one equipment'),
    targetMuscles: z.array(MuscleGroupSchema).min(1, 'Select at least one muscle'),
    constraints: z.array(ConstraintSchema).default([]),
    daysPerWeek: z.number().int().min(2).max(6),
    sessionDuration: z.number().int().min(30).max(120),
});
```
**Usage**: Complete user preferences from the onboarding wizard.

#### ExerciseSchema
```typescript
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
```
**Usage**: Exercise database entries with targeting and constraint metadata.

#### ExercisePrescriptionSchema
```typescript
export const ExercisePrescriptionSchema = z.object({
    exercise: ExerciseSchema,
    sets: z.number().int().min(1).max(10),
    reps: z.string(), // e.g., "8-12"
    rir: z.number().int().min(0).max(5),
    restSeconds: z.number().int().min(30).max(300),
    notes: z.string().optional(),
    rationale: z.string().optional(),
});
```
**Usage**: An exercise with its prescribed parameters in a workout.

| Field | Constraints | Notes |
|-------|-------------|-------|
| `sets` | 1-10 | Typically 2-5 for most exercises |
| `reps` | String | Allows ranges like "8-12" or "AMRAP" |
| `rir` | 0-5 | Reps In Reserve (proximity to failure) |
| `restSeconds` | 30-300 | Rest between sets |

#### WorkoutDaySchema
```typescript
export const WorkoutDaySchema = z.object({
    dayIndex: z.number().int().min(0),
    name: z.string(),
    focusTags: z.array(z.string()),
    exercises: z.array(ExercisePrescriptionSchema),
    estimatedDuration: z.number().int(),
});
```
**Usage**: A single workout session within a weekly plan.

#### WeeklyVolumeSchema
```typescript
export const WeeklyVolumeSchema = z.object({
    muscleGroup: MuscleGroupSchema,
    sets: z.number().int().min(0),
    isWithinCap: z.boolean(),
});
```
**Usage**: Tracks total weekly sets per muscle group against recommended caps.

#### RIRProgressionSchema
```typescript
export const RIRProgressionSchema = z.object({
    week: z.number().int().min(1).max(4),
    targetRIR: z.number().int().min(0).max(5),
    isDeload: z.boolean(),
});
```
**Usage**: Progressive overload through RIR reduction across a mesocycle.

#### PlanSchema
```typescript
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
```
**Usage**: Complete workout plan including all metadata and progressions.

---

### API Payload Schemas

#### CreatePlanPayloadSchema
```typescript
export const CreatePlanPayloadSchema = z.object({
    selections: WizardSelectionsSchema,
});
```
**Usage**: Request body for `POST /plans` endpoint.

#### UpdateExercisePayloadSchema
```typescript
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
```
**Usage**: Partial updates to exercise prescriptions within a plan.

---

## Form Schemas

**Source**: [`src/hooks/useWizardForm.ts`](../src/hooks/useWizardForm.ts)

These schemas are used with React Hook Form for step-by-step wizard validation.

### goalStepSchema
```typescript
export const goalStepSchema = z.object({
    firstName: z.string().min(2, 'Name must be at least 2 characters')
        .optional().or(z.literal('')),
    lastName: z.string().min(2, 'Name must be at least 2 characters')
        .optional().or(z.literal('')),
    personalGoalNote: z.string().max(60, 'Maximum 60 characters')
        .optional().or(z.literal('')),
    isTrainer: z.boolean().optional(),
    coachNotes: z.string().max(500, 'Maximum 500 characters')
        .optional().or(z.literal('')),
    goal: z.enum(['strength', 'hypertrophy', 'general']),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
});
```
**Step**: 1 - Goal Selection
**Required Fields**: `goal`, `experienceLevel`

### equipmentStepSchema
```typescript
export const equipmentStepSchema = z.object({
    equipment: z.array(z.string()).min(1, 'Select at least one equipment option'),
});
```
**Step**: 2 - Equipment Selection
**Validation**: At least one item required

### anatomyStepSchema
```typescript
export const anatomyStepSchema = z.object({
    targetMuscles: z.array(z.enum([
        'chest', 'front_deltoid', 'side_deltoid', 'rear_deltoid', 'biceps',
        'triceps', 'forearms', 'abs', 'obliques', 'quads', 'hip_flexors',
        'adductors', 'traps', 'upper_back', 'lats', 'lower_back', 'glutes',
        'hamstrings', 'calves', 'neck'
    ])).min(1, 'Select at least one muscle group'),
});
```
**Step**: 3 - Target Muscles
**Validation**: At least one muscle group required

### constraintsStepSchema
```typescript
export const constraintsStepSchema = z.object({
    constraints: z.array(z.string()).default([]),
});
```
**Step**: 4 - Constraints/Limitations
**Validation**: Optional, defaults to empty array

### scheduleStepSchema
```typescript
export const scheduleStepSchema = z.object({
    daysPerWeek: z.number().int().min(2, 'Minimum 2 days').max(6, 'Maximum 6 days'),
    sessionDuration: z.number().int()
        .min(30, 'Minimum 30 minutes').max(120, 'Maximum 120 minutes'),
});
```
**Step**: 5 - Schedule
**Constraints**: 2-6 days/week, 30-120 minutes/session

---

## Server Schemas

**Source**: [`server/src/index.ts`](../server/src/index.ts)

Server-side schemas include `.strict()` to reject unknown fields for security.

### ExerciseSetSchema
```typescript
const ExerciseSetSchema = z.object({
    reps: z.number().int().min(0).max(1000),
    weight: z.number().min(0).max(10000).optional(),
    rir: z.number().int().min(0).max(10).optional(),
    completed: z.boolean().optional(),
}).strict();
```

### WorkoutExerciseSchema
```typescript
const WorkoutExerciseSchema = z.object({
    exerciseId: z.string().min(1).max(100),
    name: z.string().min(1).max(200),
    sets: z.array(ExerciseSetSchema).max(20),
    notes: z.string().max(1000).optional(),
    muscleGroup: z.string().max(50).optional(),
}).strict();
```

### Server WorkoutDaySchema
```typescript
const WorkoutDaySchema = z.object({
    name: z.string().min(1).max(100),
    exercises: z.array(WorkoutExerciseSchema).max(50),
    notes: z.string().max(2000).optional(),
    dayIndex: z.number().int().min(0).max(6).optional(),
}).strict();
```

### Server WeeklyVolumeSchema
```typescript
const WeeklyVolumeSchema = z.object({
    muscleGroup: z.string().min(1).max(50),
    sets: z.number().int().min(0).max(100),
    targetSets: z.number().int().min(0).max(100).optional(),
}).strict();
```

### RirProgressionSchema
```typescript
const RirProgressionSchema = z.object({
    week: z.number().int().min(1).max(52),
    targetRir: z.number().int().min(0).max(10),
}).strict();
```

### PlanNoteSchema
```typescript
const PlanNoteSchema = z.object({
    id: z.string().max(100).optional(),
    content: z.string().max(5000),
    createdAt: z.string().datetime().optional(),
}).strict();
```

### SelectionsSchema
```typescript
const SelectionsSchema = z.object({
    goal: z.string().max(50).optional(),
    experienceLevel: z.string().max(50).optional(),
    equipment: z.array(z.string().max(50)).max(20).optional(),
    daysPerWeek: z.number().int().min(1).max(7).optional(),
    sessionDuration: z.number().int().min(15).max(240).optional(),
    muscleTargets: z.record(z.number().min(0).max(100)).optional(),
}).passthrough(); // Allows additional fields for flexibility
```

### CreatePlanSchema
```typescript
const CreatePlanSchema = z.object({
    id: z.string().uuid().optional(),
    selections: SelectionsSchema,
    splitType: z.string().min(1).max(50),
    workoutDays: z.array(WorkoutDaySchema).min(1).max(7),
    weeklyVolume: z.array(WeeklyVolumeSchema).max(50).default([]),
    rirProgression: z.array(RirProgressionSchema).max(52).default([]),
    notes: z.array(PlanNoteSchema).max(100).default([]),
    userId: z.string().uuid().optional(), // Overridden by auth token
});
```
**Endpoint**: `POST /plans`

### UpdatePlanSchema
```typescript
const UpdatePlanSchema = z.object({
    workoutDays: z.array(WorkoutDaySchema).min(1).max(7).optional(),
    notes: z.array(PlanNoteSchema).max(100).optional(),
});
```
**Endpoint**: `PATCH /plans/:id`

---

## Type Inference Patterns

### Inferring Types from Schemas

```typescript
import { z } from 'zod';
import { GoalSchema, PlanSchema } from '@/lib/validation/fitness';

// Infer input type (before transforms)
type PlanInput = z.input<typeof PlanSchema>;

// Infer output type (after transforms)
type Plan = z.infer<typeof PlanSchema>;
// or
type Plan = z.output<typeof PlanSchema>;

// For enums, get the union type
type Goal = z.infer<typeof GoalSchema>; // 'strength' | 'hypertrophy' | 'general'
```

### Creating Partial Schemas

```typescript
// Make all fields optional
const PartialPlanSchema = PlanSchema.partial();

// Make specific fields optional
const PlanWithOptionalNotes = PlanSchema.extend({
    notes: z.array(z.string()).optional(),
});

// Pick specific fields
const PlanSummarySchema = PlanSchema.pick({
    id: true,
    createdAt: true,
    splitType: true,
});
```

### Extending Schemas

```typescript
// Extend with new fields
const PlanWithMetadataSchema = PlanSchema.extend({
    lastModifiedBy: z.string(),
    version: z.number(),
});

// Merge two schemas
const CombinedSchema = SchemaA.merge(SchemaB);
```

---

## Schema Composition

### Array Schemas with Constraints

```typescript
// Fixed length array
const WeeklyWorkoutsSchema = z.array(WorkoutDaySchema).length(7);

// Non-empty array
const NonEmptyExercisesSchema = z.array(ExerciseSchema).nonempty();

// Bounded array
const LimitedNotesSchema = z.array(z.string()).min(0).max(10);
```

### Discriminated Unions

```typescript
const ExerciseTypeSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('compound'),
        primaryMuscles: z.array(MuscleGroupSchema).min(2),
    }),
    z.object({
        type: z.literal('isolation'),
        primaryMuscles: z.array(MuscleGroupSchema).length(1),
    }),
]);
```

### Refinements

```typescript
const ValidPlanSchema = PlanSchema.refine(
    (plan) => plan.workoutDays.length >= plan.selections.daysPerWeek,
    { message: 'Plan must have enough workout days for selected frequency' }
);
```

---

## Validation Helpers

**Source**: [`src/lib/validation/fitness.ts`](../src/lib/validation/fitness.ts)

```typescript
// Safe validation (doesn't throw)
export function validateWizardSelections(data: unknown) {
    return WizardSelectionsSchema.safeParse(data);
}

export function validatePlan(data: unknown) {
    return PlanSchema.safeParse(data);
}
```

### Usage Pattern

```typescript
const result = validatePlan(unknownData);

if (result.success) {
    // result.data is fully typed as Plan
    console.log(result.data.id);
} else {
    // result.error contains ZodError with detailed issues
    console.error(result.error.format());
}
```

### Error Formatting

```typescript
// Flat error messages
result.error.flatten();
// { formErrors: [], fieldErrors: { goal: ['Required'] } }

// Nested format (good for forms)
result.error.format();
// { goal: { _errors: ['Required'] } }
```

---

## Best Practices

### 1. Always Use `.safeParse()` at Boundaries

```typescript
// API endpoint
app.post('/plans', (req, res) => {
    const result = CreatePlanSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
    }
    // result.data is safe to use
});
```

### 2. Use `.strict()` on Server Schemas

```typescript
// Rejects any extra fields
const StrictSchema = z.object({
    name: z.string(),
}).strict();

StrictSchema.parse({ name: 'Test', extra: 'field' }); // Throws!
```

### 3. Provide Descriptive Error Messages

```typescript
z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters');
```

### 4. Use `.default()` for Optional Arrays

```typescript
constraints: z.array(ConstraintSchema).default([]),
```

### 5. Use `.coerce` for Date Parsing

```typescript
createdAt: z.coerce.date(), // Accepts string or Date
```

### 6. Export Both Schema and Type

```typescript
export const PlanSchema = z.object({ /* ... */ });
export type Plan = z.infer<typeof PlanSchema>;
export type PlanInput = z.input<typeof PlanSchema>;
```

### 7. Use Enums for Fixed Options

```typescript
// Prefer this
const GoalSchema = z.enum(['strength', 'hypertrophy', 'general']);

// Over this (less type-safe)
const GoalSchema = z.string().refine(v => ['strength', 'hypertrophy', 'general'].includes(v));
```

---

## Quick Reference

| Schema | Location | Purpose |
|--------|----------|---------|
| `GoalSchema` | fitness.ts | Training goal enum |
| `ExperienceLevelSchema` | fitness.ts | User experience enum |
| `EquipmentSchema` | fitness.ts | Available equipment enum |
| `MuscleGroupSchema` | fitness.ts | Target muscles enum |
| `ConstraintSchema` | fitness.ts | Physical limitations enum |
| `MovementPatternSchema` | fitness.ts | Exercise pattern enum |
| `SplitTypeSchema` | fitness.ts | Workout split enum |
| `WizardSelectionsSchema` | fitness.ts | Complete wizard input |
| `ExerciseSchema` | fitness.ts | Exercise database entry |
| `ExercisePrescriptionSchema` | fitness.ts | Exercise with parameters |
| `WorkoutDaySchema` | fitness.ts | Single workout session |
| `PlanSchema` | fitness.ts | Complete workout plan |
| `goalStepSchema` | useWizardForm.ts | Step 1 form validation |
| `equipmentStepSchema` | useWizardForm.ts | Step 2 form validation |
| `anatomyStepSchema` | useWizardForm.ts | Step 3 form validation |
| `constraintsStepSchema` | useWizardForm.ts | Step 4 form validation |
| `scheduleStepSchema` | useWizardForm.ts | Step 5 form validation |
| `CreatePlanSchema` | index.ts | Server POST validation |
| `UpdatePlanSchema` | index.ts | Server PATCH validation |

---

*Last Updated: 2026-01-27*
