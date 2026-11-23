import type { Plan } from '@/types/fitness';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  deletePlanSupabase,
  getPlanSupabase,
  listPlansSupabase,
  upsertPlanSupabase,
} from '@/lib/plans/supabasePlansRepo';

// Supabase is the only remote for plans (the Express API was retired on Lane F Day 5,
// roadmap 1.7). Lane E Day 7 moves plans onto the sync engine (src/lib/sync).

export function isPlansRemoteEnabled(): boolean {
  return isSupabaseConfigured();
}

/**
 * `userId` is kept so callers don't change; Supabase RLS (auth.uid() = user_id)
 * and supabase.auth.getUser() identify the user, so it isn't forwarded.
 */
export async function savePlanRemote(plan: Plan, userId?: string): Promise<Plan> {
  return upsertPlanSupabase(plan);
}

export async function getPlansRemote(userId?: string): Promise<Plan[]> {
  return listPlansSupabase();
}

export async function getPlanRemote(id: string): Promise<Plan> {
  return getPlanSupabase(id);
}

export async function deletePlanRemote(id: string): Promise<void> {
  return deletePlanSupabase(id);
}
