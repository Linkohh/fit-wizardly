import { useEffect, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

/** Swipes must start this close to the left edge (px). */
export const EDGE_ZONE_PX = 24;
/** Horizontal travel (px) that arms the gesture. */
export const TRIGGER_DISTANCE_PX = 80;
/**
 * After release, wait this long before navigating. Mobile browsers (iOS Safari, Chrome with
 * gesture navigation) run their own edge swipe; if they already went back (popstate), we skip ours.
 */
export const BROWSER_BACK_GRACE_MS = 350;

interface UseEdgeSwipeBackOptions {
  enabled: boolean;
  onBack: () => void;
  /** Fired once when the swipe crosses the trigger distance (for haptics). */
  onArm?: () => void;
}

interface UseEdgeSwipeBackResult {
  /** Horizontal drag distance in px (0 when idle). */
  dragX: MotionValue<number>;
  /** Vertical position of the touch, for placing the indicator. */
  touchY: MotionValue<number>;
  isDragging: boolean;
  isArmed: boolean;
}

interface GestureState {
  startX: number;
  startY: number;
  isArmed: boolean;
}

function isOverlayOpen(): boolean {
  // Radix dialogs/sheets (menu drawer, modals) handle their own dismissal.
  return document.querySelector('[role="dialog"][data-state="open"]') !== null;
}

/** Left-edge swipe-to-go-back for touch screens, deduplicated against the browser's own gesture. */
export function useEdgeSwipeBack({ enabled, onBack, onArm }: UseEdgeSwipeBackOptions): UseEdgeSwipeBackResult {
  const dragX = useMotionValue(0);
  const touchY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isArmed, setIsArmed] = useState(false);

  const gestureRef = useRef<GestureState | null>(null);
  const browserWentBackRef = useRef(false);
  const pendingTimeoutRef = useRef<number | null>(null);
  const onBackRef = useRef(onBack);
  const onArmRef = useRef(onArm);

  useEffect(() => {
    onBackRef.current = onBack;
    onArmRef.current = onArm;
  }, [onBack, onArm]);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      gestureRef.current = null;
      dragX.set(0);
      setIsDragging(false);
      setIsArmed(false);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.clientX > EDGE_ZONE_PX || isOverlayOpen()) return;

      browserWentBackRef.current = false;
      gestureRef.current = { startX: touch.clientX, startY: touch.clientY, isArmed: false };
      touchY.set(touch.clientY);
      setIsDragging(true);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      const touch = event.touches[0];
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = Math.abs(touch.clientY - gesture.startY);

      // Mostly vertical: the user is scrolling, not swiping back.
      if (deltaY > 30 && deltaY > deltaX) {
        reset();
        return;
      }

      dragX.set(Math.max(0, deltaX));
      touchY.set(touch.clientY);

      const shouldArm = deltaX >= TRIGGER_DISTANCE_PX;
      if (shouldArm !== gesture.isArmed) {
        gesture.isArmed = shouldArm;
        setIsArmed(shouldArm);
        if (shouldArm) onArmRef.current?.();
      }
    };

    const handleTouchEnd = () => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      const shouldGoBack = gesture.isArmed;
      reset();
      if (!shouldGoBack) return;

      pendingTimeoutRef.current = window.setTimeout(() => {
        pendingTimeoutRef.current = null;
        if (!browserWentBackRef.current) onBackRef.current();
      }, BROWSER_BACK_GRACE_MS);
    };

    const handlePopState = () => {
      browserWentBackRef.current = true;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', reset, { passive: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', reset);
      window.removeEventListener('popstate', handlePopState);
      if (pendingTimeoutRef.current !== null) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
      reset();
    };
  }, [enabled, dragX, touchY]);

  return { dragX, touchY, isDragging, isArmed };
}
