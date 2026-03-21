import { getPlansRemote, savePlanRemote } from '@/lib/plans/plansClient';
import type { Plan } from '@/types/fitness';

const MAX_PLAN_HISTORY = 20;

export function upsertPlanHistory(planHistory: Plan[], plan: Plan) {
  return [plan, ...planHistory.filter((existingPlan) => existingPlan.id !== plan.id)].slice(
    0,
    MAX_PLAN_HISTORY,
  );
}

export function removePlanFromHistory(planHistory: Plan[], planId: string) {
  return planHistory.filter((plan) => plan.id !== planId);
}

export function mergePlanHistory(remotePlans: Plan[], localPlans: Plan[]) {
  return [
    ...remotePlans,
    ...localPlans.filter(
      (localPlan) => !remotePlans.some((remotePlan) => remotePlan.id === localPlan.id),
    ),
  ].slice(0, MAX_PLAN_HISTORY);
}

export function resolveCurrentPlan(currentPlan: Plan | null, mergedPlanHistory: Plan[]) {
  if (!currentPlan) {
    return mergedPlanHistory[0] ?? null;
  }

  return mergedPlanHistory.find((plan) => plan.id === currentPlan.id) ?? currentPlan;
}

export async function syncPlanStateWithRemote(userId: string, localPlans: Plan[], currentPlan: Plan | null) {
  const remotePlans = await getPlansRemote(userId);
  const remoteIds = new Set(remotePlans.map((plan) => plan.id));

  const pendingLocalPlans = localPlans.filter((localPlan) => !remoteIds.has(localPlan.id));
  let failedMigrationCount = 0;

  if (pendingLocalPlans.length > 0) {
    const results = await Promise.allSettled(
      pendingLocalPlans.map((localPlan) => savePlanRemote(localPlan, userId)),
    );
    failedMigrationCount = results.filter((result) => result.status === 'rejected').length;
  }

  const refreshedRemotePlans =
    pendingLocalPlans.length > 0 ? await getPlansRemote(userId) : remotePlans;
  const mergedPlanHistory = mergePlanHistory(refreshedRemotePlans, localPlans);

  return {
    mergedPlanHistory,
    nextCurrentPlan: resolveCurrentPlan(currentPlan, mergedPlanHistory),
    failedMigrationCount,
  };
}
