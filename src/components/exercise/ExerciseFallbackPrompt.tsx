import { Button } from '@/components/ui/button';

interface ExerciseFallbackPromptProps {
  query: string;
  onSearchFallback: (apiSource: 'exercisedb' | 'api-ninjas') => void;
  remainingRequests: number;
  rateLimitExceeded: boolean;
}

export function ExerciseFallbackPrompt({
  query,
  onSearchFallback,
  remainingRequests,
  rateLimitExceeded,
}: ExerciseFallbackPromptProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="mb-4 text-sm text-amber-900">
        No exercises found in wger for "{query}". Try searching in other sources:
      </p>

      <div className="mb-3 flex gap-2">
        <Button
          onClick={() => onSearchFallback('exercisedb')}
          disabled={rateLimitExceeded}
          variant="outline"
          size="sm"
        >
          Search ExerciseDB
        </Button>
        <Button
          onClick={() => onSearchFallback('api-ninjas')}
          disabled={rateLimitExceeded}
          variant="outline"
          size="sm"
        >
          Search API Ninjas
        </Button>
      </div>

      <p className="text-xs text-amber-700">
        You have {remainingRequests} search{remainingRequests !== 1 ? 'es' : ''}{' '}
        remaining
      </p>
    </div>
  );
}
