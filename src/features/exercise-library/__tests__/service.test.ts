import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAllWgerExercises,
  getExerciseLibraryState,
  loadExerciseLibrary,
  resetExerciseLibraryServiceForTests,
  resolveBootExerciseLibraryState,
  syncExerciseLibrary,
} from '../service';
import type { ExerciseLibraryRecord, WgerExerciseInfoRecord } from '../types';

const fetchMock = vi.fn<typeof fetch>();

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

function buildNormalizedRecord(overrides: Partial<ExerciseLibraryRecord> = {}): ExerciseLibraryRecord {
  return {
    id: 'wger:1',
    source: 'wger',
    sourceId: 1,
    sourceUuid: 'uuid-1',
    slug: 'push-up-1',
    name: 'Push-Up',
    description: 'A classic bodyweight press.',
    category: {
      id: 'strength',
      name: 'Strength',
      slug: 'strength',
    },
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps'],
    equipment: ['Bodyweight'],
    imageUrl: null,
    imageUrls: [],
    licenseInfo: null,
    aliases: [],
    localizedContent: {},
    searchText: 'push-up strength chest triceps bodyweight',
    lastSyncedAt: '2025-01-03T00:00:00.000Z',
    ...overrides,
  };
}

function buildWgerRecord(id: number): WgerExerciseInfoRecord {
  return {
    id,
    uuid: `uuid-${id}`,
    created: '2025-01-01T00:00:00.000Z',
    last_update: '2025-01-01T00:00:00.000Z',
    last_update_global: '2025-01-01T00:00:00.000Z',
    category: {
      id: 10,
      name: 'Strength',
    },
    muscles: [],
    muscles_secondary: [],
    equipment: [],
    license: null,
    license_author: null,
    images: [],
    translations: [
      {
        id,
        uuid: `translation-${id}`,
        name: `Exercise ${id}`,
        exercise: id,
        description: '',
        created: '2025-01-01T00:00:00.000Z',
        language: 2,
        aliases: [],
        notes: [],
        license: null,
        license_title: '',
        license_object_url: '',
        license_author: null,
        license_author_url: '',
        license_derivative_source_url: '',
        author_history: [],
      },
    ],
    variations: null,
    videos: [],
    author_history: [],
    total_authors_history: [],
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

function createSnapshotPayload(recordCount = 205) {
  return {
    generatedAt: '2025-01-03T00:00:00.000Z',
    records: Array.from({ length: recordCount }, (_, index) =>
      buildNormalizedRecord({
        id: `wger:${index + 1}`,
        name: `Snapshot Exercise ${index + 1}`,
        sourceId: index + 1,
        sourceUuid: `snapshot-${index + 1}`,
      })
    ),
  };
}

describe('exercise-library service', () => {
  beforeEach(() => {
    resetExerciseLibraryServiceForTests();
    window.localStorage.clear();
    setNavigatorOnline(false);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('wger-snapshot.v1.json')) {
        return createJsonResponse(createSnapshotPayload());
      }

      return createJsonResponse({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    resetExerciseLibraryServiceForTests();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('prefers the persisted cache during boot when it is valid', () => {
    window.localStorage.setItem(
      'fitwizard:exercise-library:last-known-good:v2',
      JSON.stringify({
        version: 2,
        storedAt: new Date().toISOString(),
        source: 'live',
        lastSyncedAt: '2025-01-03T00:00:00.000Z',
        records: [buildNormalizedRecord()],
      })
    );

    const state = resolveBootExerciseLibraryState();

    expect(state.source).toBe('cache');
    expect(state.records).toHaveLength(1);
    expect(state.records[0]?.name).toBe('Push-Up');
  });

  it('ignores the old v1 cache contract after the schema bump', () => {
    window.localStorage.setItem(
      'fitwizard:exercise-library:last-known-good:v1',
      JSON.stringify({
        version: 1,
        storedAt: new Date().toISOString(),
        source: 'live',
        lastSyncedAt: '2025-01-03T00:00:00.000Z',
        records: [buildNormalizedRecord()],
      })
    );

    const state = resolveBootExerciseLibraryState();

    expect(state.source).toBe('snapshot');
    expect(state.records).toHaveLength(0);
  });

  it('starts empty and defers snapshot loading when no cache is present', () => {
    const state = resolveBootExerciseLibraryState();

    expect(state.source).toBe('snapshot');
    expect(state.records).toHaveLength(0);
  });

  it('loads the snapshot asset when no cache is present', async () => {
    const state = await loadExerciseLibrary();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('wger-snapshot.v1.json'),
      expect.objectContaining({
        cache: 'force-cache',
      })
    );
    expect(state.source).toBe('snapshot');
    expect(state.records.length).toBeGreaterThan(200);
  });

  it('rejects partial pagination results from the live API', async () => {
    fetchMock
      .mockImplementationOnce(() =>
        createJsonResponse({
          count: 300,
          next: 'https://wger.de/api/v2/exerciseinfo/?page=2',
          previous: null,
          results: [buildWgerRecord(1)],
        })
      )
      .mockImplementationOnce(() =>
        createJsonResponse({
          count: 300,
          next: null,
          previous: 'https://wger.de/api/v2/exerciseinfo/?page=1',
          results: [buildWgerRecord(2)],
        })
      );

    await expect(fetchAllWgerExercises()).rejects.toThrow(
      /fewer records than expected/i
    );
  });

  it('keeps the current local source when live sync fails validation', async () => {
    await loadExerciseLibrary();
    fetchMock.mockImplementationOnce(() =>
      createJsonResponse({
        count: 1,
        next: null,
        previous: null,
        results: [],
      })
    );

    const result = await syncExerciseLibrary({ force: true });
    const state = getExerciseLibraryState();

    expect(result).toBeNull();
    expect(state.source).toBe('snapshot');
    expect(state.syncStatus).toBe('error');
    expect(state.records.length).toBeGreaterThan(200);
  });

  it('enters cooldown after three consecutive sync failures', async () => {
    await loadExerciseLibrary();
    fetchMock.mockImplementation(() =>
      createJsonResponse({
        count: 0,
        next: null,
        previous: null,
        results: [],
      })
    );

    await syncExerciseLibrary({ force: true });
    await syncExerciseLibrary({ force: true });
    await syncExerciseLibrary({ force: true });

    expect(getExerciseLibraryState().syncStatus).toBe('cooldown');

    const result = await syncExerciseLibrary();

    expect(result).toBeNull();
    expect(getExerciseLibraryState().syncStatus).toBe('cooldown');
  });
});
