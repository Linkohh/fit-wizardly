import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, CalendarClock, Dumbbell, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 30 },
  },
};

const HeroMark = memo(function HeroMark() {
  return (
    <div className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48">
      <div
        className="absolute -inset-8 rounded-full opacity-40 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,0.28) 0%, rgba(249,115,22,0.22) 44%, transparent 72%)',
        }}
      />
      <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03]" />
      <div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-primary/25 via-transparent to-orange-500/15">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/12 bg-background/45 shadow-[0_18px_46px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          <Sparkles className="h-11 w-11 text-primary" />
        </div>
      </div>
    </div>
  );
});

function ProofPoint({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Target;
  label: string;
  detail: string;
}) {
  return (
    <div className="grid gap-3 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export function NoPlanEmptyState() {
  const { t } = useTranslation();

  const proofPoints = [
    {
      icon: Target,
      label: t('plan.noplan.proof_personalized', 'Personalized to your goal and training level'),
      detail: t('plan.noplan.proof_personalized_detail', 'Your split, volume, and exercise choices start from the outcome you actually want.'),
    },
    {
      icon: CalendarClock,
      label: t('plan.noplan.proof_schedule', 'Sized to your weekly schedule'),
      detail: t('plan.noplan.proof_schedule_detail', 'We match the plan to the days and session length you can sustain in real life.'),
    },
    {
      icon: ShieldCheck,
      label: t('plan.noplan.proof_safety', 'Protective around limitations and equipment'),
      detail: t('plan.noplan.proof_safety_detail', 'Your equipment and constraints shape what gets recommended before the plan is built.'),
    },
  ];

  return (
    <main className="relative app-shell-page-min-height overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 72% 48% at 20% 18%, rgba(249,115,22,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 44% at 78% 18%, rgba(168,85,247,0.14) 0%, transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
        }}
      />

      <motion.div
        className="relative z-10 container-content py-10 sm:py-12 lg:py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
          <div className="max-w-2xl">
            <motion.p
              variants={itemVariants}
              className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/75"
            >
              {t('plan.noplan.kicker')}
            </motion.p>

            <motion.div
              variants={itemVariants}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
              <CalendarClock className="h-4 w-4" />
              {t('plan.noplan.time_to_plan', 'Takes about 2 minutes')}
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
            >
              {t('plan.noplan.headline')}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {t('plan.noplan.coach_copy')}
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8">
              <Link to="/wizard" className="block sm:inline-flex">
                <Button
                  variant="gradient"
                  size="xl"
                  className="w-full gap-2.5 sm:w-auto"
                >
                  <Sparkles className="h-5 w-5" />
                  {t('plan.noplan.cta_primary')}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-5 flex flex-wrap items-center gap-5 text-sm text-muted-foreground"
            >
              <Link to="/exercises" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                <Dumbbell className="h-4 w-4" />
                {t('plan.noplan.cta_exercises')}
              </Link>
              <Link to="/guide" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                <BookOpen className="h-4 w-4" />
                {t('plan.noplan.cta_guide')}
              </Link>
            </motion.div>
          </div>

          <motion.section
            variants={itemVariants}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-background/35 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-8"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(circle at top right, rgba(249,115,22,0.12), transparent 42%), radial-gradient(circle at bottom left, rgba(168,85,247,0.16), transparent 45%)',
              }}
            />

            <div className="relative">
              <HeroMark />

              <div className="mt-8 space-y-4">
                {proofPoints.map((point) => (
                  <ProofPoint
                    key={point.label}
                    icon={point.icon}
                    label={point.label}
                    detail={point.detail}
                  />
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </motion.div>
    </main>
  );
}
