import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReadinessEntry, ReadinessRating } from '@/types/readiness';

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
}

export const useReadinessStore = create<ReadinessState>()(
    persist(
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

                return newLog;
            },
        }),
        {
            name: 'readiness-storage',
        }
    )
);
