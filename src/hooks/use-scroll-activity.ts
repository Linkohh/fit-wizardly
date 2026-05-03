import { useEffect } from 'react';

type UseScrollActivityOptions = {
  hideDelayMs?: number;
};

const SCROLL_ACTIVITY_ATTRIBUTE = 'data-scroll-active';
const DEFAULT_SCROLL_HIDE_DELAY_MS = 3000;
const SCROLL_KEYS = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  ' ',
]);

export function useScrollActivity({
  hideDelayMs = DEFAULT_SCROLL_HIDE_DELAY_MS,
}: UseScrollActivityOptions = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;
    let hideTimer: number | null = null;

    const clearHideTimer = () => {
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const hideScrollRail = () => {
      root.removeAttribute(SCROLL_ACTIVITY_ATTRIBUTE);
      hideTimer = null;
    };

    const showScrollRail = () => {
      root.setAttribute(SCROLL_ACTIVITY_ATTRIBUTE, 'true');
      clearHideTimer();
      hideTimer = window.setTimeout(hideScrollRail, hideDelayMs);
    };

    const handleKeyboardScroll = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) {
        showScrollRail();
      }
    };

    window.addEventListener('scroll', showScrollRail, { passive: true });
    window.addEventListener('wheel', showScrollRail, { passive: true });
    window.addEventListener('touchmove', showScrollRail, { passive: true });
    window.addEventListener('keydown', handleKeyboardScroll);

    return () => {
      clearHideTimer();
      root.removeAttribute(SCROLL_ACTIVITY_ATTRIBUTE);
      window.removeEventListener('scroll', showScrollRail);
      window.removeEventListener('wheel', showScrollRail);
      window.removeEventListener('touchmove', showScrollRail);
      window.removeEventListener('keydown', handleKeyboardScroll);
    };
  }, [hideDelayMs]);
}

