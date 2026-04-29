import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReadinessEntry, ReadinessRating } from '@/types/readiness';
import { useAchievementStore } from '@/stores/achievementStore';

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
    getTrend: (days: 7 | 14 | 30) => ReadinessEntry[];
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

                // Check recovery streak badges
                const updatedLogs = [newLog, ...get().logs.filter((l) => l.date !== today)];
                const consecutive = countConsecutiveDays(updatedLogs);
                const { unlockBadge } = useAchievementStore.getState();
                if (consecutive >= 3) unlockBadge('recovery_streak_3');
                if (consecutive >= 7) unlockBadge('recovery_streak_7');

                return newLog;
            },

            getTrend: (days) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                cutoff.setHours(0, 0, 0, 0);
                return get().logs
                    .filter((e) => new Date(e.date) >= cutoff)
                    .sort((a, b) => a.date.localeCompare(b.date));
            },
        }),
        {
            name: 'readiness-storage',
        }
    )
);
