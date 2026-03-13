import { useCallback, useEffect, useState } from 'react';
import {
  getCachedMotionTiltStatus,
  refreshMotionTiltStatus,
  requestMotionTiltPermission,
  subscribeToMotionTiltStatus,
  type MotionTiltStatus,
} from '@/lib/motion-tilt';

interface UseMotionTiltStatusOptions {
  refreshOnMount?: boolean;
}

interface UseMotionTiltStatusResult {
  status: MotionTiltStatus;
  isRefreshing: boolean;
  isRequestingPermission: boolean;
  refreshStatus: () => Promise<MotionTiltStatus>;
  requestPermission: () => Promise<MotionTiltStatus>;
}

export function useMotionTiltStatus(
  options: UseMotionTiltStatusOptions = {},
): UseMotionTiltStatusResult {
  const { refreshOnMount = true } = options;

  const [status, setStatus] = useState<MotionTiltStatus>(() => getCachedMotionTiltStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => subscribeToMotionTiltStatus(setStatus), []);

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);

    try {
      return await refreshMotionTiltStatus();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setIsRequestingPermission(true);

    try {
      return await requestMotionTiltPermission();
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  useEffect(() => {
    if (!refreshOnMount) {
      return;
    }

    void refreshStatus();
  }, [refreshOnMount, refreshStatus]);

  return {
    status,
    isRefreshing,
    isRequestingPermission,
    refreshStatus,
    requestPermission,
  };
}
