import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  MotionTilt,
  isNativeMotionTiltSupported,
  publishMotionTiltStatus,
  refreshMotionTiltStatus,
  subscribeToMotionTiltStatus,
  type MotionTiltSample,
} from '@/lib/motion-tilt';

const MAX_POINTER_DISTANCE = 300;
const DESKTOP_MAX_ROTATION_DEGREES = 5;
const MOBILE_MAX_ROTATION_DEGREES = 10;
const SENSOR_MAX_ANGLE = 18;
const SENSOR_DEAD_ZONE = 1.1;
const SENSOR_GAIN = 2.2;
const SENSOR_STARTUP_TIMEOUT_MS = 1600;
const SENSOR_BASELINE_SAMPLE_COUNT = 8;
const SENSOR_FRAME_BLEND = 0.42;
const TILT_SPRING = { stiffness: 140, damping: 24, mass: 0.82 };

type MotionPermissionResult = 'granted' | 'denied' | 'unsupported';

type SensorStatus = 'idle' | 'enabled' | 'denied' | 'unsupported' | 'error';

type DeviceOrientationPermissionState = 'granted' | 'denied';

type DeviceOrientationWithPermission = {
  requestPermission?: () => Promise<DeviceOrientationPermissionState>;
};

interface UseHeroTiltOptions {
  containerRef: RefObject<HTMLElement | null>;
  isEnabled: boolean;
  isMobileContext: boolean;
}

interface UseHeroTiltResult {
  rotateX: ReturnType<typeof useSpring>;
  rotateY: ReturnType<typeof useSpring>;
  handlePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerLeave: () => void;
  handlePointerUp: () => void;
  handlePointerCancel: () => void;
  enableMotion: (options?: { userInitiated?: boolean }) => Promise<MotionPermissionResult>;
  canEnableSensor: boolean;
  isTouchFallbackActive: boolean;
  isSensorActive: boolean;
  isEnablingMotion: boolean;
  sensorStatus: SensorStatus;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function applyDeadZone(value: number) {
  const magnitude = Math.abs(value);
  if (magnitude <= SENSOR_DEAD_ZONE) {
    return 0;
  }

  return Math.sign(value) * (magnitude - SENSOR_DEAD_ZONE);
}

function averageSamples(samples: MotionTiltSample[]) {
  const total = samples.reduce(
    (accumulator, sample) => ({
      pitch: accumulator.pitch + sample.pitch,
      roll: accumulator.roll + sample.roll,
    }),
    { pitch: 0, roll: 0 },
  );

  return {
    pitch: total.pitch / samples.length,
    roll: total.roll / samples.length,
  };
}

export function useHeroTilt({
  containerRef,
  isEnabled,
  isMobileContext,
}: UseHeroTiltOptions): UseHeroTiltResult {
  const rectRef = useRef<DOMRect | null>(null);
  const webSensorAttachedRef = useRef(false);
  const nativeListenerRef = useRef<PluginListenerHandle | null>(null);
  const sensorDataReceivedRef = useRef(false);
  const sensorBaselineRef = useRef<{ pitch: number; roll: number } | null>(null);
  const sensorBaselineSamplesRef = useRef<MotionTiltSample[]>([]);
  const sensorStartupTimeoutRef = useRef<number | null>(null);
  const pendingAnimationFrameRef = useRef<number | null>(null);
  const pendingTargetRef = useRef({ x: 0, y: 0 });
  const filteredTargetRef = useRef({ x: 0, y: 0 });
  const isEnablingMotionRef = useRef(false);

  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('idle');
  const [isTouchFallbackActive, setIsTouchFallbackActive] = useState(false);
  const [isEnablingMotion, setIsEnablingMotion] = useState(false);

  const hasWebSensorSupport = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.DeviceOrientationEvent !== 'undefined',
    [],
  );

  const usesNativeMotionTilt = isMobileContext && isNativeMotionTiltSupported();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const maxRotationDegrees = isMobileContext
    ? MOBILE_MAX_ROTATION_DEGREES
    : DESKTOP_MAX_ROTATION_DEGREES;

  const rotateX = useSpring(
    useTransform(
      pointerY,
      [-MAX_POINTER_DISTANCE, MAX_POINTER_DISTANCE],
      [maxRotationDegrees, -maxRotationDegrees],
    ),
    TILT_SPRING,
  );
  const rotateY = useSpring(
    useTransform(
      pointerX,
      [-MAX_POINTER_DISTANCE, MAX_POINTER_DISTANCE],
      [-maxRotationDegrees, maxRotationDegrees],
    ),
    TILT_SPRING,
  );

