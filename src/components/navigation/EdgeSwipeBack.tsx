import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useTransform } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEdgeSwipeBack, TRIGGER_DISTANCE_PX } from '@/hooks/useEdgeSwipeBack';
import { useGoBack } from '@/hooks/useGoBack';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { cn } from '@/lib/utils';

/** Pages where swiping back makes no sense (home, or flows with their own navigation). */
const DISABLED_PATHS = new Set(['/', '/onboarding']);

const INDICATOR_SIZE = 40;

/**
 * Global left-edge swipe-back for touch devices (phones, tablets, native apps).
 * Renders a chevron that follows the thumb and turns solid once the swipe will trigger.
 */
export function EdgeSwipeBack() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { goBack } = useGoBack('/');
  const { emit } = useInteractionFeedback();
  const { shouldReduceMotion } = useMotionPreferences();

  const handleArm = useCallback(() => {
    void emit('select', { channel: 'haptic' });
  }, [emit]);

  const { dragX, touchY, isDragging, isArmed } = useEdgeSwipeBack({
    enabled: !DISABLED_PATHS.has(pathname),
    onBack: goBack,
    onArm: handleArm,
  });

  // Slides in from off-screen, stopping just inside the edge.
  const indicatorX = useTransform(dragX, [0, TRIGGER_DISTANCE_PX], [-INDICATOR_SIZE, 12], { clamp: true });
  const indicatorOpacity = useTransform(dragX, [0, TRIGGER_DISTANCE_PX * 0.4], [0, 1], { clamp: true });
  const indicatorTop = useTransform(touchY, (y) => y - INDICATOR_SIZE / 2);

  if (!isDragging) return null;

  return (
    <motion.div
      aria-hidden="true"
      data-testid="edge-swipe-indicator"
      data-armed={isArmed}
      title={t('navigation.swipe_back')}
      className="pointer-events-none fixed left-0 z-[60]"
      style={{ x: indicatorX, top: indicatorTop, opacity: indicatorOpacity }}
    >
      <motion.div
        animate={{ scale: isArmed && !shouldReduceMotion ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 26 }}
        className={cn(
          'flex items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors duration-150',
          isArmed
            ? 'border-transparent bg-gradient-to-br from-primary to-secondary text-white shadow-primary/40'
            : 'border-border/60 bg-card/80 text-foreground'
        )}
        style={{ width: INDICATOR_SIZE, height: INDICATOR_SIZE }}
      >
        <ChevronLeft className="h-5 w-5" />
      </motion.div>
    </motion.div>
  );
}
