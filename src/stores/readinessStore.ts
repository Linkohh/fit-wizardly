import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReadinessLog {
    date: string; // YYYY-MM-DD
    sleep: number; // 1-10
    soreness: number; // 1-10
    stress: number; // 1-10
    energy: number; // 1-10
    score: number; // 0-100
}

interface ReadinessState {
    logs: ReadinessLog[];
    hasLoggedToday: () => boolean;
    logReadiness: (log: Omit<ReadinessLog, 'date' | 'score'>) => void;
    getTodayLog: () => ReadinessLog | undefined;
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

                // Calculate score (simple average mapped to 0-100)
                // Sleep (high is good), Energy (high is good)
                // Soreness (high is bad), Stress (high is bad)

                // Normalize to 0-10 (where 10 is 'good')
                const sleepScore = metrics.sleep;
                const energyScore = metrics.energy;
                const sorenessScore = 11 - metrics.soreness; // 1=10 (good), 10=1 (bad)
                const stressScore = 11 - metrics.stress;     // 1=10 (good), 10=1 (bad)

                const average = (sleepScore + energyScore + sorenessScore + stressScore) / 4;
                const score = Math.round(average * 10); // Map 1-10 to 10-100 roughly

                const newLog: ReadinessLog = {
                    date: today,
                    ...metrics,
                    score
                };

                set((state) => ({
                    logs: [newLog, ...state.logs.filter((l) => l.date !== today)]
                }));
            },
        }),
        {
            name: 'readiness-storage',
        }
    )
);
