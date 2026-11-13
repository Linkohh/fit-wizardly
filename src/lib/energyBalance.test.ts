import { describe, expect, it } from 'vitest';
import { computeEnergyBalance, type EnergyBalancePoint } from './energyBalance';
import type { DailyNutritionLog, MealEntry } from '@/types/nutrition';

const END = '2026-02-19';
const WEEK = ['2026-02-13', '2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19'];

function meal(calories: number): MealEntry {
    return {
        id: `m-${calories}`,
        name: 'Meal',
        calories,
        protein: 0,
        carbs: 0,
        fats: 0,
        mealType: 'lunch',
        timestamp: new Date('2026-02-19T12:00:00.000Z'),
    };
}

function log(date: string, calories: number[]): DailyNutritionLog {
    return {
        id: date,
        date,
        meals: calories.map(meal),
        water: 0,
        targets: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        isWorkoutDay: false,
    };
}

function expectNoBadNumbers(points: EnergyBalancePoint[]) {
    for (const point of points) {
        for (const value of [point.intake, point.weight, point.rollingWeightDelta]) {
            if (value !== null) {
                expect(Number.isFinite(value)).toBe(true);
            }
        }
    }
}

describe('computeEnergyBalance', () => {
    it('returns one point per day, oldest to newest', () => {
        const points = computeEnergyBalance({}, [], 7, END);
        expect(points.map((point) => point.date)).toEqual(WEEK);
    });

    it('crosses month boundaries for longer windows', () => {
        const points = computeEnergyBalance({}, [], 28, '2026-03-02');
        expect(points).toHaveLength(28);
        expect(points[0].date).toBe('2026-02-03');
        expect(points[27].date).toBe('2026-03-02');
    });

    it('reports the weight change between the first and last weigh-in on every point', () => {
        const history = Object.fromEntries(WEEK.map((date) => [date, log(date, [1000, 1200])]));
        const weights = [
            { date: '2026-02-13', kg: 80 },
            { date: '2026-02-19', kg: 79.4 },
        ];

        const points = computeEnergyBalance(history, weights, 7, END);

        expect(points.map((point) => point.intake)).toEqual(Array(7).fill(2200));
        expect(points[0].weight).toBe(80);
        expect(points[3].weight).toBeNull();
        expect(points[6].weight).toBe(79.4);
        points.forEach((point) => expect(point.rollingWeightDelta).toBeCloseTo(79.4 - 80, 10));
    });

    it('reports a day with no meals as null intake, not zero', () => {
        const history = { '2026-02-18': log('2026-02-18', [500]), '2026-02-19': log('2026-02-19', []) };
        const points = computeEnergyBalance(history, [], 7, END);

        expect(points[5].intake).toBe(500);
        expect(points[6].intake).toBeNull();
        expect(points[0].intake).toBeNull();
    });

    it('reports no weight change when only one weigh-in exists', () => {
        const points = computeEnergyBalance({}, [{ date: '2026-02-16', kg: 80 }], 7, END);
        points.forEach((point) => expect(point.rollingWeightDelta).toBeNull());
        expect(points[3].weight).toBe(80);
    });

    it('returns all nulls for empty input', () => {
        const points = computeEnergyBalance({}, [], 7, END);

        expect(points).toHaveLength(7);
        points.forEach((point) => {
            expect(point.intake).toBeNull();
            expect(point.weight).toBeNull();
            expect(point.rollingWeightDelta).toBeNull();
        });
    });

    it('ignores weigh-ins outside the window', () => {
        const weights = [
            { date: '2026-02-01', kg: 90 },
            { date: '2026-02-14', kg: 80 },
            { date: '2026-02-18', kg: 81 },
            { date: '2026-02-25', kg: 70 },
        ];
        const points = computeEnergyBalance({}, weights, 7, END);
        points.forEach((point) => expect(point.rollingWeightDelta).toBeCloseTo(1, 10));
    });

    it('uses the latest weigh-in when a day has more than one, regardless of input order', () => {
        const weights = [
            { date: '2026-02-19', kg: 79 },
            { date: '2026-02-13', kg: 80 },
            { date: '2026-02-19', kg: 78 },
        ];
        const points = computeEnergyBalance({}, weights, 7, END);
        expect(points[6].weight).toBe(78);
        expect(points[0].rollingWeightDelta).toBeCloseTo(-2, 10);
    });

    it('never produces NaN or Infinity from bad numbers', () => {
        const history = { '2026-02-19': log('2026-02-19', [Number.NaN, 300, Number.POSITIVE_INFINITY]) };
        const weights = [
            { date: '2026-02-13', kg: Number.NaN },
            { date: '2026-02-14', kg: 80 },
            { date: '2026-02-19', kg: Number.POSITIVE_INFINITY },
        ];

        const points = computeEnergyBalance(history, weights, 7, END);

        expectNoBadNumbers(points);
        expect(points[6].intake).toBe(300);
        expect(points[0].weight).toBeNull();
        points.forEach((point) => expect(point.rollingWeightDelta).toBeNull());
    });
});
