import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Gauge, ShieldCheck, Signal, Sparkles, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildLiftTruthMeter, type LiftTruthMeterInsight, type LiftTruthStatus } from '@/lib/analyticsIntelligence';
import { cn } from '@/lib/utils';
import { usePlanStore } from '@/stores/planStore';

interface LiftTruthMeterCardProps {
  now?: Date;
}

const statusMeta: Record<LiftTruthStatus, { label: string; Icon: typeof CheckCircle2; badge: string; bar: string }> = {
  clean_progress: {
    label: 'Clean Progress',
    Icon: CheckCircle2,
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    bar: 'bg-emerald-400',
  },
  grind_debt: {
    label: 'Grind Debt',
    Icon: Gauge,
    badge: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
    bar: 'bg-amber-300',
  },
  quiet_progress: {
    label: 'Quiet Progress',
    Icon: Sparkles,
    badge: 'border-secondary/30 bg-secondary/10 text-secondary',
    bar: 'bg-secondary',
  },
  technique_check: {
    label: 'Technique Check',
    Icon: TriangleAlert,
    badge: 'border-primary/30 bg-primary/10 text-primary',
    bar: 'bg-primary',
  },
  needs_data: {
    label: 'Needs Data',
    Icon: Signal,
    badge: 'border-muted-foreground/20 bg-muted/40 text-muted-foreground',
    bar: 'bg-muted-foreground',
  },
};

function getBarHeight(value: number, values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 52;
  return 26 + ((value - min) / (max - min)) * 66;
}

function TruthBars({ insight }: { insight: LiftTruthMeterInsight }) {
  const values = insight.sparkline.slice(-7).map((point) => point.value);
  if (values.length === 0) return <div className="h-12 rounded-md border border-dashed border-border/70" />;

  return (
    <div className="flex h-14 items-end gap-1.5" aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={`${insight.exerciseId}-${value}-${index}`}
          className={cn('w-2 rounded-full opacity-85 shadow-[0_0_12px_currentColor]', statusMeta[insight.status].bar)}
          style={{ height: `${getBarHeight(value, values)}%` }}
        />
      ))}
    </div>
  );
}

export function LiftTruthMeterCard({ now }: LiftTruthMeterCardProps) {
  const workoutLogs = usePlanStore((state) => state.workoutLogs);
  const preferredWeightUnit = usePlanStore((state) => state.preferredWeightUnit);
  const analysisNow = useMemo(() => now ?? new Date(), [now]);
  const insights = useMemo(
    () => buildLiftTruthMeter({ workoutLogs, preferredWeightUnit, now: analysisNow }),
    [workoutLogs, preferredWeightUnit, analysisNow],
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      whileHover={{ y: -2 }}
    >
      <Card variant="glass" className="h-full overflow-hidden border-primary/15">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Lift Truth Meter
          </CardTitle>
          <CardDescription>Progress separated from effort cost across your top loaded lifts.</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-center text-muted-foreground">
              <Activity className="mb-3 h-12 w-12 opacity-20" />
              <p className="text-sm">Log loaded sets to unlock lift truth signals.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => {
                const meta = statusMeta[insight.status];
                const StatusIcon = meta.Icon;

                return (
                  <div key={insight.exerciseId} className="rounded-lg border border-border/60 bg-background/35 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold leading-tight">{insight.exerciseName}</h3>
                          <Badge variant="outline" className={cn('gap-1.5', meta.badge)}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {insight.sessionsAnalyzed} exposures · {insight.bestSetLabel}
                        </p>
                      </div>
                      <TruthBars insight={insight} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.9fr]">
                      <p className="text-sm leading-relaxed text-muted-foreground">{insight.interpretation}</p>
                      <div className="rounded-md border border-primary/15 bg-primary/10 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-primary">
                          <Gauge className="h-3.5 w-3.5" />
                          Next cue
                        </div>
                        <p className="text-sm leading-snug">{insight.nextCue}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
