// Deno unit tests for the delete-account handler, with supabase-js mocked.
// Run: deno test supabase/functions/delete-account/   (no network or permissions needed)

import {
  bearerToken,
  createHandler,
  parseAllowedOrigins,
  type AuthError,
  type ClientOptions,
  type HandlerDeps,
  type SupabaseLikeClient,
} from './handler.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, message = 'values differ'): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}: expected ${e}, got ${a}`);
}

const ENV: Record<string, string> = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  ALLOWED_ORIGINS: 'https://fitwizard.example, https://preview.fitwizard.example/',
};

interface MockOptions {
  user?: { id: string } | null;
  getUserError?: AuthError | null;
  deleteError?: AuthError | null;
  throwOnCreate?: boolean;
  env?: Record<string, string | undefined>;
}

interface ClientCall {
  url: string;
  key: string;
  options?: ClientOptions;
}

function setup(opts: MockOptions = {}) {
  const clients: ClientCall[] = [];
  const getUserTokens: (string | undefined)[] = [];
  const deletedIds: string[] = [];
  const logs: unknown[][] = [];
  const env = { ...ENV, ...(opts.env ?? {}) };

  const deps: HandlerDeps = {
    getEnv: (name) => env[name],
    logError: (...args) => {
      logs.push(args);
    },
    createClient: (url, key, options): SupabaseLikeClient => {
      if (opts.throwOnCreate) throw new Error('boom: internal detail');
      clients.push({ url, key, options });
      return {
        auth: {
          getUser: (jwt) => {
            getUserTokens.push(jwt);
            const user = opts.user === undefined ? { id: 'user-123' } : opts.user;
            return Promise.resolve({ data: { user }, error: opts.getUserError ?? null });
          },
          admin: {
            deleteUser: (id) => {
              deletedIds.push(id);
              return Promise.resolve({ error: opts.deleteError ?? null });
            },
          },
        },
      };
    },
  };

  return { handler: createHandler(deps), clients, getUserTokens, deletedIds, logs };
}

function post(headers: Record<string, string> = {}): Request {
  return new Request('https://project.supabase.co/functions/v1/delete-account', {
    method: 'POST',
    headers: { apikey: 'anon-key', ...headers },
  });
}

const AUTH = { Authorization: 'Bearer user-access-token' };

Deno.test('401 without an Authorization header, and no client is created', async () => {
  const { handler, clients, deletedIds } = setup();
  const res = await handler(post());
  assertEquals(res.status, 401);
  assertEquals(await res.json(), { error: 'Not authenticated' });
  assertEquals(clients.length, 0);
  assertEquals(deletedIds.length, 0);
});

Deno.test('401 for a non-Bearer or empty Authorization header', async () => {
  for (const value of ['Basic abc', 'Bearer', 'Bearer   ', 'token']) {
    const { handler, deletedIds } = setup();
    const res = await handler(post({ Authorization: value }));
    assertEquals(res.status, 401, `header "${value}"`);
    assertEquals(deletedIds.length, 0);
  }
});

Deno.test('401 when the token is invalid or expired (GoTrue 4xx)', async () => {
  const { handler, deletedIds } = setup({ user: null, getUserError: { message: 'invalid JWT', status: 403 } });
  const res = await handler(post(AUTH));
  assertEquals(res.status, 401);
  assertEquals(await res.json(), { error: 'Not authenticated' });
  assertEquals(deletedIds.length, 0);
});

Deno.test('401 when getUser returns no user and no error', async () => {
  const { handler, deletedIds } = setup({ user: null });
  const res = await handler(post(AUTH));
  assertEquals(res.status, 401);
  assertEquals(deletedIds.length, 0);
});

Deno.test('204 on success: verifies with anon key + caller header, deletes with service role', async () => {
  const { handler, clients, getUserTokens, deletedIds } = setup();
  const res = await handler(post(AUTH));
  assertEquals(res.status, 204);
  assertEquals(await res.text(), '');

  assertEquals(clients.length, 2);
  assertEquals(clients[0].url, ENV.SUPABASE_URL);
  assertEquals(clients[0].key, 'anon-key', 'user client must use the anon key');
  assertEquals(clients[0].options?.global?.headers?.Authorization, 'Bearer user-access-token');
  assertEquals(getUserTokens, ['user-access-token']);
  assertEquals(clients[1].key, 'service-role-key', 'admin client must use the service role key');
  assertEquals(clients[1].options?.global, undefined, 'admin client must not carry the caller header');
  assertEquals(deletedIds, ['user-123'], 'deletes exactly the verified caller');
});

