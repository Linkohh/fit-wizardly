import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './exercise-search-ninjas';

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
    const req = { method: 'GET', query: { name: 'press' } };
    const res = {};

    await handler(req as never, res as never);

    expect(mocks.handleApiNinjasExerciseSearchRequest).toHaveBeenCalledWith(req, res);
  });
});
