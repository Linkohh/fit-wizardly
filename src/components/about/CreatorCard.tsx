import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TargetAndTransition, Transition } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Dumbbell, RotateCcw } from 'lucide-react';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { cn } from '@/lib/utils';
import { ABOUT_PRESS_SPRING } from './aboutMotion';

/** 480px square crop in /public: sharp at 128px on 3× phones and 160px on 3× desktops. */
const CREATOR_AVATAR_SRC = '/creator-avatar.jpg';

/** Portrait sizing per breakpoint: phones → tablets (sm, 640px+) → desktop (md, 768px+). */
const AVATAR_SIZE_CLASS = 'h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40';

const AURA_RESTING_OPACITY = 0.45;

/** Slow 4s "breath": subtle enough to notice, calm enough to ignore. */
const AURA_BREATHE: { animate: TargetAndTransition; transition: Transition } = {
  animate: { opacity: [0.35, 0.6, 0.35], scale: [0.97, 1.03, 0.97] },
  transition: { duration: 4, ease: 'easeInOut', repeat: Infinity },
};

const FLIP_SPRING = { type: 'spring', stiffness: 170, damping: 22, mass: 0.9 } as const;

// Both faces share one grid cell, so the card is always as tall as its taller face.
const FACE_CLASS = 'col-start-1 row-start-1 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]';

/** Creator bio that flips (or cross-fades under reduced motion) to reveal a personal fact. */
export function CreatorCard() {
  const { t } = useTranslation();
  const { shouldReduceMotion } = useMotionPreferences();
  const [isFlipped, setIsFlipped] = useState(false);

  const faceVisibility = (isFront: boolean) =>
    shouldReduceMotion ? { opacity: isFront === !isFlipped ? 1 : 0 } : undefined;

  return (
    <motion.button
      type="button"
      aria-pressed={isFlipped}
      onClick={() => setIsFlipped((flipped) => !flipped)}
      whileTap={{ scale: 0.98 }}
      transition={ABOUT_PRESS_SPRING}
      className="block w-full rounded-2xl text-left [perspective:1200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <motion.div
        className="grid [transform-style:preserve-3d]"
        animate={shouldReduceMotion ? undefined : { rotateY: isFlipped ? 180 : 0 }}
        transition={FLIP_SPRING}
      >
        <motion.div
          aria-hidden={isFlipped}
          animate={faceVisibility(true)}
          className={cn(FACE_CLASS, 'flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card/60 p-5 text-center sm:flex-row sm:gap-6 sm:p-6 sm:text-left')}
        >
          {/* Portrait-sized: 128px phones → 144px tablets → 160px desktop. */}
          <div className={cn('relative shrink-0', AVATAR_SIZE_CLASS)}>
            {/* Soft aura: a blurred brand gradient behind the ring that slowly breathes. */}
            <motion.div
              aria-hidden="true"
              data-testid="creator-avatar-aura"
              className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary via-secondary to-primary blur-xl"
              initial={false}
              animate={shouldReduceMotion ? { opacity: AURA_RESTING_OPACITY, scale: 1 } : AURA_BREATHE.animate}
              transition={shouldReduceMotion ? { duration: 0 } : AURA_BREATHE.transition}
            />
            <div className="relative h-full w-full rounded-full bg-gradient-to-br from-primary to-secondary p-1 shadow-[0_0_24px_hsl(var(--primary)/0.35)]">
              <img
                src={CREATOR_AVATAR_SRC}
                alt={t('about.creator.avatar_alt')}
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                draggable={false}
                data-testid="creator-avatar"
                className="h-full w-full rounded-full bg-background object-cover ring-2 ring-background/60"
              />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{t('about.creator.name')}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{t('about.creator.role')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('about.creator.bio')}</p>
            <p className="mt-3 text-xs text-muted-foreground/70">{t('about.creator.flip_hint')}</p>
          </div>
        </motion.div>

        <motion.div
          aria-hidden={!isFlipped}
          animate={faceVisibility(false)}
          style={shouldReduceMotion ? undefined : { rotateY: 180 }}
          className={cn(FACE_CLASS, 'flex flex-col items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-secondary/10 p-5 text-center')}
        >
          <Dumbbell className="h-7 w-7 text-primary" aria-hidden="true" />
          <p className="font-display text-lg font-semibold">{t('about.creator.fact_title')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('about.creator.fact_body')}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground/70">
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            {t('about.creator.flip_back')}
          </p>
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
