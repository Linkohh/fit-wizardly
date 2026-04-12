import { useNavigate } from 'react-router-dom';
import { ArrowRight, Dumbbell, Target, FileText, Users, Zap, Crown } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAchievementStore } from '@/stores/achievementStore';
import { useAuthStore } from '@/stores/authStore';
import { useTrainerStore } from '@/stores/trainerStore';
import { Suspense, lazy, useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { FeatureCard, type FeatureCardFeature } from '@/components/landing/FeatureCard';
import type { Feature } from '@/components/landing/FeatureDetailModal';
import { useTranslation, Trans } from 'react-i18next';
import { cn } from '@/lib/utils';
import { isNativeApp } from '@/lib/platform';
import { InstallCoachSheet } from '@/components/install/InstallCoachSheet';
import { useInstallCoachAutoPromptReady } from '@/hooks/use-install-coach-auto-prompt-ready';

function HeroPaintSignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      onReady();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [onReady]);

  return null;
}

const PeriodizationTimeline = lazy(() =>
  import('@/components/analytics/PeriodizationTimeline').then((module) => ({
    default: module.PeriodizationTimeline,
  }))
);

const WelcomeHero = lazy(() =>
  import('@/components/motivation/WelcomeHero').then((module) => ({
    default: module.WelcomeHero,
  }))
);

const DailyQuote = lazy(() =>
  import('@/components/motivation/DailyQuote').then((module) => ({
    default: module.DailyQuote,
  }))
);

const TrainerDashboard = lazy(() =>
  import('@/components/motivation/TrainerDashboard').then((module) => ({
    default: module.TrainerDashboard,
  }))
);

const StreakTracker = lazy(() =>
  import('@/components/motivation/StreakTracker').then((module) => ({
    default: module.StreakTracker,
  }))
);

const GoalVisualization = lazy(() =>
  import('@/components/motivation/GoalVisualization').then((module) => ({
    default: module.GoalVisualization,
  }))
);

