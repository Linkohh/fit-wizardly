import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import {
  ABOUT_PRESS_SPRING,
  REVEAL_VIEWPORT,
  REVEAL_VISIBLE,
  STAGGER_STEP_SECONDS,
  getRevealInitial,
  getRevealTransition,
} from './aboutMotion';

const MILESTONE_KEYS = ['spark', 'build', 'wizard', 'today'] as const;
const LINE_SPRING = { stiffness: 120, damping: 28, mass: 0.5 };

/** Vertical timeline whose connecting line draws itself as the section scrolls through the viewport. */
export function StoryTimeline() {
  const { t } = useTranslation();
  const { shouldReduceMotion } = useMotionPreferences();
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 85%', 'end 55%'] });
  const lineProgress = useSpring(scrollYProgress, LINE_SPRING);

  return (
    <ol ref={listRef} className="relative space-y-6 pl-7">
      <span aria-hidden="true" className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 rounded-full bg-border/60" />
      <motion.span
        aria-hidden="true"
        data-testid="about-timeline-line"
        className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 origin-top rounded-full bg-gradient-to-b from-primary to-secondary"
        style={{ scaleY: shouldReduceMotion ? 1 : lineProgress }}
      />

      {MILESTONE_KEYS.map((key, index) => (
        <motion.li
          key={key}
          className="relative"
          initial={getRevealInitial(shouldReduceMotion)}
          whileInView={REVEAL_VISIBLE}
          viewport={REVEAL_VIEWPORT}
          transition={getRevealTransition(shouldReduceMotion, index * STAGGER_STEP_SECONDS)}
        >
          <motion.span
            aria-hidden="true"
            className="absolute -left-7 top-1 h-4 w-4 rounded-full border-2 border-background bg-gradient-to-br from-primary to-secondary shadow-md shadow-primary/30"
            initial={shouldReduceMotion ? false : { scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={REVEAL_VIEWPORT}
            transition={ABOUT_PRESS_SPRING}
          />
          <h3 className="font-semibold leading-tight">{t(`about.story.${key}_title`)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t(`about.story.${key}_body`)}</p>
        </motion.li>
      ))}
    </ol>
  );
}
