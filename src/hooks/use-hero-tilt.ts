import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';

const MAX_POINTER_DISTANCE = 300;
const MAX_ROTATION_DEGREES = 5;
const SENSOR_MAX_ANGLE = 35;
const TILT_SPRING = { stiffness: 100, damping: 30 };

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
  enableMotion: () => Promise<MotionPermissionResult>;
  canEnableSensor: boolean;
  isTouchFallbackActive: boolean;
  isSensorActive: boolean;
  isEnablingMotion: boolean;
  sensorStatus: SensorStatus;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useHeroTilt({
  containerRef,
  isEnabled,
  isMobileContext,
}: UseHeroTiltOptions): UseHeroTiltResult {
  const rectRef = useRef<DOMRect | null>(null);
  const sensorAttachedRef = useRef(false);

  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('idle');
  const [isTouchFallbackActive, setIsTouchFallbackActive] = useState(false);
  const [isEnablingMotion, setIsEnablingMotion] = useState(false);

  const hasSensorSupport = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.DeviceOrientationEvent !== 'undefined',
    []
  );

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(
      pointerY,
      [-MAX_POINTER_DISTANCE, MAX_POINTER_DISTANCE],
      [MAX_ROTATION_DEGREES, -MAX_ROTATION_DEGREES]
    ),
    TILT_SPRING
  );
  const rotateY = useSpring(
    useTransform(
      pointerX,
      [-MAX_POINTER_DISTANCE, MAX_POINTER_DISTANCE],
      [-MAX_ROTATION_DEGREES, MAX_ROTATION_DEGREES]
    ),
    TILT_SPRING
  );

  const resetTilt = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

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

  const applyPointerTilt = useCallback(
    (clientX: number, clientY: number) => {
      const rect = rectRef.current;
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const relativeX = clamp(clientX - centerX, -MAX_POINTER_DISTANCE, MAX_POINTER_DISTANCE);
      const relativeY = clamp(clientY - centerY, -MAX_POINTER_DISTANCE, MAX_POINTER_DISTANCE);

      pointerX.set(relativeX);
      pointerY.set(relativeY);
    },
    [pointerX, pointerY]
  );

  const handleOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      if (!isEnabled) return;

      const { beta, gamma } = event;
      if (beta == null || gamma == null) return;

      const normalizedX = clamp(gamma, -SENSOR_MAX_ANGLE, SENSOR_MAX_ANGLE) / SENSOR_MAX_ANGLE;
      const normalizedY = clamp(beta, -SENSOR_MAX_ANGLE, SENSOR_MAX_ANGLE) / SENSOR_MAX_ANGLE;

      pointerX.set(normalizedX * MAX_POINTER_DISTANCE);
      pointerY.set(normalizedY * MAX_POINTER_DISTANCE);
    },
    [isEnabled, pointerX, pointerY]
  );

  const detachSensorListener = useCallback(() => {
    if (!sensorAttachedRef.current) return;

    window.removeEventListener('deviceorientation', handleOrientation);
    sensorAttachedRef.current = false;
  }, [handleOrientation]);

  const attachSensorListener = useCallback(() => {
    if (sensorAttachedRef.current) {
      return true;
    }

    if (!hasSensorSupport) {
      return false;
    }

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    sensorAttachedRef.current = true;
    return true;
  }, [handleOrientation, hasSensorSupport]);

  useEffect(() => {
    if (!isEnabled) {
      detachSensorListener();
      setSensorStatus('idle');
      setIsTouchFallbackActive(false);
      resetTilt();
      return;
    }

    if (isMobileContext && !hasSensorSupport) {
      setSensorStatus('unsupported');
      setIsTouchFallbackActive(true);
    }

    return () => {
      detachSensorListener();
    };
  }, [detachSensorListener, hasSensorSupport, isEnabled, isMobileContext, resetTilt]);

  const enableMotion = useCallback(async (): Promise<MotionPermissionResult> => {
    if (!isEnabled || !isMobileContext) {
      return 'unsupported';
    }

    if (!hasSensorSupport) {
      setSensorStatus('unsupported');
      setIsTouchFallbackActive(true);
      return 'unsupported';
    }

    setIsEnablingMotion(true);

    try {
      const maybeDeviceOrientationEvent =
        window.DeviceOrientationEvent as DeviceOrientationWithPermission | undefined;

      if (typeof maybeDeviceOrientationEvent?.requestPermission === 'function') {
        const permission = await maybeDeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          setSensorStatus('denied');
          setIsTouchFallbackActive(true);
          return 'denied';
        }
      }

      const didAttach = attachSensorListener();
      if (!didAttach) {
        setSensorStatus('unsupported');
        setIsTouchFallbackActive(true);
        return 'unsupported';
      }

      setSensorStatus('enabled');
      setIsTouchFallbackActive(false);
      return 'granted';
    } catch {
      setSensorStatus('error');
      setIsTouchFallbackActive(true);
      return 'denied';
    } finally {
      setIsEnablingMotion(false);
    }
  }, [attachSensorListener, hasSensorSupport, isEnabled, isMobileContext]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isEnabled) return;

      if (event.pointerType === 'touch' && !isTouchFallbackActive) {
        return;
      }

      applyPointerTilt(event.clientX, event.clientY);
    },
    [applyPointerTilt, isEnabled, isTouchFallbackActive]
  );

  const handlePointerLeave = useCallback(() => {
    if (!isEnabled) return;
    if (sensorStatus === 'enabled') return;

    resetTilt();
  }, [isEnabled, resetTilt, sensorStatus]);

  const canEnableSensor =
    isEnabled &&
    isMobileContext &&
    hasSensorSupport &&
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
