import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { ABOUT_PRESS_SPRING } from '@/components/about/aboutMotion';
import { useGoBack } from '@/hooks/useGoBack';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Where to go when there is no in-app page to return to (e.g. opened from a shared link). */
  fallbackPath?: string;
  className?: string;
}

/** Compact "‹ Back" pill for secondary pages (About, Legal, Guide). */
export function BackButton({ fallbackPath = '/', className }: BackButtonProps) {
  const { t } = useTranslation();
  const { goBack, canGoBack } = useGoBack(fallbackPath);
  const label = canGoBack ? t('navigation.back') : t('navigation.back_home');

  return (
    <motion.button
      type="button"
      onClick={goBack}
      whileTap={{ scale: 0.95 }}
      transition={ABOUT_PRESS_SPRING}
      data-click-feedback-event="navigation"
      data-testid="page-back-button"
      className={cn(
        'group -ml-2 inline-flex min-h-11 items-center gap-1 rounded-full py-2 pl-2 pr-4 text-sm font-medium text-muted-foreground',
        'transition-colors duration-200 hover:bg-card/60 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <ChevronLeft
        className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5"
        aria-hidden="true"
      />
      {label}
    </motion.button>
  );
}
