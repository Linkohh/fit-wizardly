import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Scale } from 'lucide-react';
import { computeEnergyBalance, type EnergyBalanceWindow, type WeighIn } from '@/lib/energyBalance';
import { cn } from '@/lib/utils';
import { useMeasurementsStore } from '@/stores/measurementsStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import { usePlanStore } from '@/stores/planStore';

const WINDOWS: EnergyBalanceWindow[] = [7, 14, 28];
const KG_PER_LB = 0.45359237;

function formatSigned(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return '0.0';
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`;
}

/**
 * Calories eaten (bars, left axis) against body weight (line, right axis).
 * Days without data are gaps, never zeros.
 */
export function EnergyBalanceChart() {
  const { t } = useTranslation();
  const [windowDays, setWindowDays] = useState<EnergyBalanceWindow>(7);
  const history = useNutritionStore((state) => state.history);
  const measurements = useMeasurementsStore((state) => state.measurements);
  const weightUnit = usePlanStore((state) => state.preferredWeightUnit);

  const points = useMemo(() => {
    const weighIns: WeighIn[] = measurements
      .filter((entry) => typeof entry.weight === 'number')
      .map((entry) => ({
        date: entry.date.slice(0, 10),
        kg: entry.unit === 'imperial' ? (entry.weight as number) * KG_PER_LB : (entry.weight as number),
      }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    return computeEnergyBalance(history, weighIns, windowDays, format(new Date(), 'yyyy-MM-dd'));
  }, [history, measurements, windowDays]);

  const toDisplayWeight = (kg: number): number =>
    Math.round((weightUnit === 'lbs' ? kg / KG_PER_LB : kg) * 10) / 10;

  const chartData = points.map((point) => ({
    label: point.date.slice(5),
    intake: point.intake,
    weight: point.weight === null ? null : toDisplayWeight(point.weight),
  }));

  const intakeDays = points.filter((point) => point.intake !== null);
  const averageIntake =
    intakeDays.length > 0
      ? Math.round(intakeDays.reduce((sum, point) => sum + (point.intake as number), 0) / intakeDays.length)
      : null;
  const weightDeltaKg = points[0]?.rollingWeightDelta ?? null;
  const hasWeighIn = points.some((point) => point.weight !== null);
  const hasData = intakeDays.length > 0 || hasWeighIn;

  return (
    <div className="glass-card p-6 rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            {t('nutrition.energyBalance.title')}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{t('nutrition.energyBalance.subtitle')}</p>
        </div>
        <div
          role="group"
          aria-label={t('nutrition.energyBalance.window_label')}
          className="flex items-center gap-1 rounded-lg bg-muted/50 p-1"
        >
          {WINDOWS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={windowDays === option}
              onClick={() => setWindowDays(option)}
              className={cn(
                'min-w-9 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                windowDays === option
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="h-[220px] flex items-center justify-center text-center text-sm text-muted-foreground">
          <p>{t('nutrition.energyBalance.empty')}</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="intake" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={45} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="weight" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={45} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar
                yAxisId="intake"
                dataKey="intake"
                name={t('nutrition.energyBalance.intake_series')}
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="weight"
                dataKey="weight"
                name={t('nutrition.energyBalance.weight_series', { unit: weightUnit })}
                type="monotone"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {averageIntake !== null && (
              <p>{t('nutrition.energyBalance.avg_intake', { value: averageIntake })}</p>
            )}
            {weightDeltaKg !== null ? (
              <p>
                {t('nutrition.energyBalance.weight_change', {
                  value: formatSigned(weightUnit === 'lbs' ? weightDeltaKg / KG_PER_LB : weightDeltaKg),
                  unit: weightUnit,
                })}
              </p>
            ) : (
              <p className="text-muted-foreground">{t('nutrition.energyBalance.need_weigh_ins')}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
