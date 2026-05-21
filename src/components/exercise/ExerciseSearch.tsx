import { useState } from 'react';
import { useExerciseSearch } from '@/hooks/useExerciseSearch';
import { ExerciseSearchInput } from './ExerciseSearchInput';
import { ExerciseResults } from './ExerciseResults';

interface ExerciseSearchProps {
  onSelectExercise?: (exerciseId: string, exerciseName: string) => void;
}

export function ExerciseSearch({ onSelectExercise }: ExerciseSearchProps) {
  const {
    data,
    isLoading,
    error,
    currentQuery,
    hasEmptyResults,
    searchPrimary,
  } = useExerciseSearch();

  const [searchInput, setSearchInput] = useState('');

  const handleSearch = async (query: string) => {
    setSearchInput(query);
    await searchPrimary(query);
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      <ExerciseSearchInput
        value={searchInput}
        onChange={setSearchInput}
        onSearch={handleSearch}
        isLoading={isLoading}
        placeholder="Search for exercises (e.g., bicep curl)"
      />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      )}

      {hasEmptyResults && !isLoading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No exercises found in wger for "{currentQuery}". The offline catalog
          remains available for browsing and workout generation.
        </div>
      )}

      {data.length > 0 && !isLoading && (
        <ExerciseResults
          exercises={data}
          onSelectExercise={onSelectExercise}
        />
      )}
    </div>
  );
}
