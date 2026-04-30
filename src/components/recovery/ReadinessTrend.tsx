import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { useReadinessStore } from '@/stores/readinessStore';
import type { ReadinessEntry } from '@/types/readiness';

type DayRange = 7 | 14 | 30;

function getScoreColor(score: number): string {
  if (score < 2.5) return '#ef4444';
  if (score < 3.5) return '#f59e0b';
  return '#22c55e';
}

function getBandLabel(score: number, t: TFunction): string {
  if (score < 2.5) return t('recovery.band_rest');
  if (score < 3.5) return t('recovery.band_moderate');
  return t('recovery.band_ready');
}

function getFilteredLogs(logs: ReadinessEntry[], days: DayRange): ReadinessEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return logs
    .filter((e) => new Date(e.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

interface TooltipPayloadEntry {
  payload?: ReadinessEntry & { displayScore: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  const { t, i18n } = useTranslation();
  if (!active || !payload?.length || !payload[0].payload) return null;
  const entry = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold">{formatDate(entry.date, i18n.language)}</p>
      <p className="text-muted-foreground">
        {t('recovery.tooltip_score', 'Score:')}{' '}
        <span className="text-foreground font-medium">{entry.displayScore}/100</span>
      </p>
      <p className="text-muted-foreground">
        {t('recovery.tooltip_status', 'Status:')}{' '}
        <span className="text-foreground font-medium">{getBandLabel(entry.overallScore, t)}</span>
      </p>
    </div>
  );
}

export function ReadinessTrend() {
  const { t, i18n } = useTranslation();
  const { logs } = useReadinessStore();
  const [range, setRange] = useState<DayRange>(7);

  const filtered = getFilteredLogs(logs, range);
  const chartData = filtered.map((e) => ({
    ...e,
    displayScore: Math.round(e.overallScore * 20),
  }));

  const ranges: DayRange[] = [7, 14, 30];

  return (
    <Card variant="glass" className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {t('recovery.trend_title', 'Readiness Trend')}
          </CardTitle>
          <div className="flex gap-1">
            {ranges.map((r) => (
              <Button
                key={r}
                variant={range === r ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setRange(r)}
              >
                {t(`recovery.days_${r}`, `${r}d`)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center gap-2">
            <Activity className="w-10 h-10 opacity-20" />
            <p className="text-sm">
              {t('recovery.no_data', 'No readiness logs yet. Check in daily to see your trend.')}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => formatDate(date, i18n.language)}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickCount={5}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
              <Bar dataKey="displayScore" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.overallScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
