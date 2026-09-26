import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

interface UseLongPressOptions {
  /** Called once when the hold completes. */
  onComplete: () => void;
  /** Hold duration in milliseconds (default: 700ms). */
  durationMs?: number;
  /** Pointer travel in px that cancels the hold, so scrolling never triggers it (default: 10px). */
  moveTolerancePx?: number;
}

interface LongPressHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
}

interface UseLongPressResult {
  /** Hold progress from 0 to 1; resets to 0 on release or completion. */
  progress: number;
  isHolding: boolean;
  handlers: LongPressHandlers;
}

/**
 * Press-and-hold detection with live progress, driven by requestAnimationFrame.
 * Releasing, leaving, or moving beyond the tolerance cancels the hold.
 */
export function useLongPress({
  onComplete,
  durationMs = 700,
  moveTolerancePx = 10,
}: UseLongPressOptions): UseLongPressResult {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stopFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    stopFrame();
    startTimeRef.current = null;
    originRef.current = null;
    setIsHolding(false);
    setProgress(0);
  }, [stopFrame]);

  const tick = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const nextProgress = Math.min((timestamp - startTimeRef.current) / durationMs, 1);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        cancel();
        onCompleteRef.current();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    },
    [cancel, durationMs]
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      stopFrame();
      originRef.current = { x: event.clientX, y: event.clientY };
      startTimeRef.current = null;
      setIsHolding(true);
      frameRef.current = requestAnimationFrame(tick);
    },
    [stopFrame, tick]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const origin = originRef.current;
      if (!origin) return;
      const distance = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
      if (distance > moveTolerancePx) {
        cancel();
      }
    },
    [cancel, moveTolerancePx]
  );

  // Suppress the long-press context menu (iOS callout / Android menu) on the target.
  const onContextMenu = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  useEffect(() => stopFrame, [stopFrame]);

  return {
    progress,
    isHolding,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu,
    },
  };
}
