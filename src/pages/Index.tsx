import { useNavigate } from 'react-router-dom';
import { ArrowRight, Dumbbell, Target, FileText, Users, Sparkles, Zap, Crown } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StreakTracker, GoalVisualization, WelcomeHero, DailyQuote } from '@/components/motivation';
import { useAchievementStore } from '@/stores/achievementStore';
import { useTrainerStore } from '@/stores/trainerStore';
import { TrainerDashboard } from '@/components/motivation/TrainerDashboard';
import { motion, useInView } from 'framer-motion';
import { useRef, useMemo } from 'react';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { useTranslation, Trans } from 'react-i18next';

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { totalPlansGenerated } = useAchievementStore();
  const { isTrainerMode } = useTrainerStore();
  const hasActivity = totalPlansGenerated > 0;

  const features = useMemo(() => [
    { icon: Target, title: t('features.smart_goals.title'), description: t('features.smart_goals.description'), variant: 'strength' as const, gradient: 'from-orange-500 to-red-500' },
    { icon: Dumbbell, title: t('features.equipment.title'), description: t('features.equipment.description'), variant: 'achievement' as const, gradient: 'from-blue-500 to-cyan-500' },
    { icon: FileText, title: t('features.pdf_export.title'), description: t('features.pdf_export.description'), variant: 'magic' as const, gradient: 'from-purple-500 to-pink-500' },
    { icon: Users, title: t('features.trainer_mode.title'), description: t('features.trainer_mode.description'), variant: 'cosmic' as const, gradient: 'from-green-500 to-emerald-500' },
  ], [t]);

  // Refs for scroll-triggered animations
  const statsRef = useRef(null);
  const trainerRef = useRef(null);
  const featuresRef = useRef(null);

  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const trainerInView = useInView(trainerRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  return (
    <main>
      {/* Hero */}
      <WelcomeHero />

      {/* BRIDGE: Enhanced Cosmic Transition */}
      <section
        className="relative h-48 w-full -mt-[2px] z-30 pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      >
        {/* Animated gradient layers */}
        <motion.div
          className="absolute inset-0 w-[150%] left-1/2 -translate-x-1/2"
          animate={{
            background: [
              'radial-gradient(ellipse 80% 40% at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)',
              'radial-gradient(ellipse 90% 45% at 50% 50%, rgba(139,92,246,0.2) 0%, transparent 70%)',
              'radial-gradient(ellipse 80% 40% at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core bloom */}
        <motion.div
          className="absolute inset-0 w-[100%] left-1/2 -translate-x-1/2"
          style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 50%, rgba(236,72,153,0.25) 0%, transparent 60%)' }}
          animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Bright horizon line */}
        <motion.div
          className="absolute inset-0 w-[80%] h-full left-1/2 -translate-x-1/2"
          style={{ background: 'radial-gradient(ellipse 60% 3px at 50% 50%, rgba(255,255,255,0.9) 0%, transparent 70%)' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Secondary glow */}
        <div
          className="absolute inset-0 w-[120%] left-1/2 -translate-x-1/2"
          style={{ background: 'radial-gradient(ellipse 50% 25% at 50% 50%, rgba(168,85,247,0.1) 0%, transparent 60%)' }}
        />
      </section>

      {/* Zone 2: Middle Content - Feature Cards & Motivation */}
      <div className="bg-gradient-to-b from-background/80 via-purple-50/10 to-background/70 dark:from-[#0F0518]/80 dark:via-[#0a0210]/60 dark:to-[#05010a]/70 pb-32 pt-8 sm:pt-12 relative z-20 w-full -mt-12 sm:-mt-16 md:-mt-20 transition-colors duration-500">

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-50 dark:opacity-30" />

        {/* Quote sits comfortably inside the dark background */}
        <div className="container-content mb-20 pt-12 sm:pt-16 md:pt-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <DailyQuote />
          </motion.div>
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
                className="grid md:grid-cols-2 gap-6"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                >
                  <StreakTracker />
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                >
                  <GoalVisualization />
                </motion.div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Trainer Dashboard */}
        {isTrainerMode && (
          <motion.section
            ref={trainerRef}
            initial={{ opacity: 0, y: 40 }}
            animate={trainerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="px-responsive mb-20"
          >
            <div className="container-content">
              <TrainerDashboard />
            </div>
          </motion.section>
        )}

        {/* Features Section */}
        <motion.section
          ref={featuresRef}
          initial={{ opacity: 0 }}
          animate={featuresInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
          className="px-responsive pb-12"
        >
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
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
                {features.map((f, i) => (
                  <FeatureCard key={i} feature={f} index={i} />
                ))}
              </TooltipProvider>
            </motion.div>

            {/* CTA after features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-16 text-center"
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
              <p className="mt-4 text-sm text-muted-foreground">
                {t('features.no_credit_card')}
              </p>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}