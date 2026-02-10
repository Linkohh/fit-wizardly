import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BodyMeasurement } from '@/types/fitness';

interface MeasurementsState {
    measurements: BodyMeasurement[];
    addMeasurement: (measurement: BodyMeasurement) => void;
    updateMeasurement: (id: string, updates: Partial<BodyMeasurement>) => void;
    deleteMeasurement: (id: string) => void;
    getLatestMeasurement: () => BodyMeasurement | undefined;
    getHistoryByField: (field: keyof BodyMeasurement) => { date: string; value: number }[];
}

export const useMeasurementsStore = create<MeasurementsState>()(
    persist(
        (set, get) => ({
            measurements: [],

            addMeasurement: (measurement) =>
                set((state) => ({
                    measurements: [...state.measurements, measurement].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                })),

            updateMeasurement: (id, updates) =>
                set((state) => ({
                    measurements: state.measurements.map((m) =>
                        m.id === id ? { ...m, ...updates } : m
                    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                })),

            deleteMeasurement: (id) =>
                set((state) => ({
                    measurements: state.measurements.filter((m) => m.id !== id)
                })),

            getLatestMeasurement: () => {
                const { measurements } = get();
                return measurements.length > 0 ? measurements[0] : undefined;
            },

            getHistoryByField: (field) => {
                const { measurements } = get();
                return measurements
                    .filter(m => m[field] !== undefined && typeof m[field] === 'number')
                    .map(m => ({
                        date: m.date,
                        value: m[field] as number
                    }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            }
        }),
        {
            name: 'measurements-storage',
        }
    )
);
