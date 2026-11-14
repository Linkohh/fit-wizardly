import { apiCache } from '@/lib/offlineSupport';
import { getAdapters } from '@/lib/services/api/exerciseApiAdapter';
import type { NormalizedExercise } from '@/lib/services/api/types';

export const EXERCISE_SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
export const MAX_EXERCISE_SEARCH_QUERY_LENGTH = 200;

const CACHE_KEY_PREFIX = 'exercise-search:';
const ADAPTERS = getAdapters();

/** Trim, lowercase, collapse whitespace, and cap the length. */
export function normalizeExerciseSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_EXERCISE_SEARCH_QUERY_LENGTH)
    .trim();
}

function readCache(key: string): NormalizedExercise[] | undefined {
  const cached = apiCache.get(key);
  return Array.isArray(cached) ? (cached as NormalizedExercise[]) : undefined;
}

/**
 * Live exercise search (wger first, API Ninjas as fallback) with a 10 minute
 * in-memory cache.
 *
 * Only real, non-empty results are cached. A failed request, an error response
 * or an empty result is never cached, so the next search tries the network
 * again. An empty query returns [] without touching the network.
 */
export async function cachedExerciseSearch(query: string): Promise<NormalizedExercise[]> {
  const normalizedQuery = normalizeExerciseSearchQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${normalizedQuery}`;
  const cached = readCache(cacheKey);
  if (cached) {
    return cached;
  }

  let results = await ADAPTERS.wger.search(normalizedQuery).catch((): NormalizedExercise[] => []);
  if (results.length === 0) {
    results = await ADAPTERS.apiNinjas.search(normalizedQuery).catch((): NormalizedExercise[] => []);
  }

  if (results.length > 0) {
    apiCache.set(cacheKey, results, EXERCISE_SEARCH_CACHE_TTL_MS);
  }

  return results;
}
