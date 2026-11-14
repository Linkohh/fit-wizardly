import { useEffect, useState } from 'react';

const DEFAULT_THRESHOLD_PX = 8;

function isPastThreshold(thresholdPx: number): boolean {
  return typeof window !== 'undefined' && window.scrollY > thresholdPx;
}

/**
 * True once the window has scrolled past `thresholdPx` from the top.
 * Only re-renders when the answer flips, not on every scroll frame.
 */
export function useScrolledPastTop(thresholdPx: number = DEFAULT_THRESHOLD_PX): boolean {
  const [isScrolled, setIsScrolled] = useState(() => isPastThreshold(thresholdPx));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let frameId: number | null = null;

    const measure = () => {
      frameId = null;
      setIsScrolled(isPastThreshold(thresholdPx));
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(measure);
      }
    };

    // Covers a scroll position restored before this effect ran.
    measure();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [thresholdPx]);

  return isScrolled;
}
