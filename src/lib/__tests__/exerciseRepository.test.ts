import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCachedExerciseDatabase,
  loadExerciseDatabase,
  resetExerciseRepositoryForTests,
} from '@/lib/exerciseRepository';

const fetchMock = vi.fn<typeof fetch>();

function createJsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  );
}

describe('exerciseRepository', () => {
  beforeEach(() => {
    resetExerciseRepositoryForTests();
    window.localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockImplementation(() =>
      createJsonResponse([
        {
          id: 'push_up',
          name: 'Push-Up',
          primaryMuscles: ['chest'],
          secondaryMuscles: ['triceps'],
          equipment: ['bodyweight'],
          patterns: ['horizontal_push'],
          contraindications: [],
          cues: ['Brace'],
          description: 'A classic press.',
          steps: [],
          variations: [],
          category: 'strength',
          difficulty: 'Beginner',
        },
      ])
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    resetExerciseRepositoryForTests();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('loads the asset once and reuses the in-memory cache', async () => {
    const firstLoad = await loadExerciseDatabase();
    const secondLoad = await loadExerciseDatabase();

    expect(firstLoad).toHaveLength(1);
    expect(secondLoad).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getCachedExerciseDatabase()).toHaveLength(1);
  });

  it('persists the fetched asset into localStorage', async () => {
    await loadExerciseDatabase();

    const persisted = window.localStorage.getItem('fitwizard:exercise-catalog:v1');
    expect(persisted).toContain('"version":"v1"');
    expect(persisted).toContain('"push_up"');
  });
});
