import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollActivity } from './use-scroll-activity';

describe('useScrollActivity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.removeAttribute('data-scroll-active');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-scroll-active');
    vi.useRealTimers();
  });

  it('marks the document active while scrolling and clears after the delay', () => {
    renderHook(() => useScrollActivity({ hideDelayMs: 3000 }));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(document.documentElement).toHaveAttribute('data-scroll-active', 'true');

    act(() => {
      vi.advanceTimersByTime(2999);
    });

    expect(document.documentElement).toHaveAttribute('data-scroll-active', 'true');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(document.documentElement).not.toHaveAttribute('data-scroll-active');
  });

  it('keeps the rail active for wheel, touch, and keyboard scrolling', () => {
    renderHook(() => useScrollActivity({ hideDelayMs: 3000 }));

    act(() => {
      window.dispatchEvent(new WheelEvent('wheel'));
    });
    expect(document.documentElement).toHaveAttribute('data-scroll-active', 'true');

    act(() => {
      vi.advanceTimersByTime(2000);
      window.dispatchEvent(new Event('touchmove'));
      vi.advanceTimersByTime(2000);
    });
    expect(document.documentElement).toHaveAttribute('data-scroll-active', 'true');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
      vi.advanceTimersByTime(3000);
    });
    expect(document.documentElement).not.toHaveAttribute('data-scroll-active');
  });

  it('removes timers and document state on cleanup', () => {
    const { unmount } = renderHook(() => useScrollActivity({ hideDelayMs: 3000 }));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(document.documentElement).toHaveAttribute('data-scroll-active', 'true');

    unmount();

    expect(document.documentElement).not.toHaveAttribute('data-scroll-active');

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(document.documentElement).not.toHaveAttribute('data-scroll-active');
  });
});

