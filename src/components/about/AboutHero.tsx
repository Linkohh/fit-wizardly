import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';
import { Confetti } from '@/components/ui/confetti';
import { useHeroTilt } from '@/hooks/use-hero-tilt';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLongPress } from '@/hooks/useLongPress';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { APP_VERSION } from '@/lib/appInfo';
import { hasSeenChangelog } from '@/lib/changelogSeen';
import { isNativeApp } from '@/lib/platform';
import { ABOUT_PRESS_SPRING } from './aboutMotion';
import { WhatsNewPanel } from './WhatsNewPanel';

const CELEBRATION_MS = 3000;
/** SVG units; the ring scales with its responsive container. */
const RING_VIEWBOX = 100;
const RING_RADIUS = 47;

export function AboutHero() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const { shouldReduceMotion } = useMotionPreferences();
  const { emit } = useInteractionFeedback();

  // Tilt follows the same opt-in rules as the home hero (Motion Tilt setting + session activation on mobile).
  const isMobile = useIsMobile();
  const isMobileContext = isNativeApp() || isMobile;
  const motionTiltEnabled = usePreferencesStore((state) => state.settings.motionTilt !== false);
  const mobileMotionEnabled = usePreferencesStore((state) => state.motionTiltActivatedThisSession);
  const tiltEnabled = motionTiltEnabled && !shouldReduceMotion && (!isMobileContext || mobileMotionEnabled);
  const { rotateX, rotateY, handlePointerMove, handlePointerLeave, handlePointerUp, handlePointerCancel, enableMotion } =
    useHeroTilt({ containerRef, isEnabled: tiltEnabled, isMobileContext });

  useEffect(() => {
    if (isMobileContext && tiltEnabled) {
      void enableMotion({ userInitiated: false });
    }
  }, [enableMotion, isMobileContext, tiltEnabled]);

  // Parallax: the hero recedes as it scrolls out of view.
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const parallaxOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  useEffect(() => {
    if (!isCelebrating) return;
    const timeout = window.setTimeout(() => setIsCelebrating(false), CELEBRATION_MS);
    return () => window.clearTimeout(timeout);
  }, [isCelebrating]);

  const handleSecretFound = useCallback(() => {
    void emit('success');
    toast.success(t('about.easter_egg'));
    if (!shouldReduceMotion) setIsCelebrating(true);
  }, [emit, shouldReduceMotion, t]);

  const { progress, isHolding, handlers } = useLongPress({ onComplete: handleSecretFound });

  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [hasUnreadNotes, setHasUnreadNotes] = useState(() => !hasSeenChangelog(APP_VERSION));
  const openWhatsNew = useCallback(() => {
    setIsWhatsNewOpen(true);
    setHasUnreadNotes(false);
  }, []);

  return (
    <>
      <motion.div
        ref={containerRef}
        style={shouldReduceMotion ? undefined : { scale: parallaxScale, opacity: parallaxOpacity }}
        className="origin-top [perspective:1000px]"
      >
        <motion.div
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={tiltEnabled ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
          className="glass-card relative overflow-hidden rounded-3xl border border-primary/15 px-6 py-10 text-center"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/25 to-secondary/25 blur-3xl"
          />

          {/* Icon: 112px on phones, 128px from md up; the hold-progress ring scales with it. */}
          <div className="relative mx-auto mb-5 h-[136px] w-[136px] md:h-[152px] md:w-[152px]" data-testid="about-hero-icon-frame">
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox={`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`}
            >
              <defs>
                <linearGradient id="about-ring-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
              </defs>
              <motion.circle
                cx={RING_VIEWBOX / 2}
                cy={RING_VIEWBOX / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="url(#about-ring-gradient)"
                strokeWidth={3}
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: progress, opacity: progress > 0 ? 1 : 0 }}
                transition={isHolding ? { duration: 0 } : ABOUT_PRESS_SPRING}
              />
            </svg>

            <motion.div
              {...handlers}
              data-testid="about-hero-icon"
              data-click-feedback="off"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
              transition={ABOUT_PRESS_SPRING}
              className="absolute inset-3 cursor-pointer select-none overflow-hidden rounded-[24%] shadow-xl shadow-primary/30 ring-1 ring-white/10"
              style={{ WebkitTouchCallout: 'none', touchAction: 'manipulation' }}
            >
              <img src="/app-icon-384.png" alt="" width={128} height={128} draggable={false} className="h-full w-full object-cover" />
            </motion.div>
          </div>

          <h1 className="font-display text-3xl font-bold gradient-text md:text-4xl">{t('about.title')}</h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t('about.tagline')}</p>

          {/* Version pill doubles as the entry point to the release notes. */}
          <motion.button
            type="button"
            onClick={openWhatsNew}
            whileTap={{ scale: 0.95 }}
            transition={ABOUT_PRESS_SPRING}
            data-testid="about-version-pill"
            className="group relative mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3.5 py-1.5 text-xs tabular-nums text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('about.version_label', { version: APP_VERSION })}
            <span aria-hidden="true" className="text-muted-foreground/40">·</span>
            <span className="font-semibold text-primary">{t('about.whats_new.pill')}</span>
            <ChevronRight className="h-3.5 w-3.5 text-primary transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            {hasUnreadNotes && (
              <span
                data-testid="about-version-unread"
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-gradient-to-br from-primary to-secondary"
              >
                <span className="sr-only">{t('about.whats_new.unread')}</span>
              </span>
            )}
          </motion.button>
        </motion.div>
      </motion.div>

      <WhatsNewPanel open={isWhatsNewOpen} onOpenChange={setIsWhatsNewOpen} />

      {/* Rendered outside the transformed hero so `position: fixed` spans the viewport. */}
      <Confetti isActive={isCelebrating} duration={CELEBRATION_MS} />
    </>
  );
}
