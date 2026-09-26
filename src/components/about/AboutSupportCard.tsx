import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, Info, LifeBuoy, Scale } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { APP_VERSION } from '@/lib/appInfo';
import { ABOUT_PRESS_SPRING } from './aboutMotion';
import { WhatsNewPanel } from './WhatsNewPanel';

interface SupportRow {
  to: string;
  labelKey: 'about' | 'guide' | 'legal';
  icon: LucideIcon;
}

const SUPPORT_ROWS: SupportRow[] = [
  { to: '/about', labelKey: 'about', icon: Info },
  { to: '/guide', labelKey: 'guide', icon: BookOpen },
  { to: '/legal', labelKey: 'legal', icon: Scale },
];

/** Settings-style group of low-prominence links (About, Guide, Legal) plus the app version. */
export function AboutSupportCard() {
  const { t } = useTranslation();
  const { shouldReduceMotion } = useMotionPreferences();
  const cardRef = useRef<HTMLDivElement>(null);
  const hasEnteredView = useInView(cardRef, { once: true, amount: 0.6 });
  const shouldShimmer = hasEnteredView && !shouldReduceMotion;
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  return (
    <Card ref={cardRef} className="border-border/50 shadow-sm relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-transparent" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <LifeBuoy className="h-5 w-5 text-primary" aria-hidden="true" />
          {t('profile.about_support.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {SUPPORT_ROWS.map(({ to, labelKey, icon: Icon }) => (
          <motion.div key={to} whileTap={{ scale: 0.97 }} transition={ABOUT_PRESS_SPRING}>
            <Link
              to={to}
              className="group flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-2">
                {/* One-time attention cue on the About row only; never repeats. */}
                <motion.span
                  className="inline-flex"
                  animate={labelKey === 'about' && shouldShimmer ? { rotate: [0, -12, 10, 0], scale: [1, 1.18, 1] } : undefined}
                  transition={{ duration: 0.7, delay: 0.25, ease: 'easeInOut' }}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </motion.span>
                {t(`profile.about_support.${labelKey}`)}
              </span>
              <ChevronRight
                className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-active:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </motion.div>
        ))}

        <button
          type="button"
          onClick={() => setIsWhatsNewOpen(true)}
          data-testid="profile-version-row"
          className="group flex min-h-11 w-full items-center justify-between rounded-md px-1 pt-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>{t('profile.about_support.version')}</span>
          <span className="flex items-center gap-1.5">
            <span className="tabular-nums" data-testid="profile-app-version">{APP_VERSION}</span>
            <span className="font-semibold text-primary">{t('about.whats_new.pill')}</span>
            <ChevronRight className="h-3.5 w-3.5 text-primary transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </button>
      </CardContent>

      <WhatsNewPanel open={isWhatsNewOpen} onOpenChange={setIsWhatsNewOpen} />
    </Card>
  );
}
