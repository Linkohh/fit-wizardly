import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrolledPastTop } from './use-scrolled-past-top';

function scrollWindowTo(position: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: position });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    vi.runAllTimers();
  });
}

describe('useScrolledPastTop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    vi.useRealTimers();
  });

  it('is false at the top of the page', () => {
    const { result } = renderHook(() => useScrolledPastTop());

    expect(result.current).toBe(false);
  });

  it('flips to true past the threshold and back to false at the top', () => {
    const { result } = renderHook(() => useScrolledPastTop(8));

    scrollWindowTo(8);
    expect(result.current).toBe(false);

    scrollWindowTo(120);
    expect(result.current).toBe(true);

    scrollWindowTo(0);
    expect(result.current).toBe(false);
  });

  it('starts true when the page is already scrolled on mount', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });

    const { result } = renderHook(() => useScrolledPastTop());

    expect(result.current).toBe(true);
  });

  it('stops listening after unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useScrolledPastTop());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    removeSpy.mockRestore();
  });
});
