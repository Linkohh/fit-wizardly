import { getAdapters } from './api/exerciseApiAdapter';
import type { NormalizedExercise } from './api/types';
import {
  canMakeRequest,
  recordRequest,
  getRemainingRequests,
} from './rateLimiter';

interface SearchResult {
  results: NormalizedExercise[];
  hasEmptyResults: boolean;
  isFromFallback: boolean;
  source: 'wger' | 'exercisedb' | 'api-ninjas';
}

const ADAPTERS = getAdapters();

export async function searchPrimary(query: string): Promise<SearchResult> {
  // Primary search uses wger
  const results = await ADAPTERS.wger.search(query);

  return {
    results,
    hasEmptyResults: results.length === 0,
    isFromFallback: false,
    source: 'wger',
  };
}

export async function searchFallback(
  query: string,
  apiSource: 'exercisedb' | 'api-ninjas',
  userId: string
): Promise<SearchResult> {
  // Check rate limit before making request
  const canRequest = await canMakeRequest(userId);
  if (!canRequest) {
    return {
      results: [],
      hasEmptyResults: false,
      isFromFallback: true,
      source: apiSource,
    };
  }

  // Make the request
  const results = await ADAPTERS[apiSource].search(query);

  // Record the request for rate limiting
  await recordRequest(userId);

  return {
    results,
    hasEmptyResults: results.length === 0,
    isFromFallback: true,
    source: apiSource,
  };
}

export async function getRemainingFallbackRequests(
  userId: string
): Promise<number> {
  return getRemainingRequests(userId);
}

export function getMaxFallbackRequests(): number {
  return 10; // Match the constant in rate limiter
}
