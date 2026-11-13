import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiCache } from '@/lib/offlineSupport';
import { cachedExerciseSearch, normalizeExerciseSearchQuery } from './searchCache';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  );
}

const wgerHit = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 77,
      name: 'Bench Press',
      description: '',
      muscles: [{ id: 4, name: 'Chest', name_en: 'Chest' }],
      muscles_secondary: [],
      equipment: [{ id: 1, name: 'Barbell' }],
      translations: [],
    },
  ],
};

const wgerCalls = () => fetchMock.mock.calls.filter(([input]) => String(input).includes('/exerciseinfo/'));

describe('cachedExerciseSearch', () => {
  beforeEach(() => {
    apiCache.clear();
    fetchMock.mockReset();
    fetchMock.mockImplementation((input) =>
      String(input).includes('/exerciseinfo/') ? jsonResponse(wgerHit) : jsonResponse({ results: [] })
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fetches once for queries that differ only in case and spacing', async () => {
    const first = await cachedExerciseSearch('Bench  Press');
    const second = await cachedExerciseSearch('  bench press ');

    expect(first).toEqual([expect.objectContaining({ id: 'wger-77', source: 'wger' })]);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed fetch', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('Load failed')));

    expect(await cachedExerciseSearch('bench')).toEqual([]);
    expect(await cachedExerciseSearch('bench')).toEqual([expect.objectContaining({ id: 'wger-77' })]);
    expect(wgerCalls()).toHaveLength(2);
  });

  it('does not cache an error response', async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response('nope', { status: 500 })));

    expect(await cachedExerciseSearch('bench')).toEqual([]);
    await cachedExerciseSearch('bench');
    expect(wgerCalls()).toHaveLength(2);
  });

  it('returns nothing for an empty or whitespace query without fetching', async () => {
    expect(await cachedExerciseSearch('')).toEqual([]);
    expect(await cachedExerciseSearch('   \n\t ')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('truncates a very long query to 200 characters before fetching', async () => {
    await cachedExerciseSearch('a'.repeat(600));

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain(`search=${'a'.repeat(200)}`);
    expect(url).not.toContain('a'.repeat(201));
  });

  it('handles special characters without throwing', async () => {
    fetchMock.mockImplementation(() => jsonResponse({ results: [] }));

    await expect(cachedExerciseSearch('50% & <b>"curl"</b> #1 ?x=1 💪')).resolves.toEqual([]);
    expect(String(fetchMock.mock.calls[0][0])).not.toMatch(/[<>"# ]/);
  });

  it('fetches again after ten minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await cachedExerciseSearch('bench');
    vi.setSystemTime(Date.now() + 10 * 60 * 1000 + 1);
    await cachedExerciseSearch('bench');

    expect(wgerCalls()).toHaveLength(2);
  });
});

describe('normalizeExerciseSearchQuery', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalizeExerciseSearchQuery('  Bench \t  PRESS ')).toBe('bench press');
  });
});
