import { subDays, format } from 'date-fns';
import { DailyNutritionLog, MacroTargets, UserNutritionProfile } from '@/types/nutrition';

export interface DayInsight {
  date: string;
  dayLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  mealCount: number;
  hasData: boolean;
}

export interface NutritionScoreResult {
  score: number;
  grade: string;
  gradeColor: string;
  breakdown: {
    calorieAdherence: number;
    proteinHit: number;
    hydration: number;
    consistency: number;
  };
}

export function getLastNDays(
  history: Record<string, DailyNutritionLog>,
  n: number
): DayInsight[] {
  const days: DayInsight[] = [];
  const today = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = history[dateStr];

    if (log && log.meals.length > 0) {
      const totals = log.meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          carbs: acc.carbs + meal.carbs,
          fats: acc.fats + meal.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      days.push({
        date: dateStr,
        dayLabel: format(date, 'EEE'),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
        water: log.water,
        mealCount: log.meals.length,
        hasData: true,
      });
    } else {
      days.push({
        date: dateStr,
        dayLabel: format(date, 'EEE'),
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        water: log?.water || 0,
        mealCount: 0,
        hasData: false,
      });
    }
  }

  return days;
}

export function calculateNutritionScore(
  weekData: DayInsight[],
  targets: MacroTargets,
  profile: UserNutritionProfile | null
): NutritionScoreResult {
  const daysWithData = weekData.filter((d) => d.hasData);

  if (daysWithData.length === 0) {
    return {
      score: 0,
      grade: '-',
      gradeColor: 'text-muted-foreground',
      breakdown: { calorieAdherence: 0, proteinHit: 0, hydration: 0, consistency: 0 },
    };
  }

  // Calorie adherence (40%): average of (1 - |actual - target| / target), clamped 0-1
  const calorieScores = daysWithData.map((d) => {
    const deviation = Math.abs(d.calories - targets.calories) / targets.calories;
    return Math.max(0, 1 - deviation);
  });
  const avgCalorieAdherence = calorieScores.reduce((a, b) => a + b, 0) / calorieScores.length;
  const caloriePoints = avgCalorieAdherence * 40;

  // Protein hit (30%): average of min(1, actual / target)
  const proteinScores = daysWithData.map((d) =>
    Math.min(1, d.protein / targets.protein)
  );
  const avgProteinHit = proteinScores.reduce((a, b) => a + b, 0) / proteinScores.length;
  const proteinPoints = avgProteinHit * 30;

  // Hydration (20%): average of min(1, water / dailyWaterGoal)
  const waterGoal = profile?.dailyWaterGoal || 2500;
  const hydrationScores = weekData.map((d) =>
    Math.min(1, d.water / waterGoal)
  );
  const avgHydration = hydrationScores.reduce((a, b) => a + b, 0) / hydrationScores.length;
  const hydrationPoints = avgHydration * 20;

  // Logging consistency (10%): daysWithMeals / 7
  const consistencyPoints = (daysWithData.length / 7) * 10;

  const totalScore = Math.round(caloriePoints + proteinPoints + hydrationPoints + consistencyPoints);

  let grade: string;
  let gradeColor: string;
  if (totalScore >= 85) { grade = 'A'; gradeColor = 'text-green-400'; }
  else if (totalScore >= 70) { grade = 'B'; gradeColor = 'text-blue-400'; }
  else if (totalScore >= 55) { grade = 'C'; gradeColor = 'text-yellow-400'; }
  else if (totalScore >= 40) { grade = 'D'; gradeColor = 'text-orange-400'; }
  else { grade = 'F'; gradeColor = 'text-red-400'; }

  return {
    score: totalScore,
    grade,
    gradeColor,
    breakdown: {
      calorieAdherence: Math.round(caloriePoints),
      proteinHit: Math.round(proteinPoints),
      hydration: Math.round(hydrationPoints),
      consistency: Math.round(consistencyPoints),
    },
  };
}

export function calculateStreak(
  history: Record<string, DailyNutritionLog>,
  targets: MacroTargets
): number {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = history[dateStr];

    if (!log || log.meals.length === 0) break;

    const totalCalories = log.meals.reduce((sum, m) => sum + m.calories, 0);
    const deviation = Math.abs(totalCalories - targets.calories) / targets.calories;

    if (deviation <= 0.15) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getPriorityMacro(
  remaining: { protein: number; carbs: number; fats: number },
  targets: MacroTargets
): 'protein' | 'carbs' | 'fats' {
  const proteinPercent = remaining.protein / targets.protein;
  const carbsPercent = remaining.carbs / targets.carbs;
  const fatsPercent = remaining.fats / targets.fats;

  if (proteinPercent >= carbsPercent && proteinPercent >= fatsPercent) return 'protein';
  if (carbsPercent >= fatsPercent) return 'carbs';
  return 'fats';
}
