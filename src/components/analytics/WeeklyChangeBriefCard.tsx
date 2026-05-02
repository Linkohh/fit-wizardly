import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ClipboardCheck, Gauge, Minus, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildWeeklyChangeBrief, type WeeklyChangeStatus } from '@/lib/analyticsIntelligence';
import { usePlanStore } from '@/stores/planStore';
import { useReadinessStore } from '@/stores/readinessStore';
import { cn } from '@/lib/utils';
import { InsightQualityBadge } from './InsightQualityBadge';

interface WeeklyChangeBriefCardProps {
  now?: Date;
}

const statusMeta: Record<
  WeeklyChangeStatus,
  {
    label: string;
    Icon: typeof CheckCircle2;
    tone: string;
    accent: string;
  }
> = {
  steady: {
    label: 'Steady',
    Icon: CheckCircle2,
    tone: 'text-emerald-300',
    accent: 'border-emerald-400/25 bg-emerald-400/10',
  },
  watch_recovery: {
    label: 'Watch Recovery',
    Icon: Gauge,
    tone: 'text-amber-200',
    accent: 'border-amber-300/25 bg-amber-300/10',
  },
  rebuild_rhythm: {
    label: 'Rebuild Rhythm',
    Icon: RotateCcw,
    tone: 'text-secondary',
    accent: 'border-secondary/25 bg-secondary/10',
  },
  build_momentum: {
    label: 'Build Momentum',
    Icon: ArrowUpRight,
    tone: 'text-primary',
    accent: 'border-primary/25 bg-primary/10',
  },
  needs_data: {
    label: 'Needs Signal',
    Icon: Minus,
    tone: 'text-muted-foreground',
    accent: 'border-border/60 bg-background/35',
  },
};

function formatPercentLabel(value: number | null) {
  if (value === null) return 'New baseline';
  const rounded = Math.abs(Math.round(value));
  return `${value >= 0 ? '+' : '-'}${rounded}%`;
}

export function WeeklyChangeBriefCard({ now }: WeeklyChangeBriefCardProps) {
  const workoutLogs = usePlanStore((state) => state.workoutLogs);
  const readinessLogs = useReadinessStore((state) => state.logs);
  const analysisNow = useMemo(() => now ?? new Date(), [now]);
  const brief = useMemo(
    () => buildWeeklyChangeBrief({ workoutLogs, readinessLogs, now: analysisNow }),
    [workoutLogs, readinessLogs, analysisNow],
  );
  const meta = statusMeta[brief.status];
  const StatusIcon = meta.Icon;
  const TrendIcon = (brief.metrics.volumeChangePercent ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <Card variant="glass" className="h-full overflow-hidden border-secondary/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="gradient-text flex items-center gap-2 text-xl">
                <ClipboardCheck className="h-5 w-5" />
                Weekly Change Brief
              </CardTitle>
              <CardDescription>Last 7 days compared with the week before.</CardDescription>
            </div>
            <InsightQualityBadge quality={brief.status === 'needs_data' ? 'needs_data' : brief.confidence} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className={cn('rounded-lg border p-4', meta.accent)}>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <StatusIcon className={cn('h-4 w-4', meta.tone)} />
              <span className={meta.tone}>{meta.label}</span>
            </div>
            <p className="text-sm leading-relaxed">{brief.summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 bg-background/35 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <TrendIcon className="h-3.5 w-3.5" />
                Load change
              </div>
              <p className="font-display text-2xl font-bold">{formatPercentLabel(brief.metrics.volumeChangePercent)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/35 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Sessions</p>
              <p className="font-display text-2xl font-bold">{brief.metrics.sessionsThisWeek}</p>
            </div>
          </div>

          <div className="space-y-2">
            {brief.keySignals.slice(0, 2).map((signal) => (
              <div key={signal} className="flex gap-2 rounded-lg border border-border/50 bg-background/30 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <p className="text-sm leading-snug text-muted-foreground">{signal}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
              <Gauge className="h-4 w-4" />
              Next adjustment
            </div>
            <p className="text-sm leading-relaxed">{brief.nextAction}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
