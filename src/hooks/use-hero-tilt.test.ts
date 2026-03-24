import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHeroTilt } from './use-hero-tilt';

type MockDeviceOrientationEvent = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type MockDeviceMotionEvent = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const mocks = vi.hoisted(() => {
  const removeListener = vi.fn(async () => {});
  const state = {
    nativeSupported: false,
    nativeStatus: {
      available: true,
      permission: 'granted' as 'granted' | 'denied',
      source: 'native' as const,
    },
    markMotionPermissionGranted: vi.fn(),
    wasMotionPermissionGranted: vi.fn(() => false),
    refreshMotionTiltStatus: vi.fn(async () => state.nativeStatus),
    publishMotionTiltStatus: vi.fn(),
    subscribeToMotionTiltStatus: vi.fn(() => () => {}),
    addListener: vi.fn(async () => ({
      remove: removeListener,
    })),
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    removeListener,
  };

  return state;
});

vi.mock('@/lib/motion-tilt', () => ({
  MotionTilt: {
    addListener: (...args: unknown[]) => (mocks.addListener as (...a: unknown[]) => unknown)(...args),
    start: () => mocks.start(),
    stop: () => mocks.stop(),
  },
  isNativeMotionTiltSupported: () => mocks.nativeSupported,
  markMotionPermissionGranted: () => mocks.markMotionPermissionGranted(),
  wasMotionPermissionGranted: () => mocks.wasMotionPermissionGranted(),
  publishMotionTiltStatus: (...args: unknown[]) => (mocks.publishMotionTiltStatus as (...a: unknown[]) => unknown)(...args),
  refreshMotionTiltStatus: () => mocks.refreshMotionTiltStatus(),
  subscribeToMotionTiltStatus: (...args: unknown[]) => (mocks.subscribeToMotionTiltStatus as (...a: unknown[]) => unknown)(...args),
}));

function setDeviceOrientationEvent(value: MockDeviceOrientationEvent | undefined) {
  Object.defineProperty(window, 'DeviceOrientationEvent', {
    configurable: true,
    writable: true,
    value,
  });
}

function setDeviceMotionEvent(value: MockDeviceMotionEvent | undefined) {
  Object.defineProperty(window, 'DeviceMotionEvent', {
    configurable: true,
    writable: true,
    value,
  });
}

describe('useHeroTilt', () => {
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.nativeSupported = false;
    mocks.nativeStatus = {
      available: true,
      permission: 'granted',
      source: 'native',
    };
    mocks.wasMotionPermissionGranted.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    setDeviceOrientationEvent(undefined);
    setDeviceMotionEvent(undefined);
  });

  it('prefers the native motion source in native app contexts', async () => {
    mocks.nativeSupported = true;

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      }),
    );

    await act(async () => {
      await result.current.enableMotion({ userInitiated: false });
    });

    expect(mocks.refreshMotionTiltStatus).toHaveBeenCalledTimes(1);
    expect(mocks.addListener).toHaveBeenCalledWith('tilt', expect.any(Function));
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(result.current.sensorStatus).toBe('enabled');
    expect(result.current.isTouchFallbackActive).toBe(false);
  });

  it('stays tilt-disabled in native mode when motion permission is denied', async () => {
    mocks.nativeSupported = true;
    mocks.nativeStatus = {
      available: true,
      permission: 'denied',
      source: 'native',
    };

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      }),
    );

    await act(async () => {
      const permissionResult = await result.current.enableMotion({ userInitiated: false });
      expect(permissionResult).toBe('denied');
    });

    expect(mocks.addListener).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
    expect(result.current.sensorStatus).toBe('denied');
    expect(result.current.isTouchFallbackActive).toBe(false);
  });

  it('falls back to touch tilt in browser mode when sensors are unavailable', async () => {
    setDeviceOrientationEvent(undefined);
    setDeviceMotionEvent(undefined);

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      }),
    );

    await act(async () => {
      const permissionResult = await result.current.enableMotion();
      expect(permissionResult).toBe('unsupported');
    });

    expect(result.current.sensorStatus).toBe('unsupported');
    expect(result.current.isTouchFallbackActive).toBe(true);
  });

  it('attaches browser orientation listeners when web motion permission is granted', async () => {
    setDeviceOrientationEvent({
      requestPermission: vi.fn().mockResolvedValue('granted'),
    });

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      }),
    );

    await act(async () => {
      await result.current.enableMotion();
    });

    const sensorListenerCalls = addEventListenerSpy.mock.calls.filter(
      ([eventName]) =>
        eventName === 'deviceorientation' || eventName === 'deviceorientationabsolute',
    );

    expect(sensorListenerCalls).toHaveLength(2);
    expect(result.current.sensorStatus).toBe('enabled');
  });

  it('preserves the prompt state on iOS web when auto-start times out before permission is granted', async () => {
    vi.useFakeTimers();
    setDeviceOrientationEvent({
      requestPermission: vi.fn().mockResolvedValue('granted'),
    });

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      }),
    );

    await act(async () => {
      await result.current.enableMotion({ userInitiated: false });
    });

    expect(mocks.publishMotionTiltStatus).toHaveBeenLastCalledWith({
      available: true,
      permission: 'prompt',
      source: 'web',
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.sensorStatus).toBe('idle');
    expect(result.current.isTouchFallbackActive).toBe(true);
    expect(mocks.publishMotionTiltStatus).toHaveBeenLastCalledWith({
      available: true,
      permission: 'prompt',
      source: 'web',
    });
  });

  it('removes the native listener and stops motion updates on unmount', async () => {
    mocks.nativeSupported = true;

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result, unmount } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      }),
    );

    await act(async () => {
      await result.current.enableMotion({ userInitiated: false });
    });

    await act(async () => {
      unmount();
    });

    expect(mocks.removeListener).toHaveBeenCalledTimes(1);
    expect(mocks.stop).toHaveBeenCalled();
  });
});
