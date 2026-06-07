import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './proxy-wger';

function createResponse() {
  return {
    headers: new Map<string, string>(),
    statusCode: 200,
    body: undefined as unknown,
    setHeader: vi.fn((key: string, value: string) => {
      response.headers.set(key, value);
    }),
    status: vi.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
    end: vi.fn(),
  };
}

let response: ReturnType<typeof createResponse>;

describe('/api/proxy-wger', () => {
  beforeEach(() => {
    response = createResponse();
    vi.restoreAllMocks();
  });

  it('fetches allowed wger URLs without following redirects automatically', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ results: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await handler(
      {
        method: 'GET',
        query: { url: 'https://wger.de/api/v2/exerciseinfo/' },
      } as never,
      response as never
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://wger.de/api/v2/exerciseinfo/',
      expect.objectContaining({
        redirect: 'manual',
      })
    );
    expect(response.status).toHaveBeenCalledWith(200);
  });
});
