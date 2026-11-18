import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './motivation-quote';
import { createTestResponse, uniqueIp } from './_lib/testResponse';

const mocks = vi.hoisted(() => ({
  handleMotivationQuoteRequest: vi.fn(),
}));

vi.mock('../src/lib/motivation/motivationQuoteEndpoint', () => ({
  handleMotivationQuoteRequest: mocks.handleMotivationQuoteRequest,
}));

describe('/api/motivation-quote Vercel function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to the shared handler, which cannot widen CORS to *', async () => {
    mocks.handleMotivationQuoteRequest.mockImplementation((_req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    });
    const req = { method: 'GET', headers: { origin: 'https://localhost', 'x-real-ip': uniqueIp() } };
    const res = createTestResponse();

    await handler(req as never, res as never);

    expect(mocks.handleMotivationQuoteRequest).toHaveBeenCalledWith(req, expect.anything());
    expect(res.headers.get('access-control-allow-origin')).toBe('https://localhost');
  });

  it('blocks an unknown origin before calling the shared handler', async () => {
    const res = createTestResponse();

    await handler(
      { method: 'GET', headers: { origin: 'https://evil.example', 'x-real-ip': uniqueIp() } } as never,
      res as never
    );

    expect(res.statusCode).toBe(403);
    expect(mocks.handleMotivationQuoteRequest).not.toHaveBeenCalled();
  });

  it('returns 429 after 60 requests from one IP', async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 60; i += 1) {
      await handler({ method: 'GET', headers: { 'x-real-ip': ip } } as never, createTestResponse() as never);
    }
    const res = createTestResponse();

    await handler({ method: 'GET', headers: { 'x-real-ip': ip } } as never, res as never);

    expect(res.statusCode).toBe(429);
    expect(mocks.handleMotivationQuoteRequest).toHaveBeenCalledTimes(60);
  });
});
