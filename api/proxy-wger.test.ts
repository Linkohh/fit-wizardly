import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './proxy-wger';
import { createTestResponse, uniqueIp, type TestResponse } from './_lib/testResponse';

let response: TestResponse;
let ip: string;

function call(query: Record<string, unknown>, headers: Record<string, string> = {}, method = 'GET') {
  return handler({ method, query, headers: { 'x-real-ip': ip, ...headers } } as never, response as never);
}

describe('/api/proxy-wger', () => {
  beforeEach(() => {
    response = createTestResponse();
    ip = uniqueIp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches allowed wger URLs with redirect: error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ results: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await call({ url: 'https://wger.de/api/v2/exerciseinfo/?limit=100' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://wger.de/api/v2/exerciseinfo/?limit=100',
      expect.objectContaining({ redirect: 'error' })
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ results: [] });
  });

  it.each([
    ['another host', 'https://evil.example/api/v2/'],
    ['plain http', 'http://wger.de/api/v2/exerciseinfo/'],
    ['a look-alike host', 'https://wger.de.evil.example/'],
  ])('refuses %s with a 403 and never fetches', async (_label, url) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await call({ url });

    expect(response.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a missing or malformed url', async () => {
    await call({});
    expect(response.statusCode).toBe(400);

    response = createTestResponse();
    await call({ url: 'not a url' });
    expect(response.statusCode).toBe(400);
  });

  it('returns a generic error, not the upstream message, when fetch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('redirect to http://10.0.0.1/secret')));

    await call({ url: 'https://wger.de/api/v2/exerciseinfo/' });

    expect(response.statusCode).toBe(502);
    expect(response.body).toEqual({ error: 'Upstream request failed' });
  });

  it('passes upstream HTTP errors through by status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await call({ url: 'https://wger.de/api/v2/exerciseinfo/' });

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({ error: 'Wger API returned HTTP 503' });
  });

  it('allows the native app origin and blocks unknown origins', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    await call({ url: 'https://wger.de/api/v2/exerciseinfo/' }, { origin: 'capacitor://localhost' });
    expect(response.statusCode).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('capacitor://localhost');

    response = createTestResponse();
    await call({ url: 'https://wger.de/api/v2/exerciseinfo/' }, { origin: 'https://evil.example' });
    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Origin not allowed', code: 'ORIGIN_NOT_ALLOWED' });
  });

  it('rate limits one IP after 60 requests a minute', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    for (let i = 0; i < 60; i += 1) {
      response = createTestResponse();
      await call({ url: 'https://wger.de/api/v2/exerciseinfo/' });
      expect(response.statusCode).toBe(200);
    }

    response = createTestResponse();
    await call({ url: 'https://wger.de/api/v2/exerciseinfo/' });
    expect(response.statusCode).toBe(429);
    expect(response.headers.get('retry-after')).toBeDefined();
  });
});
