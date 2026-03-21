import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nativeMocks = vi.hoisted(() => ({
  impact: vi.fn(() => Promise.resolve()),
  notification: vi.fn(() => Promise.resolve()),
  selectionStart: vi.fn(() => Promise.resolve()),
  selectionChanged: vi.fn(() => Promise.resolve()),
  selectionEnd: vi.fn(() => Promise.resolve()),
}));

async function loadUseHapticsModule({
  native,
  canUseWebHaptics,
}: {
  native: boolean;
  canUseWebHaptics: boolean;
}) {
  vi.resetModules();

  vi.doMock('@capacitor/core', () => ({
    Capacitor: {
      isNativePlatform: () => native,
    },
  }));

  vi.doMock('@/lib/platform', () => ({
    canUseWebHaptics: () => canUseWebHaptics,
  }));

  vi.doMock('@capacitor/haptics', () => ({
    Haptics: {
      impact: nativeMocks.impact,
      notification: nativeMocks.notification,
      selectionStart: nativeMocks.selectionStart,
      selectionChanged: nativeMocks.selectionChanged,
      selectionEnd: nativeMocks.selectionEnd,
    },
    ImpactStyle: {
      Light: 'LIGHT',
      Medium: 'MEDIUM',
      Heavy: 'HEAVY',
    },
    NotificationType: {
      Success: 'SUCCESS',
      Warning: 'WARNING',
      Error: 'ERROR',
    },
  }));

  return import('./useHaptics');
}

describe('useHaptics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('uses Capacitor haptics on native platforms', async () => {
    const { NotificationType, useHaptics } = await loadUseHapticsModule({
      native: true,
      canUseWebHaptics: false,
    });

    const { result } = renderHook(() => useHaptics());

    await act(async () => {
      await result.current.impact('heavy');
      await result.current.notification(NotificationType.Success);
      await result.current.selection();
    });

    expect(nativeMocks.impact).toHaveBeenCalledWith({ style: 'HEAVY' });
    expect(nativeMocks.notification).toHaveBeenCalledWith({ type: 'SUCCESS' });
    expect(nativeMocks.selectionStart).toHaveBeenCalledTimes(1);
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('falls back to web vibration on Android web', async () => {
    const { NotificationType, useHaptics } = await loadUseHapticsModule({
      native: false,
      canUseWebHaptics: true,
    });

    const { result } = renderHook(() => useHaptics());

    await act(async () => {
      await result.current.impact('medium');
      await result.current.notification(NotificationType.Warning);
      await result.current.selection();
    });

    expect(navigator.vibrate).toHaveBeenNthCalledWith(1, 20);
    expect(navigator.vibrate).toHaveBeenNthCalledWith(2, [100, 50, 100]);
    expect(navigator.vibrate).toHaveBeenNthCalledWith(3, 10);
    expect(nativeMocks.impact).not.toHaveBeenCalled();
  });

  it('does not attempt web haptics on unsupported web platforms', async () => {
    const { NotificationType, useHaptics } = await loadUseHapticsModule({
      native: false,
      canUseWebHaptics: false,
    });

    const { result } = renderHook(() => useHaptics());

    await act(async () => {
      await result.current.impact('light');
      await result.current.notification(NotificationType.Error);
      await result.current.selection();
    });

    expect(navigator.vibrate).not.toHaveBeenCalled();
    expect(nativeMocks.impact).not.toHaveBeenCalled();
  });
});
