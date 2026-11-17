import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './exercise-search-ninjas';
import { createTestResponse, uniqueIp } from './_lib/testResponse';

const mocks = vi.hoisted(() => ({
  handleApiNinjasExerciseSearchRequest: vi.fn(),
}));

vi.mock('../src/lib/services/api/apiNinjasExerciseEndpoint', () => ({
  handleApiNinjasExerciseSearchRequest: mocks.handleApiNinjasExerciseSearchRequest,
}));

describe('/api/exercise-search-ninjas Vercel function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to the shared API Ninjas exercise endpoint handler', async () => {
    const req = { method: 'GET', query: { name: 'press' }, headers: { 'x-real-ip': uniqueIp() } };
    const res = createTestResponse();

    await handler(req as never, res as never);

    expect(mocks.handleApiNinjasExerciseSearchRequest).toHaveBeenCalledWith(req, expect.anything());
  });

  it('blocks an unknown origin before calling the shared handler', async () => {
    const res = createTestResponse();

    await handler(
      { method: 'GET', query: { name: 'press' }, headers: { origin: 'https://evil.example', 'x-real-ip': uniqueIp() } } as never,
      res as never
    );

    expect(res.statusCode).toBe(403);
    expect(mocks.handleApiNinjasExerciseSearchRequest).not.toHaveBeenCalled();
  });

  it('answers an allowed preflight itself', async () => {
    const res = createTestResponse();

    await handler(
      { method: 'OPTIONS', headers: { origin: 'capacitor://localhost', 'x-real-ip': uniqueIp() } } as never,
      res as never
    );

    expect(res.statusCode).toBe(204);
    expect(mocks.handleApiNinjasExerciseSearchRequest).not.toHaveBeenCalled();
  });
});
