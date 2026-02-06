import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Plan } from '@/types/fitness';
import type { Database } from '@/types/supabase';

type PlansRow = Database['public']['Tables']['plans']['Row'];

function normalizePlanDates(plan: unknown, createdAtFallback?: string): Plan {
  if (!plan || typeof plan !== 'object') return plan as Plan;

  const createdAt = (plan as { createdAt?: unknown }).createdAt ?? createdAtFallback;
  if (createdAt instanceof Date) return plan as Plan;
  if (typeof createdAt !== 'string') return plan as Plan;

  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) return plan as Plan;

  return { ...(plan as object), createdAt: createdAtDate } as Plan;
}

function rowToPlan(row: PlansRow): Plan {
  const planPayload = row.plan;
  const plan = normalizePlanDates(planPayload, row.created_at);

  return {
    ...plan,
    id: row.id,
    userId: row.user_id,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
  };
}

function planToRow(plan: Plan, userId: string): Omit<PlansRow, 'created_at' | 'updated_at'> {
  const createdAt = (plan as { createdAt?: unknown }).createdAt;
  const planDto = {
    ...(plan as object),
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
  };

  return {
    user_id: userId,
    id: plan.id,
    plan: planDto as unknown as Database['public']['Tables']['plans']['Row']['plan'],
    schema_version: (plan as { schemaVersion?: number }).schemaVersion ?? 1,
  };
}

export async function upsertPlanSupabase(plan: Plan): Promise<Plan> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const row = planToRow(plan, user.id);

  const { data, error } = await supabase
    .from('plans')
    .upsert(row, { onConflict: 'user_id,id' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToPlan(data);
}

export async function listPlansSupabase(limit = 20): Promise<Plan[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToPlan);
}

export async function getPlanSupabase(id: string): Promise<Plan> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Plan not found');
  return rowToPlan(data);
}

export async function deletePlanSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
