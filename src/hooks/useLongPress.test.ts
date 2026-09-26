import { act, renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLongPress } from './useLongPress';

function pointer(x = 0, y = 0, button = 0) {
  return { button, clientX: x, clientY: y } as ReactPointerEvent<HTMLElement>;
}

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes once after the hold duration and resets progress', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPress({ onComplete, durationMs: 700 }));

    act(() => result.current.handlers.onPointerDown(pointer()));
    expect(result.current.isHolding).toBe(true);

    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.progress).toBeGreaterThan(0);
    expect(result.current.progress).toBeLessThan(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.progress).toBe(0);
    expect(result.current.isHolding).toBe(false);
  });

  it('cancels when released early', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPress({ onComplete, durationMs: 700 }));

    act(() => result.current.handlers.onPointerDown(pointer()));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => result.current.handlers.onPointerUp());
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.progress).toBe(0);
  });

  it('cancels when the pointer moves beyond the tolerance (e.g. a scroll)', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPress({ onComplete, durationMs: 700, moveTolerancePx: 10 }));

    act(() => result.current.handlers.onPointerDown(pointer(0, 0)));
    act(() => result.current.handlers.onPointerMove(pointer(0, 4)));
    expect(result.current.isHolding).toBe(true);

    act(() => result.current.handlers.onPointerMove(pointer(0, 30)));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isHolding).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('ignores non-primary mouse buttons', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useLongPress({ onComplete }));

    act(() => result.current.handlers.onPointerDown(pointer(0, 0, 2)));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isHolding).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
