import type { Plan } from '@/types/fitness';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  deletePlanApi as deletePlanApiClient,
  getPlan as getPlanApiClient,
  getPlans as getPlansApiClient,
  isApiEnabled,
  savePlan as savePlanApiClient,
} from '@/lib/apiClient';
import {
  deletePlanSupabase,
  getPlanSupabase,
  listPlansSupabase,
  upsertPlanSupabase,
} from './supabasePlansRepo';

type PlansProvider = 'auto' | 'api' | 'supabase';

function getPlansProvider(): PlansProvider {
  const raw = (import.meta.env.VITE_PLANS_PROVIDER as string | undefined)?.toLowerCase();
  if (raw === 'api' || raw === 'supabase') return raw;
  return 'auto';
}

function shouldUseSupabase(): boolean {
  const provider = getPlansProvider();
  if (provider === 'supabase') return true;
  if (provider === 'api') return false;
  return isSupabaseConfigured();
}

export function isPlansRemoteEnabled(): boolean {
  return shouldUseSupabase() ? isSupabaseConfigured() : isApiEnabled();
}

export async function savePlanRemote(plan: Plan, userId?: string): Promise<Plan> {
  return shouldUseSupabase()
    ? upsertPlanSupabase(plan)
    : savePlanApiClient(plan, userId);
}

export async function getPlansRemote(userId?: string): Promise<Plan[]> {
  return shouldUseSupabase()
    ? listPlansSupabase()
    : getPlansApiClient(userId);
}

export async function getPlanRemote(id: string): Promise<Plan> {
  return shouldUseSupabase()
    ? getPlanSupabase(id)
    : getPlanApiClient(id);
}

export async function deletePlanRemote(id: string): Promise<void> {
  return shouldUseSupabase()
    ? deletePlanSupabase(id)
    : deletePlanApiClient(id);
}

