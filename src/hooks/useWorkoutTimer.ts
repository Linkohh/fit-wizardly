/**
 * useWorkoutTimer Hook
 *
 * Manages workout elapsed time tracking with proper cleanup.
 * Extracted from WorkoutLogger for reusability and single responsibility.
 */

import { useState, useEffect, useCallback } from 'react';

interface UseWorkoutTimerOptions {
  /** Start time of the workout */
  startTime: Date | string | null;
  /** Whether the timer should be active */
  isActive?: boolean;
  /** Update interval in milliseconds (default: 1000) */
  intervalMs?: number;
}

interface UseWorkoutTimerReturn {
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Formatted time string (MM:SS or HH:MM:SS) */
  formattedTime: string;
  /** Reset the timer to 0 */
  reset: () => void;
}

/**
 * Formats seconds into a readable time string
 */
function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hook for tracking workout elapsed time
 *
 * @example
 * ```tsx
 * const { elapsedSeconds, formattedTime } = useWorkoutTimer({
 *   startTime: workout.startedAt,
 *   isActive: !!workout,
 * });
 * ```
 */
export function useWorkoutTimer({
  startTime,
  isActive = true,
  intervalMs = 1000,
}: UseWorkoutTimerOptions): UseWorkoutTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Calculate initial elapsed time
  useEffect(() => {
    if (!startTime || !isActive) {
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      return Math.floor((now - start) / 1000);
    };

    // Set initial value
    setElapsedSeconds(calculateElapsed());

    // Update on interval
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [startTime, isActive, intervalMs]);

  // Reset when timer becomes inactive
  useEffect(() => {
    if (!isActive) {
      setElapsedSeconds(0);
    }
  }, [isActive]);

  const reset = useCallback(() => {
    setElapsedSeconds(0);
  }, []);

  return {
    elapsedSeconds,
    formattedTime: formatElapsedTime(elapsedSeconds),
    reset,
  };
}

/**
 * Simple countdown timer hook
 */
export function useCountdownTimer(
  durationSeconds: number,
  onComplete?: () => void
): {
  remainingSeconds: number;
  formattedTime: string;
  isComplete: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
} {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const isComplete = remaining <= 0;

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remaining, onComplete]);

  return {
    remainingSeconds: remaining,
    formattedTime: formatElapsedTime(remaining),
    isComplete,
    start: useCallback(() => setIsRunning(true), []),
    pause: useCallback(() => setIsRunning(false), []),
    reset: useCallback(() => {
      setRemaining(durationSeconds);
      setIsRunning(false);
    }, [durationSeconds]),
  };
}

export default useWorkoutTimer;
