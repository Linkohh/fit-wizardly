import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BodyMeasurement } from '@/types/fitness';
import { createUserDataStorage } from '@/lib/storage/appStorage';
import { hydrationTracking } from '@/lib/storage/hydration';

export const MEASUREMENTS_STORE_NAME = 'fitwizard-measurements';

type PersistedMeasurementsState = Pick<MeasurementsState, 'measurements'>;

function isMeasurement(value: unknown): value is BodyMeasurement {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Partial<BodyMeasurement>;
    return (
        typeof candidate.id === 'string' &&
        typeof candidate.date === 'string' &&
        (candidate.unit === 'imperial' || candidate.unit === 'metric')
    );
}

/** Checks saved measurements read back from storage; malformed entries are dropped. */
export function sanitizeMeasurements(value: unknown): BodyMeasurement[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter(isMeasurement)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

interface MeasurementsState {
    measurements: BodyMeasurement[];
    addMeasurement: (measurement: BodyMeasurement) => void;
    updateMeasurement: (id: string, updates: Partial<BodyMeasurement>) => void;
    deleteMeasurement: (id: string) => void;
    getLatestMeasurement: () => BodyMeasurement | undefined;
    getHistoryByField: (field: keyof BodyMeasurement) => { date: string; value: number }[];
}

export const useMeasurementsStore = create<MeasurementsState>()(persist<MeasurementsState, [], [], PersistedMeasurementsState>((set, get) => ({
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
}), {
    name: MEASUREMENTS_STORE_NAME,
    version: 1,
    storage: createUserDataStorage<PersistedMeasurementsState>(),
    partialize: (state): PersistedMeasurementsState => ({ measurements: state.measurements }),
    merge: (persistedState, currentState) => ({
        ...currentState,
        measurements: sanitizeMeasurements((persistedState as Partial<PersistedMeasurementsState> | undefined)?.measurements),
    }),
    ...hydrationTracking(MEASUREMENTS_STORE_NAME),
}));
