import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { filterReadinessLogsByRange, type ReadinessDayRange } from '@/lib/readinessRange';
import type { ReadinessEntry, ReadinessRating } from '@/types/readiness';
import { useAchievementStore } from '@/stores/achievementStore';
import { createUserDataStorage } from '@/lib/storage/appStorage';
import { hydrationTracking } from '@/lib/storage/hydration';
import { isFiniteNumber, isRecord, sanitizeList } from '@/lib/storage/sanitize';

export const READINESS_STORE_NAME = 'readiness-storage';

type PersistedReadinessState = { logs: ReadinessEntry[] };

function isRating(value: unknown): value is ReadinessRating {
    return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

/** Checks one saved readiness entry; malformed entries are dropped. */
export function sanitizeReadinessEntry(value: unknown): ReadinessEntry | null {
    if (
        !isRecord(value) ||
        typeof value.date !== 'string' ||
        !isRating(value.sleepQuality) ||
        !isRating(value.muscleSoreness) ||
        !isRating(value.energyLevel) ||
        !isRating(value.stressLevel) ||
        !isFiniteNumber(value.overallScore)
    ) {
        return null;
    }
    return {
        date: value.date,
        sleepQuality: value.sleepQuality,
        muscleSoreness: value.muscleSoreness,
        energyLevel: value.energyLevel,
        stressLevel: value.stressLevel,
        overallScore: value.overallScore,
    };
}

type ReadinessInput = {
    sleepQuality: ReadinessRating;
    muscleSoreness: ReadinessRating;
    energyLevel: ReadinessRating;
    stressLevel: ReadinessRating;
};

interface ReadinessState {
    logs: ReadinessEntry[];
    hasLoggedToday: () => boolean;
    logReadiness: (entry: ReadinessInput) => ReadinessEntry;
    getTodayLog: () => ReadinessEntry | undefined;
    getTrend: (days: ReadinessDayRange) => ReadinessEntry[];
}

/** Count consecutive days logged up to and including today. */
function countConsecutiveDays(logs: ReadinessEntry[]): number {
    const dates = new Set(logs.map((l) => l.date));
    let count = 0;
    const cursor = new Date();
    while (true) {
        const dateStr = cursor.toISOString().split('T')[0];
        if (!dates.has(dateStr)) break;
        count++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return count;
}

export const useReadinessStore = create<ReadinessState>()(
    persist<ReadinessState, [], [], PersistedReadinessState>(
        (set, get) => ({
            logs: [],

            hasLoggedToday: () => {
                const today = new Date().toISOString().split('T')[0];
                return get().logs.some((log) => log.date === today);
            },

            getTodayLog: () => {
                const today = new Date().toISOString().split('T')[0];
                return get().logs.find((log) => log.date === today);
            },

            logReadiness: (metrics) => {
                const today = new Date().toISOString().split('T')[0];

                // High is better for sleep/energy; inverse for soreness/stress.
                const sleepScore = metrics.sleepQuality;
                const energyScore = metrics.energyLevel;
                const sorenessScore = 6 - metrics.muscleSoreness;
                const stressScore = 6 - metrics.stressLevel;
                const overallScore = Number(((sleepScore + energyScore + sorenessScore + stressScore) / 4).toFixed(2));

                const newLog: ReadinessEntry = {
                    date: today,
                    ...metrics,
                    overallScore,
                };

                set((state) => ({
                    logs: [newLog, ...state.logs.filter((l) => l.date !== today)]
                }));

                // Check recovery streak badges
                const updatedLogs = [newLog, ...get().logs.filter((l) => l.date !== today)];
                const consecutive = countConsecutiveDays(updatedLogs);
                const { unlockBadge } = useAchievementStore.getState();
                if (consecutive >= 3) unlockBadge('recovery_streak_3');
                if (consecutive >= 7) unlockBadge('recovery_streak_7');

                return newLog;
            },

            getTrend: (days) => {
                return filterReadinessLogsByRange(get().logs, days);
            },
        }),
        {
            name: READINESS_STORE_NAME,
            version: 1,
            storage: createUserDataStorage<PersistedReadinessState>(),
            partialize: (state) => ({ logs: state.logs }),
            migrate: (persistedState) => persistedState as PersistedReadinessState,
            merge: (persistedState, currentState) => ({
                ...currentState,
                logs: sanitizeList(isRecord(persistedState) ? persistedState.logs : undefined, sanitizeReadinessEntry),
            }),
            ...hydrationTracking(READINESS_STORE_NAME),
        }
    )
);
