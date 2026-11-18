import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createUserDataStorage } from '@/lib/storage/appStorage';
import { hydrationTracking } from '@/lib/storage/hydration';
import { isRecord, sanitizeList } from '@/lib/storage/sanitize';
import type { Equipment, Exercise, MuscleGroup } from '@/types/fitness';

export interface CreateCustomExerciseInput {
    name: string;
    primaryMuscles: MuscleGroup[];
    secondaryMuscles?: MuscleGroup[];
    equipment: Equipment[];
    cues: string[];
    description?: string;
}

interface CustomExerciseState {
    customExercises: Exercise[];
    addCustomExercise: (input: CreateCustomExerciseInput) => Exercise;
    updateCustomExercise: (id: string, updates: Partial<CreateCustomExerciseInput>) => void;
    deleteCustomExercise: (id: string) => void;
}

function createExerciseId(name: string) {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return `custom_${slug}_${crypto.randomUUID().slice(0, 8)}`;
}

export const CUSTOM_EXERCISES_STORE_NAME = 'fitwizard-custom-exercises';

type PersistedCustomExerciseState = Pick<CustomExerciseState, 'customExercises'>;

export function sanitizeCustomExercise(value: unknown): Exercise | null {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
        return null;
    }
    return value as unknown as Exercise;
}

export const useCustomExerciseStore = create<CustomExerciseState>()(
    persist<CustomExerciseState, [], [], PersistedCustomExerciseState>(
        (set) => ({
            customExercises: [],

            addCustomExercise: (input) => {
                const exercise: Exercise = {
                    id: createExerciseId(input.name),
                    name: input.name.trim(),
                    primaryMuscles: input.primaryMuscles,
                    secondaryMuscles: input.secondaryMuscles ?? [],
                    equipment: input.equipment,
                    patterns: ['isolation'],
                    contraindications: [],
                    cues: input.cues,
                    description: input.description?.trim() || 'Custom exercise created by user.',
                    category: 'strength',
                    difficulty: 'Intermediate',
                };

                set((state) => ({
                    customExercises: [exercise, ...state.customExercises],
                }));

                return exercise;
            },

            updateCustomExercise: (id, updates) =>
                set((state) => ({
                    customExercises: state.customExercises.map((exercise) => {
                        if (exercise.id !== id) return exercise;
                        return {
                            ...exercise,
                            name: updates.name?.trim() ?? exercise.name,
                            primaryMuscles: updates.primaryMuscles ?? exercise.primaryMuscles,
                            secondaryMuscles: updates.secondaryMuscles ?? exercise.secondaryMuscles,
                            equipment: updates.equipment ?? exercise.equipment,
                            cues: updates.cues ?? exercise.cues,
                            description: updates.description ?? exercise.description,
                        };
                    }),
                })),

            deleteCustomExercise: (id) =>
                set((state) => ({
                    customExercises: state.customExercises.filter((exercise) => exercise.id !== id),
                })),
        }),
        {
            name: CUSTOM_EXERCISES_STORE_NAME,
            version: 1,
            storage: createUserDataStorage<PersistedCustomExerciseState>(),
            partialize: (state) => ({ customExercises: state.customExercises }),
            migrate: (persistedState) => persistedState as PersistedCustomExerciseState,
            merge: (persistedState, currentState) => ({
                ...currentState,
                customExercises: sanitizeList(
                    isRecord(persistedState) ? persistedState.customExercises : undefined,
                    sanitizeCustomExercise,
                ),
            }),
            ...hydrationTracking(CUSTOM_EXERCISES_STORE_NAME),
        }
    )
);
