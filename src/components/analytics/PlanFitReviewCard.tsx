import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, CalendarRange, Gauge, Layers3, Signal, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildPlanFitReview, type PlanFitStatus } from '@/lib/analyticsIntelligence';
import { cn } from '@/lib/utils';
import { usePlanStore } from '@/stores/planStore';
import { useReadinessStore } from '@/stores/readinessStore';

interface PlanFitReviewCardProps {
  now?: Date;
}

const statusMeta: Record<PlanFitStatus, { label: string; badge: string; meter: string }> = {
  fits_well: {
    label: 'Fits Well',
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    meter: 'from-emerald-400 to-secondary',
  },
  too_dense: {
    label: 'Too Dense',
    badge: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
    meter: 'from-amber-300 to-primary',
  },
  recovery_mismatch: {
    label: 'Recovery Mismatch',
    badge: 'border-primary/30 bg-primary/10 text-primary',
    meter: 'from-primary to-secondary',
  },
  under_dosed: {
    label: 'Under Dosed',
    badge: 'border-secondary/30 bg-secondary/10 text-secondary',
    meter: 'from-secondary to-emerald-400',
  },
  needs_data: {
    label: 'Needs Data',
    badge: 'border-muted-foreground/20 bg-muted/40 text-muted-foreground',
    meter: 'from-muted-foreground to-muted',
  },
};

function formatRatio(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function PlanFitReviewCard({ now }: PlanFitReviewCardProps) {
  const currentPlan = usePlanStore((state) => state.currentPlan);
  const workoutLogs = usePlanStore((state) => state.workoutLogs);
  const readinessLogs = useReadinessStore((state) => state.logs);
  const analysisNow = useMemo(() => now ?? new Date(), [now]);
  const insight = useMemo(
    () => buildPlanFitReview({ currentPlan, workoutLogs, readinessLogs, now: analysisNow }),
    [currentPlan, workoutLogs, readinessLogs, analysisNow],
  );
  const meta = statusMeta[insight.status];

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
                <SlidersHorizontal className="h-5 w-5" />
                Plan Fit Review
              </CardTitle>
              <CardDescription>Current plan density, recovery fit, and training day balance.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn('gap-1.5', meta.badge)}>
                <BadgeCheck className="h-3.5 w-3.5" />
                {meta.label}
              </Badge>
              <Badge variant="outline" className={cn('capitalize', meta.badge)}>
                {insight.confidence} confidence
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Fit score</p>
                <p className="font-display text-4xl font-bold leading-none">{insight.fitScore}</p>
              </div>
              <p className="max-w-[18rem] text-right text-sm leading-snug text-muted-foreground">{insight.diagnosis}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/50">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r shadow-[0_0_16px_hsl(var(--primary)/0.25)]', meta.meter)}
                style={{ width: `${insight.fitScore}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-background/35 p-3">
              <CalendarRange className="mb-2 h-4 w-4 text-secondary" />
              <p className="text-xs text-muted-foreground">Current plan</p>
              <p className="font-semibold">
                {insight.metrics.currentPlanLogs}/{insight.metrics.expectedSessions || 0} sessions
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/35 p-3">
              <Layers3 className="mb-2 h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Completion</p>
              <p className="font-semibold">{formatRatio(insight.metrics.completionRatio)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/35 p-3">
              <Signal className="mb-2 h-4 w-4 text-amber-200" />
              <p className="text-xs text-muted-foreground">Training day balance</p>
              <p className="font-semibold">{insight.metrics.dayIndexImbalance}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {insight.reasons.slice(0, 3).map((reason) => (
              <span key={reason} className="rounded-full border border-border/60 bg-background/35 px-3 py-1 text-xs">
                {reason}
              </span>
            ))}
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
              <Gauge className="h-4 w-4" />
              Suggested adjustment
            </div>
            <p className="text-sm leading-relaxed">{insight.suggestedAdjustment}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
