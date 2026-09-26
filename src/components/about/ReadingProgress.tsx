import { motion, useScroll, useSpring } from 'framer-motion';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';

const PROGRESS_SPRING = { stiffness: 220, damping: 32, mass: 0.4 };

/** Thin gradient bar pinned under the header that fills as the page is scrolled. */
export function ReadingProgress() {
  const { shouldReduceMotion } = useMotionPreferences();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, PROGRESS_SPRING);

  return (
    <motion.div
      aria-hidden="true"
      data-testid="about-reading-progress"
      className="fixed inset-x-0 app-shell-sticky-offset z-20 h-0.5 origin-left bg-gradient-to-r from-primary via-secondary to-primary pointer-events-none"
      style={{ scaleX: shouldReduceMotion ? scrollYProgress : smoothProgress }}
    />
  );
}