const FeatureDetailModal = lazy(() =>
  import('@/components/landing/FeatureDetailModal').then((module) => ({
    default: module.FeatureDetailModal,
  }))
);

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { totalPlansGenerated } = useAchievementStore();
  const { isTrainerMode } = useTrainerStore();
  const isTrainerAuthorized = useAuthStore((state) => state.profile?.is_trainer === true);
  const nativeApp = isNativeApp();
  const hasActivity = totalPlansGenerated > 0;
  const isTrainerEnabled = isTrainerAuthorized && isTrainerMode;

  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [quoteReady, setQuoteReady] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const installCoachAutoPromptReady = useInstallCoachAutoPromptReady({ heroReady });

  const features: FeatureCardFeature[] = useMemo(() => [
    { key: 'smart_goals', icon: Target, title: t('features.smart_goals.title'), description: t('features.smart_goals.description'), variant: 'strength' as const, gradient: 'from-orange-500 to-red-500' },
    { key: 'equipment', icon: Dumbbell, title: t('features.equipment.title'), description: t('features.equipment.description'), variant: 'achievement' as const, gradient: 'from-blue-500 to-cyan-500' },
    { key: 'pdf_export', icon: FileText, title: t('features.pdf_export.title'), description: t('features.pdf_export.description'), variant: 'magic' as const, gradient: 'from-purple-500 to-pink-500' },
    { key: 'trainer_mode', icon: Users, title: t('features.trainer_mode.title'), description: t('features.trainer_mode.description'), variant: 'cosmic' as const, gradient: 'from-green-500 to-emerald-500' },
  ], [t]);

  // Refs for scroll-triggered animations
  const statsRef = useRef(null);
  const trainerRef = useRef(null);
  const featuresRef = useRef(null);
  const quoteRef = useRef(null);

  const quoteInView = useInView(quoteRef, { once: true, margin: "0px 0px -20% 0px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const trainerInView = useInView(trainerRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!quoteInView) {
      return;
    }

    const timer = window.setTimeout(() => {
      setQuoteReady(true);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [quoteInView]);

  const handleHeroReady = useCallback(() => {
    setHeroReady(true);
  }, []);

  return (
    <main>
      {/* Hero */}
      <Suspense fallback={<div className="min-h-[62dvh]" />}>
        <WelcomeHero />
        <HeroPaintSignal onReady={handleHeroReady} />
      </Suspense>
      <InstallCoachSheet enableAutoPrompt={installCoachAutoPromptReady} />

      {/* Domain Intelligence: Periodization Timeline */}
      <Suspense fallback={<div className={cn("container-content", nativeApp ? "pt-10" : "pt-8")}>
        <div className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
      </div>}>
        <div className={cn(
          "container-content pb-4 lg:py-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200",
          nativeApp ? "pt-4" : "pt-2 lg:pt-4"
        )}>
          <PeriodizationTimeline />
        </div>
      </Suspense>

      {/* BRIDGE: Premium Luminous Seam — connects workout card to motivation zone */}
      <section
        className="relative h-28 sm:h-32 w-full -mt-[2px] z-30 pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        {/* Light mode: all-purple palette, toned down.  Dark mode: full intensity with white core. */}

        {/* Light-mode layers — purple-only, softer intensity */}
        <div className="absolute inset-0 dark:hidden">
          <div
            className="absolute inset-0 w-[130%] left-1/2 -translate-x-1/2"
            style={{ background: 'radial-gradient(ellipse 50% 12% at 50% 50%, rgba(157,78,255,0.25) 0%, rgba(157,78,255,0.06) 50%, transparent 100%)' }}
          />
          <motion.div
            className="absolute inset-0 w-[75%] left-1/2 -translate-x-1/2"
            animate={{ opacity: [0.6, 0.9, 0.6], scaleX: [1, 1.02, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: 'radial-gradient(ellipse 40% 3px at 50% 50%, rgba(139,92,246,0.8) 0%, rgba(139,92,246,0.3) 30%, transparent 70%)' }}
          />
          <motion.div
            className="absolute inset-0 w-[75%] left-1/2 -translate-x-1/2"
            animate={{ x: ['-100%', '100%'], opacity: [0, 0.45, 0.45, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: [0.4, 0, 0.2, 1], repeatDelay: 2 }}
            style={{ background: 'radial-gradient(ellipse 10% 4px at 50% 50%, rgba(139,92,246,0.6) 0%, rgba(139,92,246,0.15) 40%, transparent 100%)' }}
          />
        </div>

        {/* Dark-mode layers — full chromatic depth with luminous white core */}
        <div className="absolute inset-0 hidden dark:block">
          {/* Atmospheric haze */}
          <div
            className="absolute inset-0 w-[140%] left-1/2 -translate-x-1/2"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(157,78,255,0.06) 0%, transparent 70%)' }}
          />
          {/* Diffuse blob — wide warm bloom behind everything for atmosphere */}
          <motion.div
            className="absolute inset-0 w-[120%] left-1/2 -translate-x-1/2"
            animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(236,72,153,0.22) 0%, rgba(168,85,247,0.08) 50%, transparent 65%)' }}
          />
          {/* Primary bloom */}
          <motion.div
            className="absolute inset-0 w-[130%] left-1/2 -translate-x-1/2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: 'radial-gradient(ellipse 50% 12% at 50% 50%, rgba(157,78,255,0.4) 0%, rgba(157,78,255,0.1) 50%, transparent 100%)' }}
          />
          {/* Warm chromatic fringe */}
          <motion.div
            className="absolute inset-0 w-[110%] left-1/2 -translate-x-1/2"
            animate={{ opacity: [0.6, 0.85, 0.6] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            style={{ background: 'radial-gradient(ellipse 45% 8% at 50% 53%, rgba(255,77,204,0.2) 0%, transparent 70%)' }}
          />
          {/* Cool chromatic fringe */}
          <div
            className="absolute inset-0 w-[110%] left-1/2 -translate-x-1/2 opacity-50"
            style={{ background: 'radial-gradient(ellipse 40% 7% at 50% 47%, rgba(0,255,204,0.12) 0%, transparent 70%)' }}
          />
          {/* Razor core — luminous white edge */}
          <motion.div
            className="absolute inset-0 w-[75%] left-1/2 -translate-x-1/2"
            animate={{ opacity: [0.75, 1, 0.75], scaleX: [1, 1.02, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: 'radial-gradient(ellipse 40% 3px at 50% 50%, rgba(220,200,255,0.9) 0%, rgba(157,78,255,0.5) 30%, transparent 70%)' }}
          />
          {/* Traveling shimmer */}
          <motion.div
            className="absolute inset-0 w-[75%] left-1/2 -translate-x-1/2"
            animate={{ x: ['-100%', '100%'], opacity: [0, 0.7, 0.7, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: [0.4, 0, 0.2, 1], repeatDelay: 2 }}
            style={{ background: 'radial-gradient(ellipse 10% 4px at 50% 50%, rgba(255,255,255,0.5) 0%, rgba(220,200,255,0.2) 40%, transparent 100%)' }}
          />
        </div>
      </section>

      {/* Zone 2: Middle Content - Feature Cards & Motivation */}
      <div className="bg-gradient-to-b from-background/15 via-transparent to-background/20 dark:from-[#0F0518]/15 dark:via-transparent dark:to-[#05010a]/12 pb-10 pt-8 sm:pt-12 relative z-20 w-full -mt-8 sm:-mt-10 md:-mt-14 transition-colors duration-500" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-50 dark:opacity-30" />

        {/* Quote sits comfortably inside the dark background */}
        <div ref={quoteRef} className="container-content mb-20 pt-8 sm:pt-10 md:pt-14 relative">
          <Suspense fallback={<div className="min-h-[180px]" />}>
            {quoteReady ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="glass-card-hero rounded-3xl p-1"
              >
                <DailyQuote />
              </motion.div>
            ) : (
              <div className="min-h-[180px]" />
            )}
          </Suspense>
        </div>

        {/* Stats Section */}
        {hasActivity && (
          <motion.section
            ref={statsRef}
            initial={{ opacity: 0, y: 40 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="px-responsive mb-20"
          >
            <div className="container-content">
              <motion.div
                initial="hidden"
                animate={statsInView ? "visible" : "hidden"}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.15
                    }
                  }
                }}
                className="grid md:grid-cols-2 gap-6 [&>div]:glass-card-hero [&>div]:rounded-3xl [&>div]:p-1"
              >
                <Suspense fallback={<div className="h-48 rounded-2xl bg-muted/20 animate-pulse" />}>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                    }}
                  >
                    <StreakTracker />
                  </motion.div>
                </Suspense>
                <Suspense fallback={<div className="h-48 rounded-2xl bg-muted/20 animate-pulse" />}>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                    }}
                  >
                    <GoalVisualization />
                  </motion.div>
                </Suspense>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Trainer Dashboard */}
        {isTrainerEnabled && (
          <motion.section
            ref={trainerRef}
            initial={{ opacity: 0, y: 40 }}
            animate={trainerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="px-responsive mb-20"
          >
            <div className="container-content">
              <Suspense fallback={<div className="min-h-[240px]" />}>
                <TrainerDashboard />
              </Suspense>
            </div>
          </motion.section>
        )}

        {/* Features Section */}
        <motion.section
          ref={featuresRef}
          initial={{ opacity: 0 }}
          animate={featuresInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
          className="px-responsive pb-8"
        >
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-16 glass-card-hero rounded-3xl px-8 py-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={featuresInView ? { scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6"
              >
                <Zap className="h-4 w-4" />
                <span className="text-sm font-semibold">{t('features.badge')}</span>
              </motion.div>

              <h2 className="text-fluid-4xl md:text-fluid-5xl font-black text-foreground tracking-tight mb-4">
                <Trans i18nKey="features.title" components={{ 1: <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary" /> }} />
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t('features.subtitle')}
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <TooltipProvider delayDuration={200}>
                {features.map((f) => (
                  <FeatureCard
                    key={f.key}
                    feature={f}
                    onClick={() => setSelectedFeature(f)}
                  />
                ))}
              </TooltipProvider>
            </motion.div>

            {/* Feature Detail Modal */}
            {selectedFeature ? (
              <Suspense fallback={null}>
                <FeatureDetailModal
                  feature={selectedFeature}
                  isOpen={true}
                  onClose={() => setSelectedFeature(null)}
                />
              </Suspense>
            ) : null}

            {/* CTA after features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-12 text-center"
            >
              <motion.button
                onClick={() => navigate('/wizard')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary via-purple-500 to-secondary text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 cursor-pointer"
              >
                <Crown className="h-5 w-5" />
                {t('features.cta')}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
              <p className="mt-4 text-sm text-muted-foreground dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {t('features.no_credit_card')}
              </p>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
