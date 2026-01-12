import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook for smooth number counting animations
 * Animates from 0 to target value using requestAnimationFrame
 *
 * @param target - The target number to count up to
 * @param duration - Animation duration in milliseconds (default: 1000ms)
 * @param enabled - Whether the animation should run (default: true)
 * @returns The current animated value
 */
export function useCountUp(
  target: number,
  duration: number = 1000,
  enabled: boolean = true
): number {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    // If animation is disabled, immediately set to target
    if (!enabled) {
      setCount(target);
      return;
    }

    // Reset when target changes
    startTimeRef.current = null;
    setCount(0);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Easing function (easeOutExpo for natural deceleration)
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentCount = Math.floor(easeOutExpo * target);
      setCount(currentCount);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we land exactly on the target
        setCount(target);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [target, duration, enabled]);

  return count;
}

/**
 * Hook variant that starts counting when component enters viewport
 * Useful for scroll-triggered animations
 *
 * @param target - The target number to count up to
 * @param duration - Animation duration in milliseconds (default: 1000ms)
 * @param inView - Whether the element is in viewport
 * @returns The current animated value
 */
export function useCountUpInView(
  target: number,
  duration: number = 1000,
  inView: boolean = true
): number {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (inView && !hasStarted) {
      setHasStarted(true);
    }
  }, [inView, hasStarted]);

  return useCountUp(target, duration, hasStarted);
}