  useEffect(() => {
    isEnablingMotionRef.current = isEnablingMotion;
  }, [isEnablingMotion]);

  const clearSensorStartupTimeout = useCallback(() => {
    if (sensorStartupTimeoutRef.current !== null) {
      window.clearTimeout(sensorStartupTimeoutRef.current);
      sensorStartupTimeoutRef.current = null;
    }
  }, []);

  const clearAnimationFrame = useCallback(() => {
    if (pendingAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingAnimationFrameRef.current);
      pendingAnimationFrameRef.current = null;
    }
  }, []);

  const resetSensorCalibration = useCallback(() => {
    sensorDataReceivedRef.current = false;
    sensorBaselineRef.current = null;
    sensorBaselineSamplesRef.current = [];
  }, []);

  const resetTilt = useCallback(() => {
    clearAnimationFrame();
    pendingTargetRef.current = { x: 0, y: 0 };
    filteredTargetRef.current = { x: 0, y: 0 };
    pointerX.set(0);
    pointerY.set(0);
  }, [clearAnimationFrame, pointerX, pointerY]);

  const updateRect = useCallback(() => {
    if (containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
  }, [containerRef]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [updateRect]);

  const scheduleTiltTarget = useCallback(
    (targetX: number, targetY: number) => {
      pendingTargetRef.current = {
        x: clamp(targetX, -MAX_POINTER_DISTANCE, MAX_POINTER_DISTANCE),
        y: clamp(targetY, -MAX_POINTER_DISTANCE, MAX_POINTER_DISTANCE),
      };

      if (pendingAnimationFrameRef.current !== null) {
        return;
      }

      pendingAnimationFrameRef.current = window.requestAnimationFrame(() => {
        pendingAnimationFrameRef.current = null;
        filteredTargetRef.current = {
          x:
            filteredTargetRef.current.x +
            (pendingTargetRef.current.x - filteredTargetRef.current.x) * SENSOR_FRAME_BLEND,
          y:
            filteredTargetRef.current.y +
            (pendingTargetRef.current.y - filteredTargetRef.current.y) * SENSOR_FRAME_BLEND,
        };

        pointerX.set(filteredTargetRef.current.x);
        pointerY.set(filteredTargetRef.current.y);
      });
    },
    [pointerX, pointerY],
  );

  const applySensorSample = useCallback(
    (sample: MotionTiltSample) => {
      if (!isEnabled) {
        return;
      }

      sensorDataReceivedRef.current = true;
      clearSensorStartupTimeout();

      if (!sensorBaselineRef.current) {
        sensorBaselineSamplesRef.current = [
          ...sensorBaselineSamplesRef.current,
          sample,
        ].slice(-SENSOR_BASELINE_SAMPLE_COUNT);

        if (sensorBaselineSamplesRef.current.length < SENSOR_BASELINE_SAMPLE_COUNT) {
          return;
        }

        sensorBaselineRef.current = averageSamples(sensorBaselineSamplesRef.current);
        return;
      }

      const relativeRoll = applyDeadZone(sample.roll - sensorBaselineRef.current.roll);
      const relativePitch = applyDeadZone(sample.pitch - sensorBaselineRef.current.pitch);

      const normalizedX =
        clamp(relativeRoll, -SENSOR_MAX_ANGLE, SENSOR_MAX_ANGLE) / SENSOR_MAX_ANGLE;
      const normalizedY =
        clamp(relativePitch, -SENSOR_MAX_ANGLE, SENSOR_MAX_ANGLE) / SENSOR_MAX_ANGLE;

      scheduleTiltTarget(
        normalizedX * MAX_POINTER_DISTANCE * SENSOR_GAIN,
        normalizedY * MAX_POINTER_DISTANCE * SENSOR_GAIN,
      );
    },
    [clearSensorStartupTimeout, isEnabled, scheduleTiltTarget],
  );

  const handleOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      if (beta == null || gamma == null) {
        return;
      }

      applySensorSample({
        pitch: beta,
        roll: gamma,
        timestamp: event.timeStamp,
      });
    },
    [applySensorSample],
  );

  const stopNativeMotion = useCallback(async () => {
    clearSensorStartupTimeout();

    if (nativeListenerRef.current) {
      const listener = nativeListenerRef.current;
      nativeListenerRef.current = null;
      await listener.remove();
    }

    if (usesNativeMotionTilt) {
      try {
        await MotionTilt.stop();
      } catch {
        // Ignore plugin shutdown failures to avoid trapping the UI in a bad state.
      }
    }
  }, [clearSensorStartupTimeout, usesNativeMotionTilt]);

  const detachWebSensorListener = useCallback(() => {
    if (!webSensorAttachedRef.current) {
      return;
    }

    window.removeEventListener('deviceorientation', handleOrientation);
    window.removeEventListener('deviceorientationabsolute', handleOrientation);
    webSensorAttachedRef.current = false;
  }, [handleOrientation]);

  const attachWebSensorListener = useCallback(() => {
    if (webSensorAttachedRef.current) {
      return true;
    }

    if (!hasWebSensorSupport) {
      return false;
    }

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    window.addEventListener('deviceorientationabsolute', handleOrientation, { passive: true });
    webSensorAttachedRef.current = true;
    return true;
  }, [handleOrientation, hasWebSensorSupport]);

  const applyPointerTilt = useCallback(
    (clientX: number, clientY: number) => {
      const rect = rectRef.current;
      if (!rect) {
        return;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const relativeX = clamp(
        clientX - centerX,
        -MAX_POINTER_DISTANCE,
        MAX_POINTER_DISTANCE,
      );
      const relativeY = clamp(
        clientY - centerY,
        -MAX_POINTER_DISTANCE,
        MAX_POINTER_DISTANCE,
      );

      pointerX.set(relativeX);
      pointerY.set(relativeY);
    },
    [pointerX, pointerY],
  );

  const enableMotion = useCallback(
    async (options?: { userInitiated?: boolean }): Promise<MotionPermissionResult> => {
      const userInitiated = options?.userInitiated ?? true;

      if (!isEnabled || !isMobileContext) {
        return 'unsupported';
      }

      setIsEnablingMotion(true);
      resetSensorCalibration();
      clearSensorStartupTimeout();

      if (usesNativeMotionTilt) {
        try {
          const status = await refreshMotionTiltStatus();

          if (!status.available) {
            setSensorStatus('unsupported');
            return 'unsupported';
          }

          if (status.permission !== 'granted') {
            setSensorStatus(status.permission === 'denied' ? 'denied' : 'idle');
            return status.permission === 'denied' ? 'denied' : 'unsupported';
          }

          setIsTouchFallbackActive(false);
          await stopNativeMotion();

          nativeListenerRef.current = await MotionTilt.addListener('tilt', applySensorSample);
          await MotionTilt.start();

          setSensorStatus('enabled');
          publishMotionTiltStatus({
            available: true,
            permission: 'granted',
            source: 'native',
          });

          sensorStartupTimeoutRef.current = window.setTimeout(() => {
            if (!sensorDataReceivedRef.current) {
              void stopNativeMotion();
              setSensorStatus('unsupported');
              resetTilt();
              publishMotionTiltStatus({
                available: false,
                permission: 'granted',
                source: 'native',
              });
            }
          }, SENSOR_STARTUP_TIMEOUT_MS);

          return 'granted';
        } catch {
          await stopNativeMotion();
          setSensorStatus('error');
          resetTilt();
          publishMotionTiltStatus({
            available: false,
            permission: 'denied',
            source: 'native',
          });
          return 'denied';
        } finally {
          setIsEnablingMotion(false);
        }
      }

      if (!hasWebSensorSupport) {
        setSensorStatus('unsupported');
        setIsTouchFallbackActive(true);
        publishMotionTiltStatus({
          available: false,
          permission: 'denied',
          source: 'web',
        });
        setIsEnablingMotion(false);
        return 'unsupported';
      }

      try {
        const deviceOrientationEvent =
          window.DeviceOrientationEvent as DeviceOrientationWithPermission | undefined;
        const deviceMotionEvent =
          window.DeviceMotionEvent as DeviceOrientationWithPermission | undefined;
        const hasExplicitPermissionApi =
          typeof deviceOrientationEvent?.requestPermission === 'function' ||
          typeof deviceMotionEvent?.requestPermission === 'function';

        if (
          userInitiated &&
          typeof deviceOrientationEvent?.requestPermission === 'function'
        ) {
          const permission = await deviceOrientationEvent.requestPermission();
          if (permission !== 'granted') {
            setSensorStatus('denied');
            setIsTouchFallbackActive(true);
            publishMotionTiltStatus({
              available: true,
              permission: 'denied',
              source: 'web',
            });
            return 'denied';
          }
        } else if (
          userInitiated &&
          typeof deviceMotionEvent?.requestPermission === 'function'
        ) {
          const permission = await deviceMotionEvent.requestPermission();
          if (permission !== 'granted') {
            setSensorStatus('denied');
            setIsTouchFallbackActive(true);
            publishMotionTiltStatus({
              available: true,
              permission: 'denied',
              source: 'web',
            });
            return 'denied';
          }
        }

        const didAttach = attachWebSensorListener();
        if (!didAttach) {
          setSensorStatus('unsupported');
          setIsTouchFallbackActive(true);
          publishMotionTiltStatus({
            available: false,
            permission: 'denied',
            source: 'web',
          });
          return 'unsupported';
        }

        setSensorStatus('enabled');
        setIsTouchFallbackActive(false);
        publishMotionTiltStatus({
          available: true,
          permission: userInitiated || !hasExplicitPermissionApi ? 'granted' : 'prompt',
          source: 'web',
        });

        sensorStartupTimeoutRef.current = window.setTimeout(() => {
          if (!sensorDataReceivedRef.current) {
            detachWebSensorListener();
            if (!userInitiated && hasExplicitPermissionApi) {
              setSensorStatus('idle');
              setIsTouchFallbackActive(true);
              publishMotionTiltStatus({
                available: true,
                permission: 'prompt',
                source: 'web',
              });
              return;
            }

            setSensorStatus('unsupported');
            setIsTouchFallbackActive(true);
            publishMotionTiltStatus({
              available: false,
              permission: 'denied',
              source: 'web',
            });
          }
        }, SENSOR_STARTUP_TIMEOUT_MS);

        return 'granted';
      } catch {
        detachWebSensorListener();
        setSensorStatus('error');
        setIsTouchFallbackActive(true);
        publishMotionTiltStatus({
          available: true,
          permission: 'denied',
          source: 'web',
        });
        return 'denied';
      } finally {
        setIsEnablingMotion(false);
      }
    },
    [
      applySensorSample,
      attachWebSensorListener,
      clearSensorStartupTimeout,
      detachWebSensorListener,
      hasWebSensorSupport,
      isEnabled,
      isMobileContext,
      resetSensorCalibration,
      resetTilt,
      stopNativeMotion,
      usesNativeMotionTilt,
    ],
  );

  useEffect(() => {
    if (!isEnabled) {
      detachWebSensorListener();
      void stopNativeMotion();
      clearSensorStartupTimeout();
      resetSensorCalibration();
      setSensorStatus('idle');
      setIsTouchFallbackActive(false);
      resetTilt();
      return;
    }

    if (!usesNativeMotionTilt && isMobileContext && !hasWebSensorSupport) {
      setSensorStatus('unsupported');
      setIsTouchFallbackActive(true);
    }

    return () => {
      detachWebSensorListener();
      void stopNativeMotion();
      clearSensorStartupTimeout();
      clearAnimationFrame();
    };
  }, [
    clearAnimationFrame,
    clearSensorStartupTimeout,
    detachWebSensorListener,
    hasWebSensorSupport,
    isEnabled,
    isMobileContext,
    resetSensorCalibration,
    resetTilt,
    stopNativeMotion,
    usesNativeMotionTilt,
  ]);

  useEffect(() => {
    if (!isEnabled || !isMobileContext || !usesNativeMotionTilt) {
      return;
    }

    return subscribeToMotionTiltStatus((status) => {
      if (status.source !== 'native') {
        return;
      }

      if (!status.available) {
        void stopNativeMotion();
        setSensorStatus('unsupported');
        resetTilt();
        return;
      }

      if (status.permission === 'denied') {
        void stopNativeMotion();
        setSensorStatus('denied');
        resetTilt();
        return;
      }

      if (
        status.permission === 'granted' &&
        !nativeListenerRef.current &&
        !isEnablingMotionRef.current
      ) {
        void enableMotion({ userInitiated: false });
      }
    });
  }, [enableMotion, isEnabled, isMobileContext, resetTilt, stopNativeMotion, usesNativeMotionTilt]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isEnabled) {
        return;
      }

      if (event.pointerType === 'touch' && !isTouchFallbackActive) {
        return;
      }

      applyPointerTilt(event.clientX, event.clientY);
    },
    [applyPointerTilt, isEnabled, isTouchFallbackActive],
  );

  const handlePointerLeave = useCallback(() => {
    if (!isEnabled) {
      return;
    }

    if (sensorStatus === 'enabled') {
      return;
    }

    resetTilt();
  }, [isEnabled, resetTilt, sensorStatus]);

  const canEnableSensor =
    isEnabled &&
    isMobileContext &&
    !usesNativeMotionTilt &&
    hasWebSensorSupport &&
    sensorStatus !== 'enabled' &&
    !isTouchFallbackActive;

  return {
    rotateX,
    rotateY,
    handlePointerMove,
    handlePointerLeave,
    handlePointerUp: handlePointerLeave,
    handlePointerCancel: handlePointerLeave,
    enableMotion,
    canEnableSensor,
    isTouchFallbackActive,
    isSensorActive: sensorStatus === 'enabled',
    isEnablingMotion,
    sensorStatus,
  };
}
