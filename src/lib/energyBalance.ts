import type { DailyNutritionLog } from '@/types/nutrition';

export type EnergyBalanceWindow = 7 | 14 | 28;

export type EnergyBalancePoint = {
    /** YYYY-MM-DD */
    date: string;
    /** Calories logged that day, or null when no meal was logged. Never 0 for "no data". */
    intake: number | null;
    /** Body weight in kg that day, or null when there was no weigh-in. */
    weight: number | null;
    /** Last weigh-in minus first weigh-in inside the window, or null with fewer than two. */
    rollingWeightDelta: number | null;
};

export type WeighIn = { date: string; kg: number };

/** The `windowDays` calendar dates ending at `endDate` (YYYY-MM-DD), oldest first. */
function windowDates(endDate: string, windowDays: number): string[] {
    const [year, month, day] = endDate.split('-').map(Number);
    const dates: string[] = [];

    for (let offset = windowDays - 1; offset >= 0; offset--) {
        dates.push(new Date(Date.UTC(year, month - 1, day - offset)).toISOString().split('T')[0]);
    }

    return dates;
}

function dayIntake(log: DailyNutritionLog | undefined): number | null {
    if (!log || log.meals.length === 0) return null;

    const calories = log.meals.map((meal) => meal.calories).filter(Number.isFinite);
    if (calories.length === 0) return null;

    return calories.reduce((sum, value) => sum + value, 0);
}

/**
 * Lines up daily calorie intake with body weight over a window, for the
 * "are you actually in a surplus or deficit" chart (AUDIT_AND_IDEAS §3.7).
 *
 * Missing data stays null so the chart can show a gap instead of a zero.
 * Dates are compared as YYYY-MM-DD strings.
 */
export function computeEnergyBalance(
    history: Record<string, DailyNutritionLog>,
    weights: WeighIn[],
    windowDays: EnergyBalanceWindow,
    endDate: string
): EnergyBalancePoint[] {
    const dates = windowDates(endDate, windowDays);
    const inWindow = new Set(dates);

    // Later entries for the same day win.
    const weightByDate = new Map<string, number>();
    for (const entry of weights) {
        if (inWindow.has(entry.date) && Number.isFinite(entry.kg)) {
            weightByDate.set(entry.date, entry.kg);
        }
    }

    const weighedDates = dates.filter((date) => weightByDate.has(date));
    const rollingWeightDelta =
        weighedDates.length >= 2
            ? (weightByDate.get(weighedDates[weighedDates.length - 1]) as number) -
              (weightByDate.get(weighedDates[0]) as number)
            : null;

    return dates.map((date) => ({
        date,
        intake: dayIntake(history[date]),
        weight: weightByDate.get(date) ?? null,
        rollingWeightDelta,
    }));
}
