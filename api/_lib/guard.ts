/**
 * Shared request guard for the Vercel functions in api/ (roadmap 2.3).
 *
 * - CORS: only origins on the allowlist get CORS headers. A request from any
 *   other origin gets a 403. Requests with no Origin header (same-origin GETs,
 *   server-to-server calls) are allowed.
 * - Rate limit: a per-IP fixed window held in memory. It is per function
 *   instance and best-effort: a cold start or a second instance starts with an
 *   empty table. Vercel firewall rate-limit rules are the long-term fix.
 *
 * Files under api/_lib are not deployed as functions (leading underscore).
 */

type HeaderValue = string | string[] | undefined;

export interface GuardRequest {
  method?: string;
  headers?: Record<string, HeaderValue>;
  socket?: { remoteAddress?: string | null };
}

export interface GuardResponse {
  setHeader: (key: string, value: string) => unknown;
  status: (code: number) => GuardResponse;
  json: (body: never) => unknown;
  end: () => unknown;
}

type JsonResponse = GuardResponse & { json: (body: { error: string; code: string }) => unknown };

/** Always allowed: the Capacitor WebView origins (iOS, then Android). */
export const NATIVE_APP_ORIGINS = ['capacitor://localhost', 'https://localhost'] as const;

export const DEFAULT_RATE_LIMIT = 60;
export const DEFAULT_RATE_WINDOW_MS = 60_000;
const MAX_TRACKED_CLIENTS = 10_000;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '').toLowerCase();
}

function firstHeader(value: HeaderValue): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
}

/**
 * Builds the origin allowlist from ALLOWED_ORIGINS (comma-separated), the
 * deployment's own Vercel URLs, and the native app origins.
 */
export function getAllowedOrigins(env: Record<string, string | undefined> = process.env): Set<string> {
  const origins = new Set<string>(NATIVE_APP_ORIGINS);

  for (const entry of (env.ALLOWED_ORIGINS ?? '').split(',')) {
    if (entry.trim() !== '') origins.add(normalizeOrigin(entry));
  }

  // Vercel system variables hold bare hostnames, without a scheme.
  for (const key of ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL'] as const) {
    const host = env[key]?.trim();
    if (host) origins.add(normalizeOrigin(`https://${host}`));
  }

  return origins;
}

export function getClientIp(req: GuardRequest): string {
  const headers = req.headers ?? {};
  const realIp = firstHeader(headers['x-real-ip']);
  if (realIp) return realIp;

  const forwardedFor = firstHeader(headers['x-forwarded-for']);
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  return req.socket?.remoteAddress ?? 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check: (key: string) => RateLimitResult;
}

export function createRateLimiter({
  limit = DEFAULT_RATE_LIMIT,
  windowMs = DEFAULT_RATE_WINDOW_MS,
  now = Date.now,
}: { limit?: number; windowMs?: number; now?: () => number } = {}): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  function prune(currentTime: number) {
    for (const [key, entry] of windows) {
      if (currentTime - entry.start >= windowMs) windows.delete(key);
    }
    // Still full after pruning: drop everything rather than grow without bound.
    if (windows.size >= MAX_TRACKED_CLIENTS) windows.clear();
  }

  return {
    check(key) {
      const currentTime = now();
      if (windows.size >= MAX_TRACKED_CLIENTS) prune(currentTime);

      const existing = windows.get(key);
      const entry =
        existing && currentTime - existing.start < windowMs
          ? existing
          : { start: currentTime, count: 0 };

      const next = { start: entry.start, count: entry.count + 1 };
      windows.set(key, next);

      const allowed = next.count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - next.count),
        retryAfterSeconds: allowed
          ? 0
          : Math.max(1, Math.ceil((next.start + windowMs - currentTime) / 1000)),
      };
    },
  };
}

function sendError(res: GuardResponse, status: number, error: string, code: string) {
  (res as JsonResponse).status(status);
  (res as JsonResponse).json({ error, code });
}

export interface ApiGuardOptions {
  /** Methods the function serves, besides OPTIONS. */
  methods?: string[];
  limiter?: RateLimiter;
  env?: Record<string, string | undefined>;
}

/**
 * Returns a guard to call at the top of a handler. It answers the request
 * itself (403, 204 preflight, 405 or 429) and returns false, or returns true
 * when the handler should go on.
 */
export function createApiGuard({ methods = ['GET'], limiter = createRateLimiter(), env }: ApiGuardOptions = {}) {
  const allowedMethods = methods.map((method) => method.toUpperCase());

  return function guard(req: GuardRequest, res: GuardResponse): boolean {
    const origin = firstHeader(req.headers?.origin);
    res.setHeader('Vary', 'Origin');

    if (origin) {
      if (!getAllowedOrigins(env ?? process.env).has(normalizeOrigin(origin))) {
        sendError(res, 403, 'Origin not allowed', 'ORIGIN_NOT_ALLOWED');
        return false;
      }
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', [...allowedMethods, 'OPTIONS'].join(','));
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      res.setHeader('Access-Control-Max-Age', '600');
    }

    const method = (req.method ?? 'GET').toUpperCase();
    if (method === 'OPTIONS') {
      res.status(204);
      res.end();
      return false;
    }

    if (!allowedMethods.includes(method)) {
      res.setHeader('Allow', [...allowedMethods, 'OPTIONS'].join(', '));
      sendError(res, 405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
      return false;
    }

    const rate = limiter.check(getClientIp(req));
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSeconds));
      sendError(res, 429, 'Too many requests', 'RATE_LIMITED');
      return false;
    }

    return true;
  };
}

/**
 * Wraps a response so the shared endpoint handlers in src/lib (which also back
 * the Vite dev server) cannot overwrite the guard's CORS headers with '*'.
 */
export function withGuardedCors<T extends GuardResponse>(res: T): T {
  return new Proxy(res, {
    get(target, property, receiver) {
      if (property === 'setHeader') {
        return (key: string, value: string) => {
          if (key.toLowerCase().startsWith('access-control-')) return target;
          return target.setHeader(key, value);
        };
      }
      const value: unknown = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
