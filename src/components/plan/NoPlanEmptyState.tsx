import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wand2, Sparkles, Dumbbell, BookOpen, Target, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
};

const HeroMark = memo(function HeroMark() {
  return (
    <div className="relative w-28 h-28 mx-auto">
      {/* Warm glow halo */}
      <div
        className="absolute -inset-8 rounded-full opacity-40 animate-pulse"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(251,146,60,0.18) 50%, transparent 70%)',
        }}
      />
      {/* Secondary softer ring */}
      <div
        className="absolute -inset-4 rounded-full opacity-25"
        style={{
          background:
            'radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 60%)',
        }}
      />
      {/* Icon circle */}
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/80 via-primary/60 to-orange-500/50 flex items-center justify-center shadow-lg shadow-primary/20 animate-float border-2 border-white/10">
        <Wand2 className="h-12 w-12 text-white drop-shadow-lg" />
      </div>
    </div>
  );
});

const BenefitsStrip = memo(function BenefitsStrip() {
  const { t } = useTranslation();

  const benefits = [
    { icon: Target, label: t('plan.noplan.benefit_split') },
    { icon: Clock, label: t('plan.noplan.benefit_timing') },
    { icon: Dumbbell, label: t('plan.noplan.benefit_equipment') },
  ];

  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {benefits.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-orange-500/10 flex items-center justify-center shrink-0 border border-white/5">
              <Icon className="h-5 w-5 text-primary/80" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export function NoPlanEmptyState() {
  const { t } = useTranslation();

  return (
    <main className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Atmospheric background halo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(168,85,247,0.12) 0%, rgba(251,146,60,0.06) 40%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-xl mx-auto px-5 py-16 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Kicker */}
        <motion.p
          variants={itemVariants}
          className="text-xs font-bold tracking-[0.2em] uppercase text-primary/60 mb-4"
        >
          {t('plan.noplan.kicker')}
        </motion.p>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl font-black gradient-text mb-4 leading-tight"
        >
          {t('plan.noplan.headline')}
        </motion.h1>

        {/* Coach copy */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto mb-10"
        >
          {t('plan.noplan.coach_copy')}
        </motion.p>

        {/* Hero mark */}
        <motion.div variants={itemVariants} className="mb-10">
          <HeroMark />
        </motion.div>

        {/* Primary CTA */}
        <motion.div variants={itemVariants} className="mb-5">
          <Link to="/wizard" className="block sm:inline-block">
            <Button
              variant="gradient"
              size="xl"
              className="w-full sm:w-auto text-base gap-2.5"
            >
              <Sparkles className="h-5 w-5" />
              {t('plan.noplan.cta_primary')}
            </Button>
          </Link>
        </motion.div>

        {/* Secondary CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
        >
          <Link to="/exercises">
            <Button
              variant="outline"
              size="default"
              className="w-full sm:w-auto gap-2"
            >
              <Dumbbell className="h-4 w-4" />
              {t('plan.noplan.cta_exercises')}
            </Button>
          </Link>
          <Link to="/guide">
            <Button
              variant="ghost"
              size="default"
              className="w-full sm:w-auto gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {t('plan.noplan.cta_guide')}
            </Button>
          </Link>
        </motion.div>

        {/* Benefits strip */}
        <motion.div variants={itemVariants}>
          <BenefitsStrip />
        </motion.div>
      </motion.div>
    </main>
  );
}
