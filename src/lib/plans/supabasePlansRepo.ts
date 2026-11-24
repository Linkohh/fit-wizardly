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

export function rowToPlan(row: PlansRow): Plan {
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

export function planToRow(plan: Plan, userId: string): Omit<PlansRow, 'created_at' | 'updated_at'> {
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
