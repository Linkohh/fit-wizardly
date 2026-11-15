import { useCallback, useLayoutEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { getMuscleById } from '../../../data/muscles';
import type { Muscle, MuscleLayer, ViewType } from '../../../types';

type ClientPoint = { clientX: number; clientY: number };

export type TouchMuscleHoverHandler = (muscle: Muscle | null, point?: ClientPoint) => void;

const MOVE_TOLERANCE = 10;
const TOUCH_MUSCLE_ATTRIBUTE = 'data-touch-preview-muscle';

interface TouchGesture {
  pointerId: number;
  canvas: SVGSVGElement;
  startMuscle: Muscle;
  startPoint: ClientPoint;
  point: ClientPoint;
  timer: number;
  phase: 'waiting' | 'dragging' | 'previewing';
}

interface TouchPreviewOptions {
  enabled: boolean;
  view: ViewType;
  layer: MuscleLayer;
  longPressMs: number;
  onTouchMuscleHover?: TouchMuscleHoverHandler;
  onMuscleClick: (muscle: Muscle) => void;
}

function getTouchPath(target: EventTarget | null, canvas: SVGSVGElement) {
  const path = target instanceof Element ? target.closest(`[${TOUCH_MUSCLE_ATTRIBUTE}]`) : null;
  return path && canvas.contains(path) ? path : null;
}

function preventTouchScroll(event: TouchEvent) {
  if (event.cancelable && getTouchPath(event.target, event.currentTarget as SVGSVGElement)) {
    event.preventDefault();
  }
}

function getClientPoint({ clientX, clientY }: ClientPoint): ClientPoint {
  return { clientX, clientY };
}

function movedPastTolerance(start: ClientPoint, point: ClientPoint) {
  return Math.hypot(point.clientX - start.clientX, point.clientY - start.clientY) > MOVE_TOLERANCE;
}

function getMuscleAtPoint(canvas: SVGSVGElement, point: ClientPoint) {
  const target = canvas.ownerDocument.elementFromPoint?.(point.clientX, point.clientY);
  const id = getTouchPath(target ?? null, canvas)?.getAttribute(TOUCH_MUSCLE_ATTRIBUTE);
  return id ? getMuscleById(id) : undefined;
}

export function useTouchMusclePreview({
  enabled, view, layer, longPressMs, onTouchMuscleHover, onMuscleClick,
}: TouchPreviewOptions) {
  const touch = useRef<TouchGesture | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const lastPressWasTouch = useRef(false);
  const isTouchActive = useCallback(() => touch.current !== null, []);

  const setCanvas = useCallback((canvas: SVGSVGElement | null) => {
    canvasRef.current?.removeEventListener('touchstart', preventTouchScroll);
    canvasRef.current = canvas;
    // Browser scroll arbitration may ignore touch-action on an SVG path.
    if (enabled) canvas?.addEventListener('touchstart', preventTouchScroll, { passive: false });
  }, [enabled]);

  const stopTouch = useCallback(() => {
    if (touch.current) window.clearTimeout(touch.current.timer);
    touch.current = null;
  }, []);

  useLayoutEffect(() => stopTouch, [enabled, view, layer, stopTouch]);

  const updatePreview = (gesture: TouchGesture) => {
    onTouchMuscleHover?.(getMuscleAtPoint(gesture.canvas, gesture.point) ?? null, gesture.point);
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch' && (event.isPrimary === false || touch.current)) return;
    lastPressWasTouch.current = false;
    if (event.pointerType !== 'touch') return;

    const canvas = event.currentTarget;
    const startPath = getTouchPath(event.target, canvas);
    const id = startPath?.getAttribute(TOUCH_MUSCLE_ATTRIBUTE);
    const startMuscle = id ? getMuscleById(id) : undefined;
    if (!startMuscle) return;

    const point = getClientPoint(event);
    const gesture: TouchGesture = {
      pointerId: event.pointerId, canvas, startMuscle,
      startPoint: point, point, timer: 0, phase: 'waiting',
    };
    touch.current = gesture;
    lastPressWasTouch.current = true;
    // The SVG stays in place when highlighting reorders the paths.
    if (event.isTrusted) canvas.setPointerCapture?.(event.pointerId);
    onTouchMuscleHover?.(null);
    gesture.timer = window.setTimeout(() => {
      gesture.phase = 'previewing';
      updatePreview(gesture);
    }, longPressMs);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const gesture = touch.current;
    if (event.pointerType !== 'touch' || !gesture || gesture.pointerId !== event.pointerId) return;
    gesture.point = getClientPoint(event);
    if (gesture.phase === 'previewing') {
      updatePreview(gesture);
    } else if (gesture.phase === 'waiting' && movedPastTolerance(gesture.startPoint, gesture.point)) {
      window.clearTimeout(gesture.timer);
      gesture.phase = 'dragging';
    }
  };

  const finishTouch = (event: PointerEvent<SVGSVGElement>) => {
    const gesture = touch.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    stopTouch();
    if (gesture.phase === 'previewing') onTouchMuscleHover?.(null);
    if (event.type !== 'pointerup' || gesture.phase !== 'waiting') return;
    if (movedPastTolerance(gesture.startPoint, event)) return;
    const releasedMuscle = getMuscleAtPoint(gesture.canvas, event);
    if (releasedMuscle?.id === gesture.startMuscle.id) onMuscleClick(releasedMuscle);
  };

  const handleClickCapture = (event: MouseEvent<SVGSVGElement>) => {
    const { pointerType } = event.nativeEvent as globalThis.PointerEvent;
    // Older Safari reports the compatibility click as a MouseEvent.
    if (pointerType === 'touch' || (!pointerType && event.detail > 0 && lastPressWasTouch.current)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleContextMenu = (event: MouseEvent<SVGSVGElement>) => {
    if (touch.current) event.preventDefault();
  };

  return {
    setCanvas,
    isTouchActive,
    handlers: enabled ? {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishTouch,
      onPointerCancel: finishTouch,
      onLostPointerCapture: finishTouch,
      onClickCapture: handleClickCapture,
      onContextMenu: handleContextMenu,
    } : undefined,
  };
}
