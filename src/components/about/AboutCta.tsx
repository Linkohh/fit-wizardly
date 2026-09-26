import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { REVEAL_VIEWPORT, REVEAL_VISIBLE, getRevealInitial, getRevealTransition } from './aboutMotion';

/** Where new users start building a plan. */
const START_PLAN_PATH = '/wizard';

/** Big, motivating call to action that turns the story into a first step. */
export function AboutCta() {
  const { t } = useTranslation();
  const { shouldReduceMotion } = useMotionPreferences();

  return (
    <motion.section
      aria-labelledby="about-cta-heading"
      initial={getRevealInitial(shouldReduceMotion)}
      whileInView={REVEAL_VISIBLE}
      viewport={REVEAL_VIEWPORT}
      transition={getRevealTransition(shouldReduceMotion)}
      className="relative overflow-clip rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card/60 to-secondary/20 px-6 py-10 text-center shadow-xl shadow-primary/10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl"
      />

      <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('about.cta.eyebrow')}</p>
      <h2 id="about-cta-heading" className="relative mt-2 font-display text-2xl font-bold md:text-3xl">
        {t('about.cta.title')}
      </h2>
      <p className="relative mx-auto mt-2 max-w-md text-muted-foreground">{t('about.cta.body')}</p>

      <Button
        asChild
        variant="gradient"
        size="xl"
        className="group relative mt-6 w-full max-w-sm text-lg"
      >
        <Link to={START_PLAN_PATH} data-click-feedback-event="navigation" data-testid="about-cta-start">
          {t('about.cta.button')}
          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </Button>
    </motion.section>
  );
}
