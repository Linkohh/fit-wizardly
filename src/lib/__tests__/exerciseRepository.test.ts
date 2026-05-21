import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getCachedExerciseDatabase,
  loadExerciseDatabase,
  resetExerciseRepositoryForTests,
} from '@/lib/exerciseRepository';
import type { Exercise, MuscleGroup } from '@/types/fitness';

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

function readExerciseAsset<T>(filename: string) {
  const assetPath = join(process.cwd(), 'public', 'exercise-data', filename);
  return JSON.parse(readFileSync(assetPath, 'utf8')) as T;
}

function countPlannerCandidates(exercises: Exercise[], muscle: MuscleGroup) {
  return exercises.filter(
    (exercise) =>
      exercise.primaryMuscles.includes(muscle) ||
      exercise.secondaryMuscles.includes(muscle)
  ).length;
}

describe('exerciseRepository', () => {
  beforeEach(() => {
    resetExerciseRepositoryForTests();
    window.localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes('wger.de')) {
        return Promise.reject(new Error('offline'));
      }

      if (url.includes('legacy-exercises.v1.json')) {
        return createJsonResponse([
          {
            id: 'legacy_push_up',
            name: 'Push-Up',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['triceps'],
            equipment: ['bodyweight'],
            patterns: ['horizontal_push'],
            contraindications: [],
            cues: ['Brace'],
            category: 'strength',
            difficulty: 'Beginner',
          },
          {
            id: 'legacy_dumbbell_row',
            name: 'Dumbbell Row',
            primaryMuscles: ['upper_back'],
            secondaryMuscles: ['lats', 'biceps'],
            equipment: ['dumbbells', 'bench'],
            patterns: ['horizontal_pull'],
            contraindications: [],
            cues: ['Pull the elbow back'],
            category: 'strength',
            difficulty: 'Intermediate',
          },
        ]);
      }

      return createJsonResponse({
        generatedAt: '2026-05-17T00:00:00.000Z',
        records: [
          {
            id: 'wger:100',
            source: 'wger',
            sourceId: 100,
            sourceUuid: 'exercise-uuid',
            slug: 'push-up-100',
            name: 'Push-Up',
            description: 'Brace hard.',
            category: { id: '11', name: 'Chest', slug: 'chest' },
            primaryMuscles: ['Chest'],
            secondaryMuscles: ['Triceps'],
            equipment: ['Bodyweight'],
            imageUrl: null,
            imageUrls: [],
            licenseInfo: null,
            aliases: [],
            localizedContent: {},
            searchText: 'push up chest triceps',
            lastSyncedAt: '2026-05-17T00:00:00.000Z',
          },
        ],
      });
    });
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

    expect(firstLoad).toHaveLength(2);
    expect(secondLoad).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/exercise-data/wger-snapshot.v1.json'),
      expect.objectContaining({ cache: 'force-cache' })
    );
    expect(getCachedExerciseDatabase()).toHaveLength(2);
    expect(firstLoad[0]).toMatchObject({
      id: 'wger:100',
      primaryMuscles: ['chest'],
      equipment: ['bodyweight'],
      patterns: ['horizontal_push'],
    });
  });

  it('backfills planner-only muscle coverage from legacy exercises without duplicating matching wger exercises', async () => {
    const exercises = await loadExerciseDatabase();

    expect(exercises.filter((exercise) => exercise.name === 'Push-Up')).toHaveLength(1);
    expect(exercises.some((exercise) => exercise.primaryMuscles.includes('upper_back'))).toBe(true);
    expect(exercises.find((exercise) => exercise.name === 'Dumbbell Row')).toMatchObject({
      source: 'legacy',
      primaryMuscles: ['upper_back'],
    });
  });

  it('does not persist a duplicate planner catalog into localStorage', async () => {
    await loadExerciseDatabase();

    const persisted = window.localStorage.getItem('fitwizard:exercise-catalog:v1');
    expect(persisted).toBeNull();
  });
});

describe('exerciseRepository production asset coverage', () => {
  afterEach(() => {
    resetExerciseRepositoryForTests();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('keeps core planner muscle coverage at least at the legacy baseline', async () => {
    const legacyExercises = readExerciseAsset<Exercise[]>('legacy-exercises.v1.json');
    const wgerSnapshot = readExerciseAsset<unknown>('wger-snapshot.v1.json');

    const assetFetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input);
      if (url.includes('legacy-exercises.v1.json')) {
        return createJsonResponse(legacyExercises);
      }

      if (url.includes('wger-snapshot.v1.json')) {
        return createJsonResponse(wgerSnapshot);
      }

      return Promise.reject(new Error('offline'));
    });

    vi.stubGlobal('fetch', assetFetchMock);

    const mergedExercises = await loadExerciseDatabase();
    const coreMuscles: MuscleGroup[] = [
      'chest',
      'upper_back',
      'lats',
      'quads',
      'hamstrings',
      'glutes',
      'biceps',
      'triceps',
      'abs',
    ];

    coreMuscles.forEach((muscle) => {
      expect(
        countPlannerCandidates(mergedExercises, muscle),
        `${muscle} planner coverage`
      ).toBeGreaterThanOrEqual(countPlannerCandidates(legacyExercises, muscle));
    });

    expect(
      mergedExercises.some((exercise) => exercise.primaryMuscles.includes('upper_back'))
    ).toBe(true);
  });
});
