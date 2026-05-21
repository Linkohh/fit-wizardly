import { useState, useCallback } from 'react';
import type { NormalizedExercise } from '@/lib/services/api/types';
import { searchPrimary } from '@/lib/services/exerciseSearch';

interface UseExerciseSearchResult {
  data: NormalizedExercise[];
  isLoading: boolean;
  error: string | null;
  currentQuery: string;
  hasEmptyResults: boolean;
  searchPrimary: (query: string) => Promise<void>;
  reset: () => void;
}

export function useExerciseSearch(): UseExerciseSearchResult {
  const [data, setData] = useState<NormalizedExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEmptyResults, setHasEmptyResults] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  const handleSearchPrimary = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Search term must not be empty');
      return;
    }

    if (trimmedQuery.length < 2) {
      setError('Search term must be at least 2 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasEmptyResults(false);
    setCurrentQuery(trimmedQuery);

    try {
      const result = await searchPrimary(trimmedQuery);

      setData(result.results);
      setHasEmptyResults(result.hasEmptyResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search exercises');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setData([]);
    setError(null);
    setIsLoading(false);
    setHasEmptyResults(false);
    setCurrentQuery('');
  }, []);

  return {
    data,
    isLoading,
    error,
    currentQuery,
    hasEmptyResults,
    searchPrimary: handleSearchPrimary,
    reset: handleReset,
  };
}
