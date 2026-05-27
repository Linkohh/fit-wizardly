import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchApiNinjasExercises: vi.fn(),
}));

vi.mock('./apiNinjasExercises', () => ({
  fetchApiNinjasExercises: mocks.fetchApiNinjasExercises,
}));

async function loadHandler() {
  return import('./apiNinjasExerciseEndpoint');
}

function createResponse() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(value: unknown) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
}

describe('API Ninjas exercise endpoint handler', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('rejects missing exercise names before calling upstream', async () => {
    const { handleApiNinjasExerciseSearchRequest } = await loadHandler();
    const res = createResponse();

    await handleApiNinjasExerciseSearchRequest({ method: 'GET', query: {} }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Missing name parameter' });
    expect(mocks.fetchApiNinjasExercises).not.toHaveBeenCalled();
  });

  it('returns normalized fallback results for a valid query', async () => {
    mocks.fetchApiNinjasExercises.mockResolvedValue([
      {
        id: 'api-ninjas:dumbbell-bench-press',
        name: 'Dumbbell Bench Press',
        targetMuscles: ['chest'],
        equipment: ['dumbbell'],
        difficulty: 'beginner',
        description: 'Press with control.',
        source: 'api-ninjas',
      },
    ]);
    const { handleApiNinjasExerciseSearchRequest } = await loadHandler();
    const res = createResponse();

    await handleApiNinjasExerciseSearchRequest(
      {
        method: 'GET',
        query: {
          name: 'bench press',
          type: 'strength',
          muscle: 'chest',
          difficulty: 'beginner',
          equipments: 'dumbbell',
        },
      },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      results: [
        expect.objectContaining({
          id: 'api-ninjas:dumbbell-bench-press',
          source: 'api-ninjas',
        }),
      ],
    });
    expect(mocks.fetchApiNinjasExercises).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'bench press',
        type: 'strength',
        muscle: 'chest',
        difficulty: 'beginner',
        equipments: 'dumbbell',
      })
    );
  });

  it('handles OPTIONS without calling upstream', async () => {
    const { handleApiNinjasExerciseSearchRequest } = await loadHandler();
    const res = createResponse();

    await handleApiNinjasExerciseSearchRequest({ method: 'OPTIONS', query: {} }, res);

    expect(res.statusCode).toBe(204);
    expect(mocks.fetchApiNinjasExercises).not.toHaveBeenCalled();
  });
});
