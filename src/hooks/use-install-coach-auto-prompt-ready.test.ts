import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_RESOLVED_EVENT,
  CONSENT_STORAGE_KEY,
} from '@/lib/consent';
import { useInstallCoachAutoPromptReady } from './use-install-coach-auto-prompt-ready';

describe('useInstallCoachAutoPromptReady', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('stays false until consent is resolved', () => {
    const { result } = renderHook(() =>
      useInstallCoachAutoPromptReady({ heroReady: true }),
    );

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe(false);

    act(() => {
      localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());
      window.dispatchEvent(new Event(CONSENT_RESOLVED_EVENT));
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe(true);
  });

  it('waits for hero readiness even when consent is already stored', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());

    const { result, rerender } = renderHook(
      ({ heroReady }) => useInstallCoachAutoPromptReady({ heroReady }),
      {
        initialProps: { heroReady: false },
      },
    );

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe(false);

    rerender({ heroReady: true });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe(true);
  });
});
