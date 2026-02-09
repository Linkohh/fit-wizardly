import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Flame, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { useNutritionStore } from '@/stores/nutritionStore';
import {
  getLastNDays,
  calculateNutritionScore,
  calculateStreak,
  type DayInsight,
} from '@/lib/nutritionUtils';

export function NutritionInsights() {
  const { history, targets, profile } = useNutritionStore();

  const weekData = useMemo(() => getLastNDays(history, 7), [history]);

  const score = useMemo(
    () => calculateNutritionScore(weekData, targets!, profile),
    [weekData, targets, profile]
  );

  const streak = useMemo(
    () => calculateStreak(history, targets!),
    [history, targets]
  );

  const hasAnyData = weekData.some((d) => d.hasData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-2">
        <h2 className="text-2xl font-bold">Weekly Insights</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your nutrition performance over the last 7 days
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Calorie Chart */}
        <WeeklyCalorieChart weekData={weekData} target={targets!.calories} hasData={hasAnyData} />

        {/* Macro Distribution */}
        <MacroDistribution weekData={weekData} targets={targets!} hasData={hasAnyData} />

        {/* Nutrition Score */}
        <NutritionScoreCard score={score} hasData={hasAnyData} />

        {/* Consistency Streak */}
        <ConsistencyStreakCard streak={streak} hasData={hasAnyData} />
      </div>
    </motion.div>
  );
}

