import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

async function loadApiClient() {
  vi.doMock('@/lib/supabase', () => ({
    supabase: {
      auth: {
        getSession: mocks.getSession,
      },
    },
  }));

  return import('./apiClient');
}

describe('apiClient auth headers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_USE_API', 'true');
  });

  it('attaches the Supabase bearer token to API requests when present', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    vi.stubGlobal('fetch', fetchMock);
    mocks.getSession.mockResolvedValue({
      data: {
        session: { access_token: 'token-123' },
      },
    });

    const { getPlans } = await loadApiClient();

    await getPlans('user-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/plans?userId=user-1');
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });

  it('sends no Authorization header when there is no active session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    vi.stubGlobal('fetch', fetchMock);
    mocks.getSession.mockResolvedValue({ data: { session: null } });

    const { getPlans } = await loadApiClient();

    await getPlans('user-1');

    const requestOptions = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = requestOptions?.headers as Record<string, string>;
    expect(headers?.Authorization).toBeUndefined();
  });
});

describe('apiClient retry behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubEnv('VITE_USE_API', 'true');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not retry on 4xx client errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    vi.stubGlobal('fetch', fetchMock);
    mocks.getSession.mockResolvedValue({ data: { session: null } });

    const { getPlans } = await loadApiClient();

    await expect(getPlans('user-1')).rejects.toThrow('Not found');
    // fetch should have been called exactly once — no retries on 4xx
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries up to 3 times on 5xx server errors before throwing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    vi.stubGlobal('fetch', fetchMock);
    mocks.getSession.mockResolvedValue({ data: { session: null } });

    const { getPlans } = await loadApiClient();

    // Run the call but advance timers to skip retry delays
    const callPromise = getPlans('user-1').catch(() => {});
    await vi.runAllTimersAsync();
    await callPromise;

    // 1 initial attempt + 3 retries = 4 total calls
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
