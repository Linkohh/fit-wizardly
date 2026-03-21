import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export type MotionTiltPermission = 'granted' | 'prompt' | 'denied';
export type MotionTiltSource = 'native' | 'web';

export interface MotionTiltStatus {
  available: boolean;
  permission: MotionTiltPermission;
  source: MotionTiltSource;
}

export interface MotionTiltSample {
  pitch: number;
  roll: number;
  timestamp: number;
}

type MotionTiltPermissionResponse = {
  permission: Exclude<MotionTiltPermission, 'prompt'>;
};

type DeviceOrientationPermissionState = 'granted' | 'denied';

type DeviceOrientationWithPermission = {
  requestPermission?: () => Promise<DeviceOrientationPermissionState>;
};

type MotionTiltPlugin = {
  getStatus: () => Promise<MotionTiltStatus>;
  requestPermission: () => Promise<MotionTiltPermissionResponse>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  addListener: (
    eventName: 'tilt',
    listenerFunc: (sample: MotionTiltSample) => void,
  ) => Promise<PluginListenerHandle>;
  removeAllListeners: () => Promise<void>;
};

export const MotionTilt = registerPlugin<MotionTiltPlugin>('MotionTilt');

const DEFAULT_WEB_STATUS: MotionTiltStatus = {
  available: false,
  permission: 'denied',
  source: 'web',
};

const DEFAULT_NATIVE_STATUS: MotionTiltStatus = {
  available: false,
  permission: 'denied',
  source: 'native',
};

const motionTiltSubscribers = new Set<(status: MotionTiltStatus) => void>();

function notifyStatus(status: MotionTiltStatus) {
  cachedStatus = status;

  motionTiltSubscribers.forEach((subscriber) => {
    subscriber(status);
  });

  return status;
}

function normalizeStatus(
  partialStatus: Partial<MotionTiltStatus>,
  fallbackSource: MotionTiltSource,
): MotionTiltStatus {
  return {
    available: Boolean(partialStatus.available),
    permission: partialStatus.permission ?? 'denied',
    source: partialStatus.source ?? fallbackSource,
  };
}

function canRequestWebMotionPermission() {
  if (typeof window === 'undefined') {
    return false;
  }

  const deviceOrientationEvent =
    window.DeviceOrientationEvent as DeviceOrientationWithPermission | undefined;
  const deviceMotionEvent =
    window.DeviceMotionEvent as DeviceOrientationWithPermission | undefined;

  return (
    typeof deviceOrientationEvent?.requestPermission === 'function' ||
    typeof deviceMotionEvent?.requestPermission === 'function'
  );
}

function getWebMotionStatus(): MotionTiltStatus {
  if (typeof window === 'undefined') {
    return DEFAULT_WEB_STATUS;
  }

  const hasDeviceOrientationSupport = typeof window.DeviceOrientationEvent !== 'undefined';
  if (!hasDeviceOrientationSupport) {
    return DEFAULT_WEB_STATUS;
  }

  return {
    available: true,
    permission: canRequestWebMotionPermission() ? 'prompt' : 'granted',
    source: 'web',
  };
}

export function isNativeMotionTiltSupported() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('MotionTilt');
}

const SESSION_STORAGE_KEY = 'fitwizard-motion-granted';

export function markMotionPermissionGranted() {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, Date.now().toString());
  } catch {
    // localStorage may be unavailable in private browsing edge cases.
  }
}

export function wasMotionPermissionGranted(): boolean {
  try {
    const timestamp = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!timestamp) return false;
    // Expire after 30 days to avoid stale grants persisting forever.
    const age = Date.now() - Number(timestamp);
    return age < 30 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

let cachedStatus = isNativeMotionTiltSupported() ? DEFAULT_NATIVE_STATUS : getWebMotionStatus();

export function getCachedMotionTiltStatus() {
  return cachedStatus;
}

export function publishMotionTiltStatus(status: Partial<MotionTiltStatus>) {
  const fallbackSource: MotionTiltSource = isNativeMotionTiltSupported() ? 'native' : 'web';
  return notifyStatus(normalizeStatus(status, fallbackSource));
}

export function subscribeToMotionTiltStatus(
  subscriber: (status: MotionTiltStatus) => void,
) {
  motionTiltSubscribers.add(subscriber);
  subscriber(cachedStatus);

  return () => {
    motionTiltSubscribers.delete(subscriber);
  };
}

export async function refreshMotionTiltStatus() {
  if (isNativeMotionTiltSupported()) {
    try {
      const status = await MotionTilt.getStatus();
      return notifyStatus(normalizeStatus(status, 'native'));
    } catch {
      return notifyStatus(DEFAULT_NATIVE_STATUS);
    }
  }

  return notifyStatus(getWebMotionStatus());
}

export async function requestMotionTiltPermission() {
  if (isNativeMotionTiltSupported()) {
    try {
      const permissionResult = await MotionTilt.requestPermission();
      if (permissionResult.permission === 'granted') {
        markMotionPermissionGranted();
      }
      return notifyStatus({
        ...(await refreshMotionTiltStatus()),
        permission: permissionResult.permission,
        source: 'native',
      });
    } catch {
      return notifyStatus(DEFAULT_NATIVE_STATUS);
    }
  }

  const webStatus = getWebMotionStatus();
  if (!webStatus.available) {
    return notifyStatus(webStatus);
  }

  if (!canRequestWebMotionPermission()) {
    return notifyStatus(webStatus);
  }

  try {
    const deviceOrientationEvent =
      window.DeviceOrientationEvent as DeviceOrientationWithPermission | undefined;
    const deviceMotionEvent =
      window.DeviceMotionEvent as DeviceOrientationWithPermission | undefined;

    const permission =
      typeof deviceOrientationEvent?.requestPermission === 'function'
        ? await deviceOrientationEvent.requestPermission()
        : await deviceMotionEvent?.requestPermission?.();

    const resolvedPermission = permission === 'granted' ? 'granted' : 'denied';
    if (resolvedPermission === 'granted') {
      markMotionPermissionGranted();
    }
    return notifyStatus({
      available: true,
      permission: resolvedPermission,
      source: 'web',
    });
  } catch {
    return notifyStatus({
      available: true,
      permission: 'denied',
      source: 'web',
    });
  }
}
