import type { Transition } from 'framer-motion';
import { MOTION_EASINGS } from '@/lib/motion/tokens';

/** Gentle spring for press rebounds and pop-ins on the About page. */
export const ABOUT_PRESS_SPRING: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 30,
  mass: 0.7,
};

/** Scroll-reveal entrance; falls back to a short opacity fade under reduced motion. */
export function getRevealTransition(shouldReduceMotion: boolean, delay = 0): Transition {
  if (shouldReduceMotion) {
    return { duration: 0.2, delay };
  }

  return { duration: 0.5, ease: MOTION_EASINGS.entrance, delay };
}

export function getRevealInitial(shouldReduceMotion: boolean) {
  return shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 };
}

export const REVEAL_VISIBLE = { opacity: 1, y: 0 };

/** Reveal once, when a fifth of the element is on screen. */
export const REVEAL_VIEWPORT = { once: true, amount: 0.2 } as const;

/** Delay between sibling items entering view. */
export const STAGGER_STEP_SECONDS = 0.06;
