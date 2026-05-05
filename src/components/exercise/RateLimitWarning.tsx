import { AlertCircle } from 'lucide-react';

interface RateLimitWarningProps {
  remainingRequests: number;
}

export function RateLimitWarning({
  remainingRequests,
}: RateLimitWarningProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-900">
            Search limit exceeded
          </h3>
          <p className="mt-1 text-sm text-red-800">
            You've used all 10 searches today. Try again tomorrow.
          </p>
          <p className="mt-2 text-xs text-red-700">
            Remaining searches: {remainingRequests}/10
          </p>
        </div>
      </div>
    </div>
  );
}
