import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, ArrowRight, Dumbbell } from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import { cn } from '@/lib/utils';

interface TrendData {
  lastWeight: number;
  lastReps: number;
  trendPct: number | null;
  estimated1RM: number;
}

function useTrendData(exerciseId: string): TrendData | null {
  const workoutLogs = usePlanStore((s) => s.workoutLogs);
  const getLastPerformance = usePlanStore((s) => s.getLastPerformance);

  return useMemo(() => {
    const last = getLastPerformance(exerciseId);
    if (!last || !last.sets || last.sets.length === 0) return null;

    const completedSets = last.sets.filter((s) => s.completed);
    if (completedSets.length === 0) return null;

    const heaviest = completedSets.reduce((best, s) =>
      s.weight > best.weight ? s : best
    );

    const lastWeight = heaviest.weight;
    const lastReps = heaviest.reps;
    const estimated1RM = Math.round(lastWeight * (1 + lastReps / 30));

    // Find the second-most-recent performance for trend
    const allLogs = workoutLogs
      .flatMap((log) => log.exercises)
      .filter((ex) => ex.exerciseId === exerciseId && !ex.skipped);

    let trendPct: number | null = null;
    if (allLogs.length >= 2) {
      const prevLog = allLogs[allLogs.length - 2];
      const prevCompleted = prevLog.sets.filter((s) => s.completed);
      if (prevCompleted.length > 0) {
        const prevMax = Math.max(...prevCompleted.map((s) => s.weight));
        if (prevMax > 0) {
          trendPct = Math.round(((lastWeight - prevMax) / prevMax) * 100);
        }
      }
    }

    return { lastWeight, lastReps, trendPct, estimated1RM };
  }, [exerciseId, workoutLogs, getLastPerformance]);
}

interface ExerciseQuickStatsProps {
  exerciseId: string;
}

export const ExerciseQuickStats = memo(function ExerciseQuickStats({
  exerciseId,
}: ExerciseQuickStatsProps) {
  const { t } = useTranslation();
  const preferredWeightUnit = usePlanStore((s) => s.preferredWeightUnit);
  const [expanded, setExpanded] = useState(false);

  const data = useTrendData(exerciseId);

  if (!data) return null;

  const { lastWeight, trendPct, estimated1RM } = data;
  const unit = preferredWeightUnit;

  const trendDirection = trendPct === null ? null : trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';

  const TrendIcon =
    trendDirection === 'up' ? TrendingUp :
    trendDirection === 'down' ? TrendingDown :
    ArrowRight;

  const trendLabel =
    trendPct === null ? '' :
    trendPct > 0 ? `+${trendPct}%` :
    trendPct < 0 ? `${trendPct}%` :
    '0%';

  return (
    <div className="mt-0.5">
      {/* Collapsed: compact trend pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors',
          'bg-white/5 hover:bg-white/10',
          trendDirection === 'up' && 'text-green-400',
          trendDirection === 'down' && 'text-red-400',
          trendDirection === 'flat' && 'text-amber-400',
          trendDirection === null && 'text-muted-foreground',
        )}
        aria-label="Toggle exercise stats"
      >
        {trendDirection && <TrendIcon className="h-2.5 w-2.5" />}
        {trendLabel && <span>{trendLabel}</span>}
        {!trendLabel && <span>{lastWeight}{unit}</span>}
      </button>

      {/* Expanded: full stats badges */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {/* Last weight */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 border border-white/10 text-muted-foreground">
                <Dumbbell className="h-2.5 w-2.5" />
                {lastWeight}{unit} {t('plan.quick_stats.last')}
              </span>

              {/* Trend */}
              {trendDirection && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    trendDirection === 'up' && 'text-green-400 bg-green-400/10 border-green-400/20',
                    trendDirection === 'flat' && 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                    trendDirection === 'down' && 'text-red-400 bg-red-400/10 border-red-400/20',
                  )}
                >
                  <TrendIcon className="h-2.5 w-2.5" />
                  {trendLabel}
                </span>
              )}

              {/* Estimated 1RM */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 border border-primary/20 text-primary/80">
                {t('plan.quick_stats.est_1rm')}: {estimated1RM}{unit}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