function WeeklyCalorieChart({
  weekData,
  target,
  hasData,
}: {
  weekData: DayInsight[];
  target: number;
  hasData: boolean;
}) {
  const chartData = weekData.map((d) => {
    let adherence: 'good' | 'over' | 'under' | 'none' = 'none';
    if (d.hasData) {
      const deviation = Math.abs(d.calories - target) / target;
      adherence = deviation <= 0.1 ? 'good' : d.calories > target ? 'over' : 'under';
    }
    return { ...d, target, adherence };
  });

  const getBarColor = (adherence: string) => {
    switch (adherence) {
      case 'good': return '#22c55e';
      case 'over': return '#f59e0b';
      case 'under': return '#eab308';
      default: return 'hsl(var(--muted))';
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Daily Calories
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> On target
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Off target
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Log meals for a few days to see your calorie trends</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={45}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DayInsight & { adherence: string };
                  if (!data.hasData) return null;
                  return (
                    <div className="bg-card border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{data.dayLabel}</p>
                      <p className="text-lg font-bold">{data.calories} kcal</p>
                      <p className="text-xs text-muted-foreground">
                        Target: {target} kcal
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={target}
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              strokeOpacity={0.6}
            />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.adherence)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function MacroDistribution({
  weekData,
  targets,
  hasData,
}: {
  weekData: DayInsight[];
  targets: { protein: number; carbs: number; fats: number };
  hasData: boolean;
}) {
  const daysWithData = weekData.filter((d) => d.hasData);

  const avgMacros = daysWithData.length > 0
    ? {
      protein: Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length),
      carbs: Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / daysWithData.length),
      fats: Math.round(daysWithData.reduce((s, d) => s + d.fats, 0) / daysWithData.length),
    }
    : { protein: 0, carbs: 0, fats: 0 };

  const totalActualCal = avgMacros.protein * 4 + avgMacros.carbs * 4 + avgMacros.fats * 9;
  const totalTargetCal = targets.protein * 4 + targets.carbs * 4 + targets.fats * 9;

  const actualSplit = totalActualCal > 0
    ? {
      protein: Math.round((avgMacros.protein * 4 / totalActualCal) * 100),
      carbs: Math.round((avgMacros.carbs * 4 / totalActualCal) * 100),
      fats: Math.round((avgMacros.fats * 9 / totalActualCal) * 100),
    }
    : { protein: 0, carbs: 0, fats: 0 };

  const targetSplit = totalTargetCal > 0
    ? {
      protein: Math.round((targets.protein * 4 / totalTargetCal) * 100),
      carbs: Math.round((targets.carbs * 4 / totalTargetCal) * 100),
      fats: Math.round((targets.fats * 9 / totalTargetCal) * 100),
    }
    : { protein: 0, carbs: 0, fats: 0 };

  const macros = [
    { label: 'Protein', actual: actualSplit.protein, target: targetSplit.protein, avgGrams: avgMacros.protein, targetGrams: targets.protein, color: 'bg-blue-400' },
    { label: 'Carbs', actual: actualSplit.carbs, target: targetSplit.carbs, avgGrams: avgMacros.carbs, targetGrams: targets.carbs, color: 'bg-green-400' },
    { label: 'Fats', actual: actualSplit.fats, target: targetSplit.fats, avgGrams: avgMacros.fats, targetGrams: targets.fats, color: 'bg-yellow-400' },
  ];

  return (
    <div className="glass-card p-6 rounded-3xl">
      <h3 className="font-semibold text-lg mb-4">Macro Split (Weekly Avg)</h3>

      {!hasData ? (
        <div className="h-[160px] flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Log meals to see your macro distribution</p>
        </div>
      ) : (
        <div className="space-y-5">
          {macros.map((macro) => (
            <div key={macro.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{macro.label}</span>
                <span className="text-muted-foreground">
                  {macro.avgGrams}g avg / {macro.targetGrams}g target
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">Actual</span>
                  <div className="flex-1 bg-muted/10 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${macro.color} transition-all duration-700`}
                      style={{ width: `${Math.min(100, macro.actual)}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{macro.actual}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">Target</span>
                  <div className="flex-1 bg-muted/10 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${macro.color} opacity-40 transition-all duration-700`}
                      style={{ width: `${Math.min(100, macro.target)}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{macro.target}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NutritionScoreCard({
  score,
  hasData,
}: {
  score: { score: number; grade: string; gradeColor: string; breakdown: { calorieAdherence: number; proteinHit: number; hydration: number; consistency: number } };
  hasData: boolean;
}) {
  return (
    <div className="glass-card p-6 rounded-3xl">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Award className="w-4 h-4 text-primary" />
        Nutrition Score
      </h3>

      {!hasData ? (
        <div className="h-[160px] flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Start logging to get your weekly nutrition score</p>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-5xl font-bold ${score.gradeColor}`}>
              {score.score}
            </div>
            <div className={`text-2xl font-bold ${score.gradeColor} mt-1`}>
              {score.grade}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <ScoreBreakdownRow label="Calories" value={score.breakdown.calorieAdherence} max={40} color="bg-foreground" />
            <ScoreBreakdownRow label="Protein" value={score.breakdown.proteinHit} max={30} color="bg-blue-400" />
            <ScoreBreakdownRow label="Hydration" value={score.breakdown.hydration} max={20} color="bg-cyan-400" />
            <ScoreBreakdownRow label="Consistency" value={score.breakdown.consistency} max={10} color="bg-green-400" />
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBreakdownRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <div className="flex-1 bg-muted/10 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-xs w-8 text-right text-muted-foreground">{value}/{max}</span>
    </div>
  );
}

function ConsistencyStreakCard({ streak, hasData }: { streak: number; hasData: boolean }) {
  const getMessage = (s: number) => {
    if (s === 0) return 'Log meals within your calorie target to start a streak';
    if (s < 3) return 'Building momentum, keep going!';
    if (s < 7) return 'Great consistency this week!';
    if (s < 14) return 'Impressive dedication!';
    return 'Unstoppable! You are in the zone!';
  };

  return (
    <div className="glass-card p-6 rounded-3xl">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        Consistency Streak
      </h3>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${streak > 0 ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30' : 'bg-muted/10 border border-border'}`}>
            <span className={`text-3xl font-bold ${streak > 0 ? 'text-orange-400' : 'text-muted-foreground'}`}>
              {streak}
            </span>
          </div>
        </div>
        <div>
          <p className="font-medium text-lg">
            {streak === 1 ? '1 day' : `${streak} days`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {getMessage(streak)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Hit within 15% of your calorie target each day
          </p>
        </div>
      </div>
    </div>
  );
}
