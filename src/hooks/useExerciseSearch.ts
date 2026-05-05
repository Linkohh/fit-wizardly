import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import type { NormalizedExercise } from '@/lib/services/api/types';
import {
  searchPrimary,
  searchFallback,
  getRemainingFallbackRequests,
} from '@/lib/services/exerciseSearch';

interface UseExerciseSearchResult {
  // Primary search
  data: NormalizedExercise[];
  isLoading: boolean;
  error: string | null;
  currentQuery: string;

  // Fallback state
  hasEmptyResults: boolean;
  availableApis: ('exercisedb' | 'api-ninjas')[];
  remainingRequests: number;
  rateLimitExceeded: boolean;

  // Actions
  searchPrimary: (query: string) => Promise<void>;
  searchFallback: (apiSource: 'exercisedb' | 'api-ninjas') => Promise<void>;
  reset: () => void;
}

export function useExerciseSearch(): UseExerciseSearchResult {
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const [data, setData] = useState<NormalizedExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEmptyResults, setHasEmptyResults] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  // Fetch remaining requests
  const { data: remainingRequests = 10, refetch: refetchRemaining } = useQuery({
    queryKey: ['exerciseSearch', 'remainingRequests', userId],
    queryFn: () => (userId ? getRemainingFallbackRequests(userId) : Promise.resolve(10)),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });

  const rateLimitExceeded = remainingRequests === 0;

  const handleSearchPrimary = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setError('Search term must not be empty');
        return;
      }

      if (query.trim().length < 2) {
        setError('Search term must be at least 2 characters');
        return;
      }

      setIsLoading(true);
      setError(null);
      setHasEmptyResults(false);
      setCurrentQuery(query);

      try {
        const result = await searchPrimary(query);

        if (result.hasEmptyResults) {
          setData([]);
          setHasEmptyResults(true);
          setError(null);
        } else {
          setData(result.results);
          setHasEmptyResults(false);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to search exercises'
        );
        setData([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSearchFallback = useCallback(
    async (apiSource: 'exercisedb' | 'api-ninjas') => {
      if (!userId) {
        setError('You must be logged in to search fallback sources');
        return;
      }

      if (rateLimitExceeded) {
        setError('You have exceeded your daily search limit (10 searches)');
        return;
      }

      if (!currentQuery) {
        setError('Please search the primary source first');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await searchFallback(currentQuery, apiSource, userId);

        if (result.results.length === 0) {
          setData([]);
          setError(
            `No results found in ${apiSource}. Try another source.`
          );
        } else {
          setData(result.results);
          setError(null);
        }

        // Refetch remaining requests after a fallback search
        await refetchRemaining();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to search ${apiSource}`
        );
        setData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, rateLimitExceeded, currentQuery, refetchRemaining]
  );

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
    availableApis: ['exercisedb', 'api-ninjas'],
    remainingRequests,
    rateLimitExceeded,
    searchPrimary: handleSearchPrimary,
    searchFallback: handleSearchFallback,
    reset: handleReset,
  };
}
