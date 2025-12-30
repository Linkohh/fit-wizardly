import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plan } from '@/types/fitness';

interface PlanState {
  currentPlan: Plan | null;
  planHistory: Plan[];
  
  // Actions
  setCurrentPlan: (plan: Plan) => void;
  clearCurrentPlan: () => void;
  savePlanToHistory: (plan: Plan) => void;
  deletePlanFromHistory: (planId: string) => void;
  getPlanById: (planId: string) => Plan | undefined;
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
    }),
    {
      name: 'fitwizard-plans',
    }
  )
);
