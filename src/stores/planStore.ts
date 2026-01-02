import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plan, Exercise, ExercisePrescription } from '@/types/fitness';

interface PlanState {
  currentPlan: Plan | null;
  planHistory: Plan[];

  // Actions
  setCurrentPlan: (plan: Plan) => void;
  clearCurrentPlan: () => void;
  savePlanToHistory: (plan: Plan) => void;
  deletePlanFromHistory: (planId: string) => void;
  getPlanById: (planId: string) => Plan | undefined;

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

      savePlanToHistory: (plan) => set((state) => ({
        planHistory: [plan, ...state.planHistory.filter(p => p.id !== plan.id)].slice(0, 20)
      })),

      deletePlanFromHistory: (planId) => set((state) => ({
        planHistory: state.planHistory.filter(p => p.id !== planId),
        currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan,
      })),

      getPlanById: (planId) => {
        const { currentPlan, planHistory } = get();
        if (currentPlan?.id === planId) return currentPlan;
        return planHistory.find(p => p.id === planId);
      },

      // Update sets, reps, rir, rest for an exercise in the current plan
      updateExercisePrescription: (dayIndex, exerciseIndex, updates) => set((state) => {
        if (!state.currentPlan) return state;

        const newWorkoutDays = state.currentPlan.workoutDays.map((day, dIdx) => {
          if (dIdx !== dayIndex) return day;

          const newExercises = day.exercises.map((ex, eIdx) => {
            if (eIdx !== exerciseIndex) return ex;
            return { ...ex, ...updates };
          });

          return { ...day, exercises: newExercises };
        });

        return {
          currentPlan: { ...state.currentPlan, workoutDays: newWorkoutDays }
        };
      }),

      // Swap an exercise with a new one, keeping the same prescription
      swapExercise: (dayIndex, exerciseIndex, newExercise) => set((state) => {
        if (!state.currentPlan) return state;

        const newWorkoutDays = state.currentPlan.workoutDays.map((day, dIdx) => {
          if (dIdx !== dayIndex) return day;

          const newExercises = day.exercises.map((ex, eIdx) => {
            if (eIdx !== exerciseIndex) return ex;
            return { ...ex, exercise: newExercise };
          });

          return { ...day, exercises: newExercises };
        });

        return {
          currentPlan: { ...state.currentPlan, workoutDays: newWorkoutDays }
        };
      }),
    }),
    {
      name: 'fitwizard-plans',
    }
  )
);
