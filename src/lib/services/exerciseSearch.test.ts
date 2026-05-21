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
});
