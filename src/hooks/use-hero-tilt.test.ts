import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHeroTilt } from './use-hero-tilt';

type MockDeviceOrientationEvent = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type MockDeviceMotionEvent = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

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
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setDeviceOrientationEvent(undefined);
    setDeviceMotionEvent(undefined);
  });

  it('attaches the sensor listener when permission is granted', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    setDeviceOrientationEvent({ requestPermission });

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      })
    );

    await act(async () => {
      await result.current.enableMotion();
    });

    const sensorListenerCalls = addEventListenerSpy.mock.calls.filter(
      ([eventName]) =>
        eventName === 'deviceorientation' || eventName === 'deviceorientationabsolute'
    );

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(result.current.sensorStatus).toBe('enabled');
    expect(result.current.isTouchFallbackActive).toBe(false);
    expect(sensorListenerCalls).toHaveLength(2);
  });

  it('falls back to touch tilt when permission is denied', async () => {
    setDeviceOrientationEvent({
      requestPermission: vi.fn().mockResolvedValue('denied'),
    });

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      })
    );

    await act(async () => {
      const permissionResult = await result.current.enableMotion();
      expect(permissionResult).toBe('denied');
    });

    expect(result.current.sensorStatus).toBe('denied');
    expect(result.current.isTouchFallbackActive).toBe(true);
    expect(result.current.canEnableSensor).toBe(false);
  });

  it('marks unsupported and enables touch fallback when sensor APIs are unavailable', async () => {
    setDeviceOrientationEvent(undefined);
    setDeviceMotionEvent(undefined);

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      })
    );

    await act(async () => {
      const permissionResult = await result.current.enableMotion();
      expect(permissionResult).toBe('unsupported');
    });

    expect(result.current.sensorStatus).toBe('unsupported');
    expect(result.current.isTouchFallbackActive).toBe(true);
  });

  it('removes the sensor listener on unmount after enabling motion', async () => {
    setDeviceOrientationEvent({
      requestPermission: vi.fn().mockResolvedValue('granted'),
    });

    const container = document.createElement('section');
    const containerRef = { current: container };

    const { result, unmount } = renderHook(() =>
      useHeroTilt({
        containerRef,
        isEnabled: true,
        isMobileContext: true,
      })
    );

    await act(async () => {
      await result.current.enableMotion();
    });

    unmount();

    const sensorRemoveCalls = removeEventListenerSpy.mock.calls.filter(
      ([eventName]) =>
        eventName === 'deviceorientation' || eventName === 'deviceorientationabsolute'
    );

    expect(sensorRemoveCalls).toHaveLength(2);
  });
});
