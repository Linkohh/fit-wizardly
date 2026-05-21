import { getAdapters } from './api/exerciseApiAdapter';
import type { NormalizedExercise } from './api/types';
import {
  getExerciseLibraryState,
  loadExerciseLibrary,
} from '@/features/exercise-library/service';
import type { ExerciseLibraryRecord } from '@/features/exercise-library/types';

interface SearchResult {
  results: NormalizedExercise[];
  hasEmptyResults: boolean;
  isFromFallback: boolean;
  source: 'catalog' | 'wger' | 'catalog-fallback';
  warning?: string;
}

const ADAPTERS = getAdapters();
const MAX_CATALOG_RESULTS = 20;

function normalizeSearchTerm(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function catalogRecordToExercise(record: ExerciseLibraryRecord): NormalizedExercise {
  return {
    id: record.id,
    name: record.name,
    targetMuscles: record.primaryMuscles.concat(record.secondaryMuscles),
    equipment: record.equipment,
    description: record.description || undefined,
    source: 'catalog',
  };
}

function searchCatalog(query: string) {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return [];

  return getExerciseLibraryState()
    .records.filter((record) => {
      const haystack = normalizeSearchTerm(
        [
          record.searchText,
          record.name,
          record.category.name,
          ...record.primaryMuscles,
          ...record.secondaryMuscles,
          ...record.equipment,
          ...record.aliases,
        ].join(' ')
      );

      return haystack.includes(normalizedQuery);
    })
    .slice(0, MAX_CATALOG_RESULTS)
    .map(catalogRecordToExercise);
}

export async function searchPrimary(query: string): Promise<SearchResult> {
  if (getExerciseLibraryState().records.length === 0) {
    await loadExerciseLibrary();
  }

  const catalogResults = searchCatalog(query);
  if (catalogResults.length > 0) {
    return {
      results: catalogResults,
      hasEmptyResults: false,
      isFromFallback: false,
      source: 'catalog',
    };
  }

  try {
    const results = await ADAPTERS.wger.search(query);

    return {
      results,
      hasEmptyResults: results.length === 0,
      isFromFallback: false,
      source: 'wger',
    };
  } catch {
    return {
      results: [],
      hasEmptyResults: true,
      isFromFallback: true,
      source: 'catalog-fallback',
      warning: 'Live exercise search is unavailable. The offline catalog remains available for browsing and workout generation.',
    };
  }
}
