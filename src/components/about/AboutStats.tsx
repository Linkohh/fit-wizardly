import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCountUp } from '@/hooks/useCountUp';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { REVEAL_VISIBLE, getRevealInitial, getRevealTransition, STAGGER_STEP_SECONDS } from './aboutMotion';

/** Rounded-down size of the curated library in src/data/exerciseLibrary.json. */
const CURATED_EXERCISE_COUNT = 70;
const COUNT_UP_MS = 1200;

interface StatProps {
  value: number;
  suffix?: string;
  label: string;
  isActive: boolean;
  index: number;
}

function Stat({ value, suffix = '', label, isActive, index }: StatProps) {
  const { shouldReduceMotion } = useMotionPreferences();
  // Target stays 0 until visible, so the count starts from zero on first view.
  const count = useCountUp(isActive ? value : 0, COUNT_UP_MS, !shouldReduceMotion);

  return (
    <motion.div
      initial={getRevealInitial(shouldReduceMotion)}
      animate={isActive ? REVEAL_VISIBLE : undefined}
      transition={getRevealTransition(shouldReduceMotion, index * STAGGER_STEP_SECONDS * 2)}
      className="flex flex-col items-center gap-0.5"
    >
      <span className="font-display text-2xl font-bold tabular-nums gradient-text md:text-3xl">
        {count}
        {suffix}
      </span>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    </motion.div>
  );
}

export function AboutStats() {
  const { t, i18n } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const languageCount = Object.keys(i18n.options.resources ?? {}).length;

  return (
    <div ref={ref} className="grid grid-cols-3 gap-2 rounded-2xl border border-border/50 bg-card/40 px-3 py-4">
      <Stat value={CURATED_EXERCISE_COUNT} suffix="+" label={t('about.stats.exercises')} isActive={isInView} index={0} />
      <Stat value={languageCount} label={t('about.stats.languages')} isActive={isInView} index={1} />
      <Stat value={1} label={t('about.stats.mission')} isActive={isInView} index={2} />
    </div>
  );
}
