import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plan, Exercise, ExercisePrescription } from '@/types/fitness';
import { savePlan, deletePlanApi, getPlans } from '@/lib/apiClient';

interface PlanState {
  currentPlan: Plan | null;
  planHistory: Plan[];

  // Actions
  setCurrentPlan: (plan: Plan) => void;
  clearCurrentPlan: () => void;
  savePlanToHistory: (plan: Plan) => void;
  deletePlanFromHistory: (planId: string) => void;
  getPlanById: (planId: string) => Plan | undefined;
  syncWithBackend: () => Promise<void>;

  // Edit actions
  updateExercisePrescription: (
    dayIndex: number,
    exerciseIndex: number,
    updates: Partial<Pick<ExercisePrescription, 'sets' | 'reps' | 'rir' | 'restSeconds' | 'notes'>>
  ) => void;
  swapExercise: (dayIndex: number, exerciseIndex: number, newExercise: Exercise) => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      planHistory: [],

      setCurrentPlan: (plan) => set({ currentPlan: plan }),

      clearCurrentPlan: () => set({ currentPlan: null }),

      savePlanToHistory: (plan) => {
        set((state) => ({
          planHistory: [plan, ...state.planHistory.filter(p => p.id !== plan.id)].slice(0, 20)
        }));
        // Sync with backend
        savePlan(plan).catch(err => console.error('Failed to save plan to backend', err));
      },

      deletePlanFromHistory: (planId) => {
        set((state) => ({
          planHistory: state.planHistory.filter(p => p.id !== planId),
          currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan,
        }));
        // Sync with backend
        deletePlanApi(planId).catch(err => console.error('Failed to delete plan from backend', err));
      },

      getPlanById: (planId) => {
        const { currentPlan, planHistory } = get();
        if (currentPlan?.id === planId) return currentPlan;
        return planHistory.find(p => p.id === planId);
      },

      syncWithBackend: async () => {
        const result = await getPlans();
        if (result.data) {
          set({ planHistory: result.data });
        }
      },

      // Update sets, reps, rir, rest for an exercise in the current plan
      updateExercisePrescription: (dayIndex, exerciseIndex, updates) => {
        set((state) => {
          if (!state.currentPlan) return state;

          const newWorkoutDays = state.currentPlan.workoutDays.map((day, dIdx) => {
            if (dIdx !== dayIndex) return day;

            const newExercises = day.exercises.map((ex, eIdx) => {
              if (eIdx !== exerciseIndex) return ex;
              return { ...ex, ...updates };
            });

            return { ...day, exercises: newExercises };
          });

          const updatedPlan = { ...state.currentPlan, workoutDays: newWorkoutDays };

          // Autosave changes
          savePlan(updatedPlan).catch(console.error);

          return { currentPlan: updatedPlan };
        });
      },

      // Swap an exercise with a new one, keeping the same prescription
      swapExercise: (dayIndex, exerciseIndex, newExercise) => {
        set((state) => {
          if (!state.currentPlan) return state;

          const newWorkoutDays = state.currentPlan.workoutDays.map((day, dIdx) => {
            if (dIdx !== dayIndex) return day;

            const newExercises = day.exercises.map((ex, eIdx) => {
              if (eIdx !== exerciseIndex) return ex;
              return { ...ex, exercise: newExercise };
            });

            return { ...day, exercises: newExercises };
          });

          const updatedPlan = { ...state.currentPlan, workoutDays: newWorkoutDays };

          // Autosave changes
          savePlan(updatedPlan).catch(console.error);

          return { currentPlan: updatedPlan };
        });
      },
    }),
    {
      name: 'fitwizard-plans',
    }
  )
);
