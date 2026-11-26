import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStatusBarTheme } from './useStatusBarTheme';
import { resetNativeChromeForTests, STATUS_BAR_COLORS } from './nativeChrome';
import { useThemeStore } from '@/stores/themeStore';

const mocks = vi.hoisted(() => ({
  native: false,
  platform: 'web' as 'ios' | 'android' | 'web',
  hydrated: true,
  setStyle: vi.fn(async () => undefined),
  setBackgroundColor: vi.fn(async () => undefined),
  hide: vi.fn(async () => undefined),
  startRestSync: vi.fn(),
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => mocks.native,
  getNativePlatform: () => mocks.platform,
}));

vi.mock('@/hooks/useStoresHydrated', () => ({
  useStoresHydrated: () => mocks.hydrated,
}));

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setStyle: mocks.setStyle, setBackgroundColor: mocks.setBackgroundColor },
  Style: { Dark: 'DARK', Light: 'LIGHT', Default: 'DEFAULT' },
}));

vi.mock('./restNotificationSync', () => ({
  startRestNotificationSync: mocks.startRestSync,
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: { hide: mocks.hide },
}));

function setNative(platform: 'ios' | 'android' | 'web') {
  mocks.native = platform !== 'web';
  mocks.platform = platform;
}

describe('useStatusBarTheme', () => {
  beforeEach(() => {
    resetNativeChromeForTests();
    setNative('web');
    mocks.hydrated = true;
    mocks.setStyle.mockClear();
    mocks.setBackgroundColor.mockClear();
    mocks.hide.mockClear();
    mocks.startRestSync.mockClear();
    act(() => useThemeStore.getState().setMode('dark'));
  });

  it('does nothing on the web', async () => {
    renderHook(() => useStatusBarTheme());
    // Give any (wrongly) scheduled dynamic imports a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocks.setStyle).not.toHaveBeenCalled();
    expect(mocks.hide).not.toHaveBeenCalled();
  });

  it('uses light text for the dark theme and follows theme changes on iOS', async () => {
    setNative('ios');
    renderHook(() => useStatusBarTheme());
    await waitFor(() => expect(mocks.setStyle).toHaveBeenCalledWith({ style: 'DARK' }));
    expect(mocks.setBackgroundColor).not.toHaveBeenCalled();

    act(() => useThemeStore.getState().setMode('light'));
    await waitFor(() => expect(mocks.setStyle).toHaveBeenLastCalledWith({ style: 'LIGHT' }));
  });

  it('also paints the bar on Android, and survives Android 15+ rejecting it', async () => {
    setNative('android');
    mocks.setBackgroundColor.mockRejectedValueOnce(new Error('Not available on Android 15+'));
    renderHook(() => useStatusBarTheme());
    await waitFor(() =>
      expect(mocks.setBackgroundColor).toHaveBeenCalledWith({ color: STATUS_BAR_COLORS.dark }),
    );
    expect(mocks.setStyle).toHaveBeenCalledWith({ style: 'DARK' });
  });

  it('hides the splash screen once the stores have hydrated, only once', async () => {
    setNative('ios');
    mocks.hydrated = false;
    const { rerender } = renderHook(() => useStatusBarTheme());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocks.hide).not.toHaveBeenCalled();

    mocks.hydrated = true;
    rerender();
    await waitFor(() => expect(mocks.hide).toHaveBeenCalledTimes(1));

    renderHook(() => useStatusBarTheme());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocks.hide).toHaveBeenCalledTimes(1);
  });

  it('starts the rest-notification listener once the stores have hydrated, on native only', async () => {
    setNative('android');
    mocks.hydrated = false;
    const { rerender } = renderHook(() => useStatusBarTheme());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocks.startRestSync).not.toHaveBeenCalled();

    mocks.hydrated = true;
    rerender();
    await waitFor(() => expect(mocks.startRestSync).toHaveBeenCalled());
  });

  it('does not start the rest-notification listener on the web', async () => {
    renderHook(() => useStatusBarTheme());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocks.startRestSync).not.toHaveBeenCalled();
  });
});
