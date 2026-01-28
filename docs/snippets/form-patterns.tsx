/**
 * Form Patterns - Reusable form implementations using React Hook Form + Zod
 *
 * This file contains copy-paste-ready patterns for form handling in fit-wizardly.
 * Each pattern is self-contained and can be adapted for specific use cases.
 *
 * Key dependencies:
 * - react-hook-form
 * - @hookform/resolvers/zod
 * - zod
 * - @/components/ui/form (shadcn/ui)
 */

import { useForm, UseFormReturn, DefaultValues, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback, useEffect } from 'react';

// ============================================================================
// PATTERN 1: Basic Form with Zod Validation
// ============================================================================

// Step 1: Define your schema
const basicFormSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().int().min(13, 'Must be at least 13').max(120),
});

// Step 2: Infer the type
type BasicFormValues = z.infer<typeof basicFormSchema>;

// Step 3: Create the form component
function BasicFormExample() {
    const form = useForm<BasicFormValues>({
        resolver: zodResolver(basicFormSchema),
        defaultValues: {
            email: '',
            name: '',
            age: 18,
        },
    });

    const onSubmit = (data: BasicFormValues) => {
        console.log('Form submitted:', data);
        // Your submission logic here
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <div>
                <input {...form.register('email')} placeholder="Email" />
                {form.formState.errors.email && (
                    <span>{form.formState.errors.email.message}</span>
                )}
            </div>
            <div>
                <input {...form.register('name')} placeholder="Name" />
                {form.formState.errors.name && (
                    <span>{form.formState.errors.name.message}</span>
                )}
            </div>
            <div>
                <input
                    type="number"
                    {...form.register('age', { valueAsNumber: true })}
                    placeholder="Age"
                />
                {form.formState.errors.age && (
                    <span>{form.formState.errors.age.message}</span>
                )}
            </div>
            <button type="submit" disabled={form.formState.isSubmitting}>
                Submit
            </button>
        </form>
    );
}

// ============================================================================
// PATTERN 2: Wizard Form Hook (from useWizardForm.ts)
// ============================================================================