Deno.test('500 with no details when the admin delete fails; details are logged', async () => {
  const { handler, logs } = setup({ deleteError: { message: 'Database error deleting user', status: 500 } });
  const res = await handler(post(AUTH));
  assertEquals(res.status, 500);
  const body = await res.text();
  assertEquals(JSON.parse(body), { error: 'Deletion failed' });
  assert(!body.includes('Database error'), 'internal detail leaked into the response');
  assert(logs.length === 1, 'the failure is logged server-side');
});

Deno.test('500 when GoTrue itself fails (5xx), not a misleading 401', async () => {
  const { handler, deletedIds } = setup({ user: null, getUserError: { message: 'upstream down', status: 503 } });
  const res = await handler(post(AUTH));
  assertEquals(res.status, 500);
  assertEquals(await res.json(), { error: 'Deletion failed' });
  assertEquals(deletedIds.length, 0);
});

Deno.test('500 with no details when something throws', async () => {
  const { handler, logs } = setup({ throwOnCreate: true });
  const res = await handler(post(AUTH));
  assertEquals(res.status, 500);
  const body = await res.text();
  assertEquals(JSON.parse(body), { error: 'Deletion failed' });
  assert(!body.includes('boom'), 'exception message leaked into the response');
  assertEquals(logs.length, 1);
});

Deno.test('500 when a Supabase secret is missing', async () => {
  const { handler, clients } = setup({ env: { SUPABASE_SERVICE_ROLE_KEY: undefined } });
  const res = await handler(post(AUTH));
  assertEquals(res.status, 500);
  assertEquals(clients.length, 0);
});

Deno.test('405 for methods other than POST and OPTIONS', async () => {
  for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
    const { handler, deletedIds } = setup();
    const res = await handler(
      new Request('https://project.supabase.co/functions/v1/delete-account', { method, headers: AUTH }),
    );
    assertEquals(res.status, 405, method);
    assertEquals(res.headers.get('Allow'), 'POST, OPTIONS');
    assertEquals(deletedIds.length, 0);
  }
});

Deno.test('OPTIONS preflight: 204, echoes an allowed origin, never deletes', async () => {
  for (const origin of ['https://fitwizard.example', 'https://preview.fitwizard.example', 'capacitor://localhost', 'https://localhost']) {
    const { handler, deletedIds } = setup();
    const res = await handler(
      new Request('https://project.supabase.co/functions/v1/delete-account', {
        method: 'OPTIONS',
        headers: { Origin: origin, ...AUTH },
      }),
    );
    assertEquals(res.status, 204, origin);
    assertEquals(res.headers.get('Access-Control-Allow-Origin'), origin);
    assert(res.headers.get('Access-Control-Allow-Headers')?.includes('authorization'), 'allows Authorization');
    assert(res.headers.get('Access-Control-Allow-Methods')?.includes('POST'), 'allows POST');
    assertEquals(deletedIds.length, 0);
  }
});

Deno.test('a disallowed origin gets no Access-Control-Allow-Origin', async () => {
  const { handler } = setup();
  const preflight = await handler(
    new Request('https://project.supabase.co/functions/v1/delete-account', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example' },
    }),
  );
  assertEquals(preflight.headers.get('Access-Control-Allow-Origin'), null);

  const res = await handler(post({ ...AUTH, Origin: 'https://evil.example' }));
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), null);
});

Deno.test('responses to an allowed origin carry CORS headers (204, 401 and 500)', async () => {
  const origin = { Origin: 'capacitor://localhost' };
  const ok = await setup().handler(post({ ...AUTH, ...origin }));
  const unauth = await setup().handler(post(origin));
  const fail = await setup({ deleteError: { message: 'x' } }).handler(post({ ...AUTH, ...origin }));
  for (const res of [ok, unauth, fail]) {
    assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'capacitor://localhost', String(res.status));
  }
});

Deno.test('parseAllowedOrigins trims, drops trailing slashes and always includes native origins', () => {
  assertEquals([...parseAllowedOrigins(undefined)].sort(), ['capacitor://localhost', 'https://localhost']);
  assertEquals(
    [...parseAllowedOrigins(' https://a.example/ ,, https://b.example ')].sort(),
    ['capacitor://localhost', 'https://a.example', 'https://b.example', 'https://localhost'],
  );
});

Deno.test('bearerToken', () => {
  assertEquals(bearerToken('Bearer abc.def'), 'abc.def');
  assertEquals(bearerToken('bearer abc'), 'abc');
  assertEquals(bearerToken('Bearer a b'), null);
  assertEquals(bearerToken(null), null);
});
