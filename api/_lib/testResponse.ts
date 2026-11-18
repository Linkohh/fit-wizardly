import { vi } from 'vitest';

/** A minimal VercelResponse stand-in for the api/ tests. */
export function createTestResponse() {
  const response = {
    headers: new Map<string, string>(),
    statusCode: 200,
    body: undefined as unknown,
    ended: false,
    setHeader: vi.fn((key: string, value: string) => {
      response.headers.set(key.toLowerCase(), value);
      return response;
    }),
    status: vi.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
    end: vi.fn(() => {
      response.ended = true;
      return response;
    }),
  };
  return response;
}

export type TestResponse = ReturnType<typeof createTestResponse>;

let ipCounter = 0;

/** A fresh client IP per call, so the module-level rate limiters don't leak between tests. */
export function uniqueIp() {
  ipCounter += 1;
  return `198.51.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}
