type PlansRow = {
  user_id: string;
  id: string;
  plan: unknown;
  schema_version: number;
  created_at: string;
  updated_at: string;
};

function buildUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}${path}`;
}

function toApiPlan(row: PlansRow) {
  const planPayload = row.plan && typeof row.plan === 'object' ? row.plan : {};
  return {
    ...(planPayload as object),
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
  };
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body?.message && typeof body.message === 'string') return body.message;
    if (body?.error && typeof body.error === 'string') return body.error;
    return `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function getAuthHeaders(anonKey: string, userToken: string): HeadersInit {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${userToken}`,
    'Content-Type': 'application/json',
  };
}

export async function upsertPlanForUser(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userToken: string;
  userId: string;
  planId: string;
  plan: unknown;
  schemaVersion: number;
}): Promise<ReturnType<typeof toApiPlan>> {
  const url = buildUrl(params.supabaseUrl, `/rest/v1/plans?on_conflict=user_id,id`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(params.supabaseAnonKey, params.userToken),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      user_id: params.userId,
      id: params.planId,
      plan: params.plan,
      schema_version: params.schemaVersion,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as PlansRow[] | PlansRow;
  const row = Array.isArray(data) ? data[0] : data;
  return toApiPlan(row);
}

export async function listPlansForUser(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userToken: string;
  limit?: number;
}): Promise<ReturnType<typeof toApiPlan>[]> {
  const limit = Math.max(1, Math.min(100, params.limit ?? 20));
  const url = buildUrl(
    params.supabaseUrl,
    `/rest/v1/plans?select=user_id,id,plan,schema_version,created_at,updated_at&order=updated_at.desc&limit=${limit}`
  );

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(params.supabaseAnonKey, params.userToken),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as PlansRow[];
  return (data ?? []).map(toApiPlan);
}

export async function getPlanForUser(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userToken: string;
  planId: string;
}): Promise<ReturnType<typeof toApiPlan> | null> {
  const url = buildUrl(
    params.supabaseUrl,
    `/rest/v1/plans?select=user_id,id,plan,schema_version,created_at,updated_at&id=eq.${encodeURIComponent(params.planId)}&limit=1`
  );

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(params.supabaseAnonKey, params.userToken),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as PlansRow[];
  if (!data || data.length === 0) return null;
  return toApiPlan(data[0]);
}

export async function deletePlanForUser(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userToken: string;
  planId: string;
}): Promise<boolean> {
  const url = buildUrl(params.supabaseUrl, `/rest/v1/plans?id=eq.${encodeURIComponent(params.planId)}`);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(params.supabaseAnonKey, params.userToken),
      Prefer: 'return=representation',
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  // PostgREST returns deleted rows if return=representation; otherwise empty array.
  const data = (await response.json().catch(() => [])) as PlansRow[] | unknown;
  return Array.isArray(data) ? data.length > 0 : true;
}

