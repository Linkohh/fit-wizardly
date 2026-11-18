// ============================================
// delete-account: request handler (contract #4, docs/project/CONTRACTS.md)
// ============================================
// POST /functions/v1/delete-account
//   Authorization: Bearer <signed-in user's access token>
//   apikey: <anon key>
//
// 204  account deleted; every user row goes with it (ON DELETE CASCADE / SET NULL
//      from auth.users, migrations 007 and 008)
// 401  {"error":"Not authenticated"}
// 405  {"error":"Method not allowed"}   (anything but POST / OPTIONS)
// 500  {"error":"Deletion failed"}      (details are logged, never returned)
//
// This file has no imports so the Deno test can drive it with a mocked client.
// index.ts wires in the real supabase-js `createClient` and Deno.env.

/** The slice of supabase-js this handler uses. */
export interface AuthUser {
  id: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface SupabaseLikeClient {
  auth: {
    getUser(jwt?: string): Promise<{ data: { user: AuthUser | null }; error: AuthError | null }>;
    admin: {
      deleteUser(id: string): Promise<{ error: AuthError | null }>;
    };
  };
}

export interface ClientOptions {
  global?: { headers?: Record<string, string> };
  auth?: { persistSession?: boolean; autoRefreshToken?: boolean; detectSessionInUrl?: boolean };
}

export type CreateClient = (url: string, key: string, options?: ClientOptions) => SupabaseLikeClient;

export interface HandlerDeps {
  createClient: CreateClient;
  /** Reads a function secret. Supabase provides SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY. */
  getEnv: (name: string) => string | undefined;
  /** Server-side log sink. Defaults to console.error. */
  logError?: (message: string, detail?: unknown) => void;
}

/** Native app origins (Capacitor), always allowed alongside ALLOWED_ORIGINS. */
export const NATIVE_ORIGINS = ['capacitor://localhost', 'https://localhost'] as const;

const ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type';
const ALLOWED_METHODS = 'POST, OPTIONS';

/** Parses the comma-separated ALLOWED_ORIGINS secret and adds the native origins. */
export function parseAllowedOrigins(raw: string | undefined): Set<string> {
  const origins = new Set<string>(NATIVE_ORIGINS);
  for (const entry of (raw ?? '').split(',')) {
    const origin = entry.trim().replace(/\/+$/, '');
    if (origin) origins.add(origin);
  }
  return origins;
}

function corsHeaders(origin: string | null, allowed: Set<string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  // Echo the origin only when it is on the list. A browser on any other origin
  // gets no Access-Control-Allow-Origin and blocks the response.
  if (origin && allowed.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(status: number, body: { error: string }, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/** Extracts the token from "Bearer <token>", or null. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match ? match[1] : null;
}

const NO_SESSION = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

export function createHandler(deps: HandlerDeps): (req: Request) => Promise<Response> {
  const logError = deps.logError ?? ((message: string, detail?: unknown) => console.error(message, detail));

  return async (req: Request): Promise<Response> => {
    const cors = corsHeaders(req.headers.get('Origin'), parseAllowedOrigins(deps.getEnv('ALLOWED_ORIGINS')));

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (req.method !== 'POST') {
      return json(405, { error: 'Method not allowed' }, { ...cors, Allow: ALLOWED_METHODS });
    }

    const authHeader = req.headers.get('Authorization');
    const token = bearerToken(authHeader);
    if (!authHeader || !token) {
      return json(401, { error: 'Not authenticated' }, cors);
    }

    try {
      const url = deps.getEnv('SUPABASE_URL');
      const anonKey = deps.getEnv('SUPABASE_ANON_KEY');
      const serviceRoleKey = deps.getEnv('SUPABASE_SERVICE_ROLE_KEY');
      if (!url || !anonKey || !serviceRoleKey) {
        logError('delete-account: missing SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
        return json(500, { error: 'Deletion failed' }, cors);
      }

      // 1. Who is calling? Anon key plus the caller's own Authorization header,
      //    so this client can do nothing the user couldn't do themselves.
      const userClient = deps.createClient(url, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: NO_SESSION,
      });
      const { data, error: userError } = await userClient.auth.getUser(token);
      if (userError || !data?.user) {
        // 4xx from GoTrue = bad, expired or revoked token. Anything else
        // (5xx, network) is our problem, not the caller's.
        if (!userError || (userError.status !== undefined && userError.status < 500)) {
          return json(401, { error: 'Not authenticated' }, cors);
        }
        logError('delete-account: getUser failed', { message: userError.message, status: userError.status });
        return json(500, { error: 'Deletion failed' }, cors);
      }

      // 2. Delete with the service role. The key never leaves this function.
      //    The user id comes from the verified token, never from the request body.
      const adminClient = deps.createClient(url, serviceRoleKey, { auth: NO_SESSION });
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id);
      if (deleteError) {
        logError('delete-account: deleteUser failed', {
          userId: data.user.id,
          message: deleteError.message,
          status: deleteError.status,
        });
        return json(500, { error: 'Deletion failed' }, cors);
      }

      return new Response(null, { status: 204, headers: cors });
    } catch (error) {
      logError('delete-account: unexpected error', error instanceof Error ? error.message : String(error));
      return json(500, { error: 'Deletion failed' }, cors);
    }
  };
}
