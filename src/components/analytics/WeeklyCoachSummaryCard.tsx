import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Sparkles, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanStore } from '@/stores/planStore';
import { useReadinessStore } from '@/stores/readinessStore';
import { buildWeeklyCoachSummary } from '@/lib/analyticsIntelligence';
import { InsightQualityBadge } from './InsightQualityBadge';

interface WeeklyCoachSummaryCardProps {
  now?: Date;
}

export function WeeklyCoachSummaryCard({ now }: WeeklyCoachSummaryCardProps) {
  const workoutLogs = usePlanStore((state) => state.workoutLogs);
  const preferredWeightUnit = usePlanStore((state) => state.preferredWeightUnit);
  const readinessLogs = useReadinessStore((state) => state.logs);
  const analysisNow = useMemo(() => now ?? new Date(), [now]);
  const summary = useMemo(
    () => buildWeeklyCoachSummary({ workoutLogs, readinessLogs, preferredWeightUnit, now: analysisNow }),
    [workoutLogs, readinessLogs, preferredWeightUnit, analysisNow],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.05 }}
      className="col-span-full"
    >
      <Card variant="glass" className="overflow-hidden border-secondary/20">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="gradient-text flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Coach Notes
              </CardTitle>
              <CardDescription>A weekly readout in plain coaching language.</CardDescription>
            </div>
            <InsightQualityBadge quality={summary.stats.sessionsThisWeek === 0 ? 'needs_data' : summary.confidence} />
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-border/60 bg-background/35 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary">
              <Sparkles className="h-4 w-4" />
              {summary.title}
            </div>
            <p className="text-base leading-relaxed text-foreground">{summary.summary}</p>
          </div>

          <div className="space-y-3">
            {summary.highlights.slice(0, 4).map((highlight) => (
              <div key={highlight} className="flex gap-3 rounded-lg border border-border/50 bg-background/30 p-3">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-snug text-muted-foreground">{highlight}</p>
              </div>
            ))}
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <Target className="h-4 w-4" />
                Next-week focus
              </div>
              <p className="text-sm leading-relaxed">{summary.nextWeekFocus}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
