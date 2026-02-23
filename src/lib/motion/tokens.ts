import type { Transition } from 'framer-motion';

export const MOTION_DURATIONS = {
  instant: 0,
  fast: 0.16,
  base: 0.24,
  slow: 0.34,
} as const;

export const MOTION_EASINGS = {
  standard: [0.4, 0, 0.2, 1],
  entrance: [0.2, 0.8, 0.2, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export const MOTION_SPRINGS = {
  snappy: {
    type: 'spring',
    stiffness: 420,
    damping: 34,
    mass: 0.85,
  },
} satisfies Record<string, Transition>;

export type MotionDurationKey = keyof typeof MOTION_DURATIONS;
export type MotionEasingKey = keyof typeof MOTION_EASINGS;

export function getDuration(
  key: MotionDurationKey,
  shouldReduceMotion: boolean
): number {
  if (shouldReduceMotion) {
    return MOTION_DURATIONS.instant;
  }

  return MOTION_DURATIONS[key];
}

export function getTimedTransition(
  key: MotionDurationKey,
  shouldReduceMotion: boolean,
  easing: MotionEasingKey = 'standard'
): Transition {
  return {
    duration: getDuration(key, shouldReduceMotion),
    ease: MOTION_EASINGS[easing],
  };
}

export function getSpringTransition(
  key: keyof typeof MOTION_SPRINGS,
  shouldReduceMotion: boolean
): Transition {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }

  return MOTION_SPRINGS[key];
}
