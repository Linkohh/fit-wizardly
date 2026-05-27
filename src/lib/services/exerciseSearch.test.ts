import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadExerciseLibrary,
  resetExerciseLibraryServiceForTests,
} from '@/features/exercise-library/service';
import { searchPrimary } from './exerciseSearch';
import type { ExerciseLibraryRecord } from '@/features/exercise-library/types';

const fetchMock = vi.fn<typeof fetch>();

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

function buildRecord(overrides: Partial<ExerciseLibraryRecord> = {}): ExerciseLibraryRecord {
  return {
    id: 'wger:10',
    source: 'wger',
    sourceId: 10,
    sourceUuid: 'uuid-10',
    slug: 'leg-press-10',
    name: 'Leg Press',
    description: 'Press through the platform with control.',
    category: {
      id: 'strength',
      name: 'Strength',
      slug: 'strength',
    },
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes'],
    equipment: ['Machine'],
    imageUrl: null,
    imageUrls: [],
    licenseInfo: null,
    aliases: [],
    localizedContent: {},
    searchText: 'leg press strength quadriceps glutes machine',
    lastSyncedAt: '2026-03-15T17:08:40.000Z',
    ...overrides,
  };
}

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

describe('exercise search', () => {
  beforeEach(() => {
    resetExerciseLibraryServiceForTests();
    window.localStorage.clear();
    setNavigatorOnline(false);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes('wger-snapshot.v1.json')) {
        return createJsonResponse({
          generatedAt: '2026-03-15T17:08:40.000Z',
          records: [buildRecord()],
        });
      }

      return Promise.reject(new Error('Load failed'));
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    resetExerciseLibraryServiceForTests();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('returns matching local catalog exercises when live wger search fails', async () => {
    await loadExerciseLibrary();

    const result = await searchPrimary('Leg');

    expect(result.source).toBe('catalog');
    expect(result.warning).toBeUndefined();
    expect(result.hasEmptyResults).toBe(false);
    expect(result.results).toEqual([
      expect.objectContaining({
        id: 'wger:10',
        name: 'Leg Press',
        source: 'catalog',
      }),
    ]);
  });

  it('uses live wger results before API Ninjas fallback', async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes('wger-snapshot.v1.json')) {
        return createJsonResponse({
          generatedAt: '2026-03-15T17:08:40.000Z',
          records: [],
        });
      }

      if (url.includes('/exerciseinfo/?search=press')) {
        return createJsonResponse({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 77,
              name: 'Bench Press',
              description: '<p>Press the bar from the chest.</p>',
              muscles: [{ id: 4, name: 'Chest', name_en: 'Chest' }],
              muscles_secondary: [],
              equipment: [{ id: 1, name: 'Barbell' }],
              translations: [],
            },
          ],
        });
      }

      if (url.includes('/api/exercise-search-ninjas')) {
        throw new Error('API Ninjas should not be called when wger has matches');
      }

      return Promise.reject(new Error('Unexpected request'));
    });

    const result = await searchPrimary('press');

    expect(result.source).toBe('wger');
    expect(result.results).toEqual([
      expect.objectContaining({
        name: 'Bench Press',
        source: 'wger',
      }),
    ]);
  });

  it('uses API Ninjas when local catalog and wger have no matches', async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes('wger-snapshot.v1.json')) {
        return createJsonResponse({
          generatedAt: '2026-03-15T17:08:40.000Z',
          records: [],
        });
      }

      if (url.includes('/exerciseinfo/?search=press')) {
        return createJsonResponse({
          count: 0,
          next: null,
          previous: null,
          results: [],
        });
      }

      if (url.includes('/api/exercise-search-ninjas?name=press')) {
        return createJsonResponse({
          results: [
            {
              id: 'api-ninjas:dumbbell-press',
              name: 'Dumbbell Press',
              targetMuscles: ['shoulders'],
              equipment: ['dumbbell'],
              difficulty: 'intermediate',
              description: 'Press dumbbells overhead with control.',
              source: 'api-ninjas',
            },
          ],
        });
      }

      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    const result = await searchPrimary('press');

    expect(result.source).toBe('api-ninjas');
    expect(result.hasEmptyResults).toBe(false);
    expect(result.results).toEqual([
      expect.objectContaining({
        id: 'api-ninjas:dumbbell-press',
        source: 'api-ninjas',
      }),
    ]);
  });

  it('returns the existing fallback warning when all live providers fail', async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes('wger-snapshot.v1.json')) {
        return createJsonResponse({
          generatedAt: '2026-03-15T17:08:40.000Z',
          records: [],
        });
      }

      return Promise.reject(new Error('Live provider failed'));
    });

    const result = await searchPrimary('unknown movement');

    expect(result.source).toBe('catalog-fallback');
    expect(result.hasEmptyResults).toBe(true);
    expect(result.warning).toMatch(/offline catalog remains available/i);
  });
});
