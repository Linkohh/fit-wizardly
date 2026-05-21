import { getAdapters } from './api/exerciseApiAdapter';
import type { NormalizedExercise } from './api/types';

interface SearchResult {
  results: NormalizedExercise[];
  hasEmptyResults: boolean;
  isFromFallback: false;
  source: 'wger';
}

const ADAPTERS = getAdapters();

export async function searchPrimary(query: string): Promise<SearchResult> {
  const results = await ADAPTERS.wger.search(query);

  return {
    results,
    hasEmptyResults: results.length === 0,
    isFromFallback: false,
    source: 'wger',
  };
}
