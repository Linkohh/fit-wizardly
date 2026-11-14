import { fireEvent, render, screen } from '@testing-library/react';
import { format, subDays } from 'date-fns';
import { beforeEach, describe, expect, it } from 'vitest';
import '@/lib/i18n';
import { EnergyBalanceChart } from './EnergyBalanceChart';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useMeasurementsStore } from '@/stores/measurementsStore';
import { usePlanStore } from '@/stores/planStore';
import type { DailyNutritionLog } from '@/types/nutrition';

const day = (daysAgo: number) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');

function log(date: string, calories: number): DailyNutritionLog {
    return {
        id: date,
        date,
        meals: [{ id: `m-${date}`, name: 'Meal', calories, protein: 0, carbs: 0, fats: 0, mealType: 'lunch', timestamp: new Date() }],
        water: 0,
        targets: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        isWorkoutDay: false,
    };
}

describe('EnergyBalanceChart', () => {
    beforeEach(() => {
        useNutritionStore.setState({ history: {} });
        useMeasurementsStore.setState({ measurements: [] });
        usePlanStore.setState({ preferredWeightUnit: 'kg' });
    });

    it('shows an empty state instead of a chart when nothing is logged', () => {
        render(<EnergyBalanceChart />);
        expect(screen.getByText(/log meals and weigh-ins/i)).toBeInTheDocument();
    });

    it('defaults to 7 days and switches window with the segmented control', () => {
        render(<EnergyBalanceChart />);

        expect(screen.getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByRole('button', { name: '28' }));

        expect(screen.getByRole('button', { name: '28' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('summarises average intake and weight change in the preferred unit', () => {
        useNutritionStore.setState({ history: { [day(0)]: log(day(0), 2000), [day(1)]: log(day(1), 3000) } });
        useMeasurementsStore.setState({
            measurements: [
                { id: 'a', date: `${day(0)}T07:00:00.000Z`, weight: 79.5, unit: 'metric' },
                { id: 'b', date: `${day(5)}T07:00:00.000Z`, weight: 80, unit: 'metric' },
            ],
        });

        render(<EnergyBalanceChart />);

        expect(screen.getByText(/2500 kcal/)).toBeInTheDocument();
        expect(screen.getByText(/-0\.5 kg/)).toBeInTheDocument();
    });

    it('asks for a second weigh-in when only one exists, without showing NaN', () => {
        useNutritionStore.setState({ history: { [day(0)]: log(day(0), 2000) } });
        useMeasurementsStore.setState({
            measurements: [{ id: 'a', date: day(0), weight: 176, unit: 'imperial' }],
        });

        const { container } = render(<EnergyBalanceChart />);

        expect(screen.getByText(/two weigh-ins/i)).toBeInTheDocument();
        expect(container.textContent).not.toMatch(/NaN|Infinity/);
    });
});