/**
 * Hook that bridges React Hook Form with a Zustand wizard store.
 *
 * Features:
 * - Initializes form with values from Zustand store
 * - Syncs form changes back to Zustand on change
 * - Validates against Zod schema
 * - Provides step validation status
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
    mode = 'onTouched',
}: UseWizardFormOptions<T>): UseWizardFormReturn<T> {
    const form = useForm<T>({
        resolver: zodResolver(schema),
        defaultValues,
        mode,
    });

    const { watch, formState: { isValid, errors } } = form;

    // Manual sync to store
    const syncToStore = useCallback(() => {
        const values = watch();
        if (onSync) {
            onSync(values as T);
        }
    }, [watch, onSync]);

    // Auto-sync on any value change
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name && onSync) {
                const result = schema.safeParse(value);
                if (result.success) {
                    onSync(result.data);
                } else {
                    // Sync partial data for UX
                    onSync(value as T);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, onSync, schema]);

    // Convert errors to simple object
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

// ============================================================================
// PATTERN 3: Multi-Step Form State Machine
// ============================================================================

interface WizardStep {
    id: string;
    title: string;
    schema: z.ZodSchema<any>;
}

interface WizardState {
    currentStepIndex: number;
    formData: Record<string, any>;
    completedSteps: Set<string>;
}

const WIZARD_STEPS: WizardStep[] = [
    {
        id: 'personal',
        title: 'Personal Info',
        schema: z.object({
            firstName: z.string().min(2),
            lastName: z.string().min(2),
        }),
    },
    {
        id: 'goals',
        title: 'Your Goals',
        schema: z.object({
            goal: z.enum(['strength', 'hypertrophy', 'general']),
            experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
        }),
    },
    {
        id: 'schedule',
        title: 'Schedule',
        schema: z.object({
            daysPerWeek: z.number().int().min(2).max(6),
            sessionDuration: z.number().int().min(30).max(120),
        }),
    },
];

function useMultiStepWizard() {
    const [state, setState] = useState<WizardState>({
        currentStepIndex: 0,
        formData: {},
        completedSteps: new Set(),
    });

    const currentStep = WIZARD_STEPS[state.currentStepIndex];
    const isFirstStep = state.currentStepIndex === 0;
    const isLastStep = state.currentStepIndex === WIZARD_STEPS.length - 1;

    const next = (stepData: Record<string, any>) => {
        // Validate current step
        const result = currentStep.schema.safeParse(stepData);
        if (!result.success) {
            return { success: false, errors: result.error };
        }

        setState((prev) => ({
            ...prev,
            currentStepIndex: Math.min(prev.currentStepIndex + 1, WIZARD_STEPS.length - 1),
            formData: { ...prev.formData, ...stepData },
            completedSteps: new Set([...prev.completedSteps, currentStep.id]),
        }));

        return { success: true };
    };

    const back = () => {
        setState((prev) => ({
            ...prev,
            currentStepIndex: Math.max(prev.currentStepIndex - 1, 0),
        }));
    };

    const goToStep = (stepId: string) => {
        const index = WIZARD_STEPS.findIndex((s) => s.id === stepId);
        if (index !== -1 && state.completedSteps.has(stepId)) {
            setState((prev) => ({ ...prev, currentStepIndex: index }));
        }
    };

    return {
        currentStep,
        currentStepIndex: state.currentStepIndex,
        formData: state.formData,
        completedSteps: state.completedSteps,
        isFirstStep,
        isLastStep,
        totalSteps: WIZARD_STEPS.length,
        next,
        back,
        goToStep,
    };
}

// ============================================================================
// PATTERN 4: Form with Server Action
// ============================================================================

const serverFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().max(500).optional(),
});

type ServerFormValues = z.infer<typeof serverFormSchema>;

function ServerFormExample() {
    const form = useForm<ServerFormValues>({
        resolver: zodResolver(serverFormSchema),
        defaultValues: { title: '', description: '' },
    });

    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (data: ServerFormValues) => {
        setIsPending(true);
        setError(null);

        try {
            const response = await fetch('/api/endpoint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Request failed');
            }

            // Success - reset form or redirect
            form.reset();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            {error && <div className="text-red-500">{error}</div>}

            <input {...form.register('title')} disabled={isPending} />
            {form.formState.errors.title && (
                <span>{form.formState.errors.title.message}</span>
            )}

            <textarea {...form.register('description')} disabled={isPending} />

            <button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
            </button>
        </form>
    );
}

// ============================================================================
// PATTERN 5: Controlled Form with External State
// ============================================================================

interface ControlledFormProps {
    initialValues: { name: string; email: string };
    onSave: (values: { name: string; email: string }) => Promise<void>;
}

const controlledSchema = z.object({
    name: z.string().min(1, 'Name required'),
    email: z.string().email('Invalid email'),
});

function ControlledForm({ initialValues, onSave }: ControlledFormProps) {
    const form = useForm({
        resolver: zodResolver(controlledSchema),
        defaultValues: initialValues,
    });

    // Reset form when external values change
    useEffect(() => {
        form.reset(initialValues);
    }, [initialValues, form]);

    // Track dirty state for save confirmation
    const isDirty = form.formState.isDirty;

    // Warn on unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    return (
        <form onSubmit={form.handleSubmit(onSave)}>
            <input {...form.register('name')} />
            <input {...form.register('email')} />
            <button type="submit" disabled={!isDirty || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
}

// ============================================================================
// STEP-SPECIFIC SCHEMAS (from useWizardForm.ts)
// ============================================================================

// Goal step - personal info and fitness goals
export const goalStepSchema = z.object({
    firstName: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
    lastName: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
    personalGoalNote: z.string().max(60, 'Maximum 60 characters').optional().or(z.literal('')),
    isTrainer: z.boolean().optional(),
    coachNotes: z.string().max(500, 'Maximum 500 characters').optional().or(z.literal('')),
    goal: z.enum(['strength', 'hypertrophy', 'general']),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
});

// Equipment step
export const equipmentStepSchema = z.object({
    equipment: z.array(z.string()).min(1, 'Select at least one equipment option'),
});

// Anatomy step
export const anatomyStepSchema = z.object({
    targetMuscles: z.array(z.enum([
        'chest', 'front_deltoid', 'side_deltoid', 'rear_deltoid', 'biceps',
        'triceps', 'forearms', 'abs', 'obliques', 'quads', 'hip_flexors',
        'adductors', 'traps', 'upper_back', 'lats', 'lower_back', 'glutes',
        'hamstrings', 'calves', 'neck'
    ])).min(1, 'Select at least one muscle group'),
});

// Constraints step
export const constraintsStepSchema = z.object({
    constraints: z.array(z.string()).default([]),
});

// Schedule step
export const scheduleStepSchema = z.object({
    daysPerWeek: z.number().int().min(2, 'Minimum 2 days').max(6, 'Maximum 6 days'),
    sessionDuration: z.number().int().min(30, 'Minimum 30 minutes').max(120, 'Maximum 120 minutes'),
});

// Type exports
export type GoalStepFormValues = z.infer<typeof goalStepSchema>;
export type EquipmentStepFormValues = z.infer<typeof equipmentStepSchema>;
export type AnatomyStepFormValues = z.infer<typeof anatomyStepSchema>;
export type ConstraintsStepFormValues = z.infer<typeof constraintsStepSchema>;
export type ScheduleStepFormValues = z.infer<typeof scheduleStepSchema>;

// Missing import for useState
import { useState } from 'react';
