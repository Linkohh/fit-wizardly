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
});
