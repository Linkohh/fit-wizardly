import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowDownRight, ArrowUpRight, CheckCircle2, Compass, Gauge, Minus, Signal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanStore } from '@/stores/planStore';
import { useReadinessStore } from '@/stores/readinessStore';
import { buildTrainingCompass, type TrainingCompassStatus } from '@/lib/analyticsIntelligence';
import { cn } from '@/lib/utils';
import { InsightQualityBadge } from './InsightQualityBadge';

interface TrainingCompassCardProps {
  now?: Date;
  className?: string;
}

const statusMeta: Record<
  TrainingCompassStatus,
  {
    label: string;
    Icon: typeof ArrowUpRight;
    tone: string;
    badge: string;
    glow: string;
  }
> = {
  push: {
    label: 'Push',
    Icon: ArrowUpRight,
    tone: 'text-emerald-400',
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    glow: 'from-emerald-400/20 via-primary/10 to-transparent',
  },
  hold: {
    label: 'Hold',
    Icon: Minus,
    tone: 'text-primary',
    badge: 'border-primary/30 bg-primary/10 text-primary',
    glow: 'from-primary/20 via-secondary/10 to-transparent',
  },
  dial_back: {
    label: 'Dial Back',
    Icon: ArrowDownRight,
    tone: 'text-amber-300',
    badge: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
    glow: 'from-amber-300/20 via-destructive/10 to-transparent',
  },
  needs_data: {
    label: 'Needs Data',
    Icon: Signal,
    tone: 'text-muted-foreground',
    badge: 'border-muted-foreground/20 bg-muted/40 text-muted-foreground',
    glow: 'from-muted/30 via-primary/5 to-transparent',
  },
};

function formatVolume(value: number) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return Math.round(value).toString();
}

export function TrainingCompassCard({ now, className }: TrainingCompassCardProps) {
  const workoutLogs = usePlanStore((state) => state.workoutLogs);
  const readinessLogs = useReadinessStore((state) => state.logs);
  const analysisNow = useMemo(() => now ?? new Date(), [now]);
  const insight = useMemo(
    () => buildTrainingCompass({ workoutLogs, readinessLogs, now: analysisNow }),
    [workoutLogs, readinessLogs, analysisNow],
  );
  const meta = statusMeta[insight.status];
  const StatusIcon = meta.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={className}
    >
      <Card variant="glass" className="relative overflow-hidden border-primary/15">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', meta.glow)} aria-hidden="true" />
        <CardHeader className="relative">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="gradient-text flex items-center gap-2">
                <Compass className="h-5 w-5" />
                Daily Training Compass
              </CardTitle>
              <CardDescription>Readiness and recent workload translated into today's training call.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <InsightQualityBadge quality={insight.status === 'needs_data' ? 'needs_data' : insight.confidence} />
              <Badge variant="outline" className={cn('gap-1.5', meta.badge)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {meta.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-border/60 bg-background/35 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compass score</p>
                <p className={cn('font-display text-5xl font-bold leading-none', meta.tone)}>
                  {insight.score}
                </p>
              </div>
              <div className="grid h-20 w-20 place-items-center rounded-full border border-primary/20 bg-background/40 shadow-[0_0_30px_hsl(var(--primary)/0.16)]">
                <StatusIcon className={cn('h-9 w-9', meta.tone)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border/50 bg-background/30 p-3">
                <p className="text-muted-foreground">Recent</p>
                <p className="font-semibold">{insight.metrics.recentWorkouts} workouts</p>
              </div>
              <div className="rounded-md border border-border/50 bg-background/30 p-3">
                <p className="text-muted-foreground">Volume</p>
                <p className="font-semibold">{formatVolume(insight.metrics.recentVolume)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {insight.reasons.slice(0, 3).map((reason) => (
                <div key={reason} className="rounded-lg border border-border/50 bg-background/35 p-3">
                  <CheckCircle2 className="mb-2 h-4 w-4 text-secondary" />
                  <p className="text-sm leading-snug text-foreground">{reason}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <Gauge className="h-4 w-4" />
                Next action
              </div>
              <p className="text-sm leading-relaxed text-foreground">{insight.nextAction}</p>
            </div>

            {insight.stressSignals.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                <Activity className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{insight.stressSignals[0]}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
