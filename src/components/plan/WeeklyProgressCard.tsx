import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, TrendingUp, Trophy, Flame, Sparkles } from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface StatCellProps {
  icon: React.ReactNode;
  value: number;
  total?: number;
  label: string;
  suffix?: string;
  colorClass: string;
}

const StatCell = memo(function StatCell({
  icon,
  value,
  total,
  label,
  suffix,
  colorClass,
}: StatCellProps) {
  const animatedValue = useCountUp(value, 800);

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          colorClass === 'text-green-400' && 'bg-gradient-to-br from-green-400/15 to-green-400/5',
          colorClass === 'text-cyan-400' && 'bg-gradient-to-br from-cyan-400/15 to-cyan-400/5',
          colorClass === 'text-amber-400' && 'bg-gradient-to-br from-amber-400/15 to-amber-400/5',
          colorClass === 'text-orange-400' && 'bg-gradient-to-br from-orange-400/15 to-orange-400/5',
        )}
      >
        <span className={cn('h-4 w-4', colorClass)}>{icon}</span>
      </div>
      <div>
        <p className="text-lg font-bold leading-tight">
          {total !== undefined ? (
            <>
              <span className={colorClass}>{animatedValue}</span>
              <span className="text-muted-foreground/50 text-sm font-normal">/{total}</span>
            </>
          ) : (
            <span className={colorClass}>
              {animatedValue.toLocaleString()}
              {suffix && <span className="text-xs font-normal ml-0.5">{suffix}</span>}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
});

function formatVolume(volume: number): { value: number; suffix: string } {
  if (volume >= 1000) {
    return { value: Math.round(volume / 100) / 10, suffix: 'k' };
  }
  return { value: Math.round(volume), suffix: '' };
}

interface WeeklyProgressCardProps {
  planId: string;
}

export const WeeklyProgressCard = memo(function WeeklyProgressCard({
  planId,
}: WeeklyProgressCardProps) {
  const { t } = useTranslation();
  const currentWeek = usePlanStore((s) => s.currentWeek);
  const preferredWeightUnit = usePlanStore((s) => s.preferredWeightUnit);
  const getWeeklySummary = usePlanStore((s) => s.getWeeklySummary);
  const workoutLogs = usePlanStore((s) => s.workoutLogs);

  const summary = getWeeklySummary(planId, currentWeek);

  const streak = useMemo(() => {
    const planLogs = workoutLogs
      .filter((log) => log.planId === planId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    if (planLogs.length === 0) return 0;

    let count = 0;
    const now = new Date();
    const checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasLog = planLogs.some((log) => {
        const logDate = new Date(log.completedAt);
        return logDate >= dayStart && logDate < dayEnd;
      });

      if (hasLog) {
        count++;
      } else if (count > 0) {
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    return count;
  }, [workoutLogs, planId]);

  const hasData = summary && (summary.workoutsCompleted > 0 || summary.totalVolume > 0);

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="glass-premium rounded-2xl p-5 sm:p-6 mb-6 text-center">
          <Sparkles className="h-6 w-6 text-primary/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">
            {t('plan.progress.empty')}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {t('plan.progress.empty_hint')}
          </p>
        </div>
      </motion.div>
    );
  }

  const vol = formatVolume(summary.totalVolume);
  const prsHit = summary.personalRecords?.length ?? 0;
  const completionPct = Math.round(summary.completionRate * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="glass-premium rounded-2xl p-4 sm:p-6 mb-6">
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-primary/60 mb-4">
          {t('plan.progress.week_label', { week: currentWeek })}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          <StatCell
            icon={<CheckCircle2 className="h-4 w-4" />}
            value={summary.workoutsCompleted}
            total={summary.workoutsPlanned}
            label={t('plan.progress.workouts')}
            colorClass="text-green-400"
          />
          <StatCell
            icon={<TrendingUp className="h-4 w-4" />}
            value={vol.value}
            label={t('plan.progress.volume')}
            suffix={`${vol.suffix} ${preferredWeightUnit}`}
            colorClass="text-cyan-400"
          />
          <StatCell
            icon={<Trophy className="h-4 w-4" />}
            value={prsHit}
            label={t('plan.progress.prs')}
            colorClass="text-amber-400"
          />
          <StatCell
            icon={<Flame className="h-4 w-4" />}
            value={streak}
            label={t('plan.progress.streak')}
            suffix={t('plan.progress.days')}
            colorClass="text-orange-400"
          />
        </div>

        <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-purple-400 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
});
