import { describe, expect, it, vi } from 'vitest';
import {
  fetchApiNinjasExercises,
  normalizeApiNinjasExercises,
} from './apiNinjasExercises';

function createResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

describe('API Ninjas exercise normalization', () => {
  it('normalizes supported upstream exercise records', () => {
    const results = normalizeApiNinjasExercises([
      {
        name: 'Incline Dumbbell Press',
        type: 'strength',
        muscle: 'chest',
        difficulty: 'intermediate',
        equipments: ['dumbbell', 'incline bench'],
        instructions: 'Press the dumbbells upward with control.',
        safety_info: 'Keep your shoulder blades pinned to the bench.',
      },
    ]);

    expect(results).toEqual([
      {
        id: 'api-ninjas:incline-dumbbell-press',
        name: 'Incline Dumbbell Press',
        targetMuscles: ['chest'],
        equipment: ['dumbbell', 'incline bench'],
        difficulty: 'intermediate',
        description:
          'Press the dumbbells upward with control. Safety: Keep your shoulder blades pinned to the bench.',
        safetyInfo: 'Keep your shoulder blades pinned to the bench.',
        source: 'api-ninjas',
      },
    ]);
  });

  it('dedupes normalized records by exercise name', () => {
    const results = normalizeApiNinjasExercises([
      { name: 'Push Up', muscle: 'chest', instructions: 'Brace and press.' },
      { name: 'push-up', muscle: 'chest', instructions: 'Duplicate spelling.' },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Push Up');
  });
});

describe('API Ninjas exercise fetch helper', () => {
  it('does not call upstream when the API key is missing', async () => {
    const fetcher = vi.fn<typeof fetch>();

    const results = await fetchApiNinjasExercises({
      apiKey: '',
      fetcher,
      name: 'press',
    });

    expect(results).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('encodes safe query params and sends the server API key', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      createResponse([
        {
          name: 'Dumbbell Bench Press',
          type: 'strength',
          muscle: 'chest',
          difficulty: 'beginner',
          equipments: ['dumbbell'],
          instructions: 'Press with control.',
        },
      ])
    );

    const results = await fetchApiNinjasExercises({
      apiKey: 'server-key',
      fetcher,
      name: 'bench press',
      type: 'strength',
      muscle: 'chest',
      difficulty: 'beginner',
      equipments: 'dumbbell,flat bench',
    });

    expect(results).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.api-ninjas.com/v1/exercises?name=bench+press&type=strength&muscle=chest&difficulty=beginner&equipments=dumbbell%2Cflat+bench',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Api-Key': 'server-key' }),
      })
    );
  });

  it('returns an empty list for upstream failures or invalid payloads', async () => {
    const failedFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ error: 'rate limited' }), { status: 429 }));
    const invalidFetch = vi.fn<typeof fetch>().mockResolvedValue(createResponse({}));

    await expect(
      fetchApiNinjasExercises({ apiKey: 'server-key', fetcher: failedFetch, name: 'press' })
    ).resolves.toEqual([]);
    await expect(
      fetchApiNinjasExercises({ apiKey: 'server-key', fetcher: invalidFetch, name: 'press' })
    ).resolves.toEqual([]);
  });
});
