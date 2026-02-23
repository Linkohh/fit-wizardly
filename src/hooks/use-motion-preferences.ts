import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { usePreferencesStore } from '@/hooks/useUserPreferences';

export function useMotionPreferences() {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotionEnabled = usePreferencesStore((state) => state.settings.reducedMotion);

  return useMemo(() => {
    const shouldReduceMotion = Boolean(prefersReducedMotion || reducedMotionEnabled);

    return {
      prefersReducedMotion,
      reducedMotionEnabled: Boolean(reducedMotionEnabled),
      shouldReduceMotion,
    };
  }, [prefersReducedMotion, reducedMotionEnabled]);
}
