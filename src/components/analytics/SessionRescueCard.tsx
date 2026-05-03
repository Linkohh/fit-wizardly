import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Dumbbell, LifeBuoy, ListChecks, Signal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildSessionRescue, type SessionRescueStatus } from '@/lib/analyticsIntelligence';
import { cn } from '@/lib/utils';
import { usePlanStore } from '@/stores/planStore';
import { useReadinessStore } from '@/stores/readinessStore';
import type { Plan, WorkoutLog } from '@/types/fitness';
import { InsightQualityBadge } from './InsightQualityBadge';

interface SessionRescueCardProps {
  now?: Date;
}

const statusMeta: Record<SessionRescueStatus, { label: string; badge: string }> = {
  full_session_ok: {
    label: 'Full Session OK',
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  },
  rescue_35: {
    label: '35 Min Rescue',
    badge: 'border-secondary/30 bg-secondary/10 text-secondary',
  },
  rescue_25: {
    label: '25 Min Rescue',
    badge: 'border-primary/30 bg-primary/10 text-primary',
  },
  rescue_15: {
    label: '15 Min Rescue',
    badge: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  },
  needs_plan: {
    label: 'Needs Plan',
    badge: 'border-muted-foreground/20 bg-muted/40 text-muted-foreground',
  },
};

function chooseTargetDayIndex(currentPlan: Plan | null, workoutLogs: WorkoutLog[]) {
  if (!currentPlan || currentPlan.workoutDays.length === 0) return null;
  const currentPlanLogs = workoutLogs.filter((log) => log.planId === currentPlan.id);
  if (currentPlanLogs.length === 0) return currentPlan.workoutDays[0].dayIndex;

  return currentPlan.workoutDays
    .map((day) => {
      const lastCompletedAt = currentPlanLogs
        .filter((log) => log.dayIndex === day.dayIndex)
        .map((log) => new Date(log.completedAt).getTime())
        .sort((a, b) => b - a)[0];
      return { dayIndex: day.dayIndex, lastCompletedAt: lastCompletedAt ?? Number.NEGATIVE_INFINITY };
    })
    .sort((a, b) => a.lastCompletedAt - b.lastCompletedAt || a.dayIndex - b.dayIndex)[0].dayIndex;
}

export function SessionRescueCard({ now }: SessionRescueCardProps) {
  const currentPlan = usePlanStore((state) => state.currentPlan);
  const workoutLogs = usePlanStore((state) => state.workoutLogs);
  const readinessLogs = useReadinessStore((state) => state.logs);
  const analysisNow = useMemo(() => now ?? new Date(), [now]);
  const targetDayIndex = useMemo(() => chooseTargetDayIndex(currentPlan, workoutLogs), [currentPlan, workoutLogs]);
  const rescue = useMemo(
    () => buildSessionRescue({ currentPlan, targetDayIndex, workoutLogs, readinessLogs, now: analysisNow }),
    [currentPlan, targetDayIndex, workoutLogs, readinessLogs, analysisNow],
  );
  const meta = statusMeta[rescue.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <Card variant="glass" className="h-full overflow-hidden border-primary/15">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="gradient-text flex items-center gap-2">
                <LifeBuoy className="h-5 w-5" />
                Session Rescue
              </CardTitle>
              <CardDescription>Today&apos;s compact plan if time or readiness is tight.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <InsightQualityBadge quality={rescue.status === 'needs_plan' ? 'needs_data' : rescue.confidence} />
              <Badge variant="outline" className={cn('gap-1.5', meta.badge)}>
                <Signal className="h-3.5 w-3.5" />
                {meta.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[0.65fr_1fr]">
            <div className="rounded-lg border border-border/50 bg-background/35 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                Target
              </div>
              <p className="font-display text-4xl font-bold leading-none">{rescue.recommendedDuration || '--'}</p>
              <p className="mt-1 text-sm text-muted-foreground">minutes · {rescue.targetDayName ?? 'No plan day'}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                <ListChecks className="h-4 w-4" />
                Next action
              </div>
              <p className="text-sm leading-relaxed">{rescue.nextAction}</p>
              <p className="mt-2 text-xs text-muted-foreground">{rescue.reason}</p>
            </div>
          </div>

          {rescue.recommendations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-5 text-center text-sm text-muted-foreground">
              Pick an active plan day to build a rescue list.
            </div>
          ) : (
            <div className="space-y-2">
              {rescue.recommendations.map((item, index) => (
                <div
                  key={`${item.exerciseId}-${index}`}
                  className="grid gap-3 rounded-lg border border-border/50 bg-background/35 p-3 sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-secondary" />
                      <p className="font-medium leading-tight">{item.exerciseName}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                  </div>
                  <div className="text-sm font-semibold sm:text-right">
                    {item.sets} x {item.reps}
                    <p className="text-xs font-normal text-muted-foreground">RIR {item.rir}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rescue.skipList.length > 0 && (
            <p className="rounded-lg border border-border/40 bg-background/20 px-3 py-2 text-xs text-muted-foreground">
              Park for later: {rescue.skipList.join(', ')}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
