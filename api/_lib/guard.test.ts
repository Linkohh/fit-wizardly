import { describe, expect, it } from 'vitest';
import {
  createApiGuard,
  createRateLimiter,
  getAllowedOrigins,
  getClientIp,
  withGuardedCors,
} from './guard';
import { createTestResponse } from './testResponse';

const env = {
  ALLOWED_ORIGINS: 'https://fitwizard.app, https://beta.fitwizard.app/',
  VERCEL_URL: 'fit-wizardly-abc123.vercel.app',
};

function request(headers: Record<string, string> = {}, method = 'GET') {
  return { method, headers: { 'x-real-ip': '203.0.113.7', ...headers } };
}

describe('getAllowedOrigins', () => {
  it('combines ALLOWED_ORIGINS, the Vercel deployment URL and the native origins', () => {
    const origins = getAllowedOrigins(env);
    expect(origins).toEqual(
      new Set([
        'capacitor://localhost',
        'https://localhost',
        'https://fitwizard.app',
        'https://beta.fitwizard.app',
        'https://fit-wizardly-abc123.vercel.app',
      ])
    );
  });

  it('still allows the native origins with no configuration', () => {
    expect(getAllowedOrigins({})).toEqual(new Set(['capacitor://localhost', 'https://localhost']));
  });
});

describe('createApiGuard: origins', () => {
  it.each([
    'https://fitwizard.app',
    'https://beta.fitwizard.app',
    'https://fit-wizardly-abc123.vercel.app',
    'capacitor://localhost',
    'https://localhost',
  ])('allows %s and echoes it back', (origin) => {
    const guard = createApiGuard({ env });
    const res = createTestResponse();

    expect(guard(request({ origin }), res)).toBe(true);
    expect(res.headers.get('access-control-allow-origin')).toBe(origin);
    expect(res.headers.get('vary')).toBe('Origin');
  });

  it.each(['https://evil.example', 'http://fitwizard.app', 'null'])('blocks %s with a 403', (origin) => {
    const guard = createApiGuard({ env });
    const res = createTestResponse();

    expect(guard(request({ origin }), res)).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Origin not allowed', code: 'ORIGIN_NOT_ALLOWED' });
    expect(res.headers.has('access-control-allow-origin')).toBe(false);
  });

  it('allows requests with no Origin header (same-origin GET) without CORS headers', () => {
    const guard = createApiGuard({ env });
    const res = createTestResponse();

    expect(guard(request(), res)).toBe(true);
    expect(res.headers.has('access-control-allow-origin')).toBe(false);
  });

  it('answers an allowed preflight with 204 and does not call the handler', () => {
    const guard = createApiGuard({ env });
    const res = createTestResponse();

    expect(guard(request({ origin: 'capacitor://localhost' }, 'OPTIONS'), res)).toBe(false);
    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
    expect(res.headers.get('access-control-allow-methods')).toBe('GET,OPTIONS');
  });

  it('rejects other methods with a 405', () => {
    const guard = createApiGuard({ env });
    const res = createTestResponse();

    expect(guard(request({}, 'POST'), res)).toBe(false);
    expect(res.statusCode).toBe(405);
  });
});

describe('createApiGuard: rate limit', () => {
  it('returns 429 with Retry-After once an IP passes the limit, and resets after the window', () => {
    let now = 1_000_000;
    const limiter = createRateLimiter({ limit: 60, windowMs: 60_000, now: () => now });
    const guard = createApiGuard({ env, limiter });

    for (let i = 0; i < 60; i += 1) {
      expect(guard(request(), createTestResponse())).toBe(true);
    }

    const limited = createTestResponse();
    expect(guard(request(), limited)).toBe(false);
    expect(limited.statusCode).toBe(429);
    expect(limited.body).toEqual({ error: 'Too many requests', code: 'RATE_LIMITED' });
    expect(limited.headers.get('retry-after')).toBe('60');

    // Another client is unaffected.
    expect(guard(request({ 'x-real-ip': '203.0.113.8' }), createTestResponse())).toBe(true);

    now += 60_000;
    expect(guard(request(), createTestResponse())).toBe(true);
  });

  it('counts each window from its first request', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000, now: () => now });

    expect(limiter.check('a').allowed).toBe(true);
    now = 9_000;
    expect(limiter.check('a').allowed).toBe(true);
    const third = limiter.check('a');
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBe(1);
  });
});

describe('getClientIp', () => {
  it('prefers x-real-ip, then the first x-forwarded-for entry, then the socket', () => {
    expect(getClientIp({ headers: { 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' } })).toBe('1.1.1.1');
    expect(getClientIp({ headers: { 'x-forwarded-for': '2.2.2.2, 10.0.0.1' } })).toBe('2.2.2.2');
    expect(getClientIp({ headers: {}, socket: { remoteAddress: '3.3.3.3' } })).toBe('3.3.3.3');
    expect(getClientIp({})).toBe('unknown');
  });
});

describe('withGuardedCors', () => {
  it('drops Access-Control-* headers set by shared handlers and passes the rest through', () => {
    const res = createTestResponse();
    res.setHeader('Access-Control-Allow-Origin', 'https://fitwizard.app');

    const wrapped = withGuardedCors(res);
    wrapped.setHeader('Access-Control-Allow-Origin', '*');
    wrapped.setHeader('Cache-Control', 'no-store');
    wrapped.status(200).json({ ok: true } as never);

    expect(res.headers.get('access-control-allow-origin')).toBe('https://fitwizard.app');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
