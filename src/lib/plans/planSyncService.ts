/**
 * Plan history helpers. Cloud sync for plans goes through the sync engine
 * (`plansCollection` in src/lib/sync/collections/training.ts); the old plan-only
 * sync (syncPlanStateWithRemote, mergePlanHistory, resolveCurrentPlan) is gone.
 */
import type { Plan } from '@/types/fitness';

export const MAX_PLAN_HISTORY = 20;

export function upsertPlanHistory(planHistory: Plan[], plan: Plan) {
  return [plan, ...planHistory.filter((existingPlan) => existingPlan.id !== plan.id)].slice(
    0,
    MAX_PLAN_HISTORY,
  );
}

export function removePlanFromHistory(planHistory: Plan[], planId: string) {
  return planHistory.filter((plan) => plan.id !== planId);
}
