import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Eye, HeartHandshake, TrendingUp, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { cn } from '@/lib/utils';
import { ABOUT_PRESS_SPRING } from './aboutMotion';

interface Principle {
  key: 'clarity' | 'anywhere' | 'together' | 'longevity';
  icon: LucideIcon;
}

// Mirrors the "Our Story" arc: the question → the fix → the friend → your turn.
const PRINCIPLES: Principle[] = [
  { key: 'clarity', icon: Eye },
  { key: 'anywhere', icon: WifiOff },
  { key: 'together', icon: HeartHandshake },
  { key: 'longevity', icon: TrendingUp },
];

const LAYOUT_SPRING = { type: 'spring', stiffness: 380, damping: 34 } as const;

/** Mission statement plus principle tiles; tapping a tile expands it in place and collapses the others. */
export function MissionTiles() {
  const { t } = useTranslation();
  const { shouldReduceMotion } = useMotionPreferences();
  const [openKey, setOpenKey] = useState<Principle['key'] | null>(null);
  const layoutEnabled = !shouldReduceMotion;

  return (
    <div className="space-y-4">
      <blockquote className="border-l-2 border-primary pl-4 text-lg font-medium leading-snug">
        {t('about.mission.statement')}
      </blockquote>
      <p className="text-xs text-muted-foreground/70">{t('about.mission.tap_hint')}</p>

      <LayoutGroup>
        <motion.ul layout={layoutEnabled} className="space-y-2">
          {PRINCIPLES.map(({ key, icon: Icon }) => {
            const isOpen = openKey === key;
            const detailId = `about-principle-${key}`;

            return (
              <motion.li key={key} layout={layoutEnabled} transition={LAYOUT_SPRING}>
                <motion.button
                  type="button"
                  layout={layoutEnabled}
                  transition={LAYOUT_SPRING}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? detailId : undefined}
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'w-full rounded-xl border p-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isOpen ? 'border-primary/40 bg-primary/10' : 'border-border/50 bg-card/40 hover:bg-card/70'
                  )}
                >
                  <motion.div layout={layoutEnabled ? 'position' : false} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    </span>
                    <span className="flex-1 font-semibold">{t(`about.mission.${key}_title`)}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={shouldReduceMotion ? { duration: 0 } : ABOUT_PRESS_SPRING}
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </motion.span>
                  </motion.div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.p
                        id={detailId}
                        key="detail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: shouldReduceMotion ? 0 : 0.08 } }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="mt-2 pl-12 text-sm text-muted-foreground"
                      >
                        {t(`about.mission.${key}_body`)}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.li>
            );
          })}
        </motion.ul>
      </LayoutGroup>
    </div>
  );
}
