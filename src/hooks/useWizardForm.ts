import { useEffect, useCallback } from 'react';
import { useForm, UseFormReturn, DefaultValues, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardStore } from '@/stores/wizardStore';

/**
 * Hook that bridges React Hook Form with the Zustand wizard store.
 *
 * Features:
 * - Initializes form with values from Zustand store
 * - Syncs form changes back to Zustand on blur/change
 * - Validates against Zod schema
 * - Provides step validation status
 * - Spreads all UseFormReturn properties for direct access
 *
 * Usage:
 * ```tsx
 * const { control, formState: { errors }, watch, isStepValid } = useWizardForm({
 *   schema: goalStepSchema,
 *   defaultValues: {
 *     firstName: selections.firstName,
 *     goal: selections.goal,
 *     experienceLevel: selections.experienceLevel,
 *   },
 *   onSync: (data) => {
 *     setFirstName(data.firstName);
 *     setGoal(data.goal);
 *     setExperienceLevel(data.experienceLevel);
 *   },
 * });
 * ```
 */

export interface UseWizardFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  onSync?: (data: T) => void;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

export interface UseWizardFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  syncToStore: () => void;
  isStepValid: boolean;
  errorMessages: Record<string, string | undefined>;
}

export function useWizardForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSync,
  mode = 'onBlur',
}: UseWizardFormOptions<T>): UseWizardFormReturn<T> {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  });

  const { watch, formState: { isValid, isDirty, errors } } = form;

  // Sync form values to Zustand store
  const syncToStore = useCallback(() => {
    const values = watch();
    if (onSync) {
      onSync(values as T);
    }
  }, [watch, onSync]);

  // Auto-sync on any value change (including setValue calls)
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // Sync on any change - setValue doesn't emit 'change' type, so we check for any update
      if (name && onSync) {
        // Validate before syncing
        const result = schema.safeParse(value);
        if (result.success) {
          onSync(result.data);
        } else {
          // Still sync partial data for UX, but validation will catch errors
          onSync(value as T);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onSync, schema]);

  // Convert errors to simple object for easy access
  const errorMessagesMap: Record<string, string | undefined> = {};
  Object.keys(errors).forEach((key) => {
    const error = errors[key as keyof typeof errors];
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessagesMap[key] = error.message as string;
    }
  });

  return {
    ...form,
    syncToStore,
    isStepValid: isValid,
    errorMessages: errorMessagesMap,
  };
}

// Step-specific schemas for reuse
export const goalStepSchema = z.object({
  firstName: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
  lastName: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
  personalGoalNote: z.string().max(60, 'Maximum 60 characters').optional().or(z.literal('')),
  isTrainer: z.boolean().optional(),
  coachNotes: z.string().max(500, 'Maximum 500 characters').optional().or(z.literal('')),
  goal: z.enum(['strength', 'hypertrophy', 'general']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
});

export const equipmentStepSchema = z.object({
  equipment: z.array(z.string()).min(1, 'Select at least one equipment option'),
});

export const anatomyStepSchema = z.object({
  targetMuscles: z.array(z.enum([
    'chest', 'front_deltoid', 'side_deltoid', 'rear_deltoid', 'biceps',
    'triceps', 'forearms', 'abs', 'obliques', 'quads', 'hip_flexors',
    'adductors', 'traps', 'upper_back', 'lats', 'lower_back', 'glutes',
    'hamstrings', 'calves', 'neck'
  ])).min(1, 'Select at least one muscle group'),
});

export const constraintsStepSchema = z.object({
  constraints: z.array(z.string()).default([]),
});

export const scheduleStepSchema = z.object({
  daysPerWeek: z.number().int().min(2, 'Minimum 2 days').max(6, 'Maximum 6 days'),
  sessionDuration: z.number().int().min(30, 'Minimum 30 minutes').max(120, 'Maximum 120 minutes'),
});

// Type exports for use in components
export type GoalStepFormValues = z.infer<typeof goalStepSchema>;
export type EquipmentStepFormValues = z.infer<typeof equipmentStepSchema>;
export type AnatomyStepFormValues = z.infer<typeof anatomyStepSchema>;
export type ConstraintsStepFormValues = z.infer<typeof constraintsStepSchema>;
export type ScheduleStepFormValues = z.infer<typeof scheduleStepSchema>;
