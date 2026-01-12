import { useEffect, useState, useCallback, useRef } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Distance to pull before triggering (default: 80px)
  resistance?: number; // Resistance factor (default: 2.5 - makes pull feel "heavier")
  enabled?: boolean; // Allow disabling the feature (default: true)
}

/**
 * Custom hook for implementing pull-to-refresh gesture on mobile
 *
 * Usage:
 * ```tsx
 * const { isRefreshing, pullDistance } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchData();
 *   }
 * });
 * ```
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true
}: PullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start pull if:
    // 1. Feature is enabled
    // 2. Already at top of page
    // 3. Not currently refreshing
    if (!enabled || isRefreshing) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || !enabled || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // Only track downward pulls
    if (diff > 0) {
      // Apply resistance to make it feel more natural
      const distance = Math.min(diff / resistance, threshold * 1.5);
      setPullDistance(distance);

      // Prevent default scroll behavior when pulling
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [enabled, isRefreshing, threshold, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || !enabled) return;

    isPulling.current = false;
    const finalDistance = pullDistance;

    // Reset pull distance with animation
    setPullDistance(0);

    // Trigger refresh if pulled far enough
    if (finalDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        // Small delay to show success state
        setTimeout(() => {
          setIsRefreshing(false);
        }, 300);
      }
    }

    // Reset tracking
    startY.current = 0;
    currentY.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Use passive: false to allow preventDefault
    const touchStartOptions = { passive: true };
    const touchMoveOptions = { passive: false }; // Need to prevent default
    const touchEndOptions = { passive: true };

    document.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    document.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    document.addEventListener('touchend', handleTouchEnd, touchEndOptions);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled]);

  return {
    isRefreshing,
    pullDistance, // Can be used for custom animations (e.g., rotating icon)
    threshold,
    // Helper to check if currently pulling
    isPulling: pullDistance > 0 && !isRefreshing
  };
}
