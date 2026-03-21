import type { ActivityWithProfile, CircleWithMembers } from '@/types/supabase';
import type { CircleLeaderboardEntry, CircleState } from './types';

export function generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    let result = '';

    for (let index = 0; index < length; index += 1) {
        result += chars.charAt(randomValues[index] % chars.length);
    }

    return result;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWithinTimeframe(date: Date, timeframe: 'week' | 'month' | 'all-time', now: Date) {
    if (timeframe === 'all-time') return true;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    if (timeframe === 'week') {
        return date >= startOfWeek;
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= startOfMonth;
}

export function buildLeaderboard(
    currentCircle: CircleWithMembers | null,
    activities: ActivityWithProfile[],
    timeframe: 'week' | 'month' | 'all-time' = 'week'
): CircleLeaderboardEntry[] {
    const members = currentCircle?.members || [];
    const now = new Date();
    const filteredActivities = activities.filter((activity): activity is ActivityWithProfile & { created_at: string; user_id: string } => {
        if (activity.activity_type !== 'workout_logged') return false;
        if (typeof activity.created_at !== 'string') return false;
        if (typeof activity.user_id !== 'string') return false;

        const activityDate = new Date(activity.created_at);
        if (Number.isNaN(activityDate.getTime())) return false;

        return isWithinTimeframe(activityDate, timeframe, now);
    });

    const userStats = new Map<string, { workouts: number; volume: number; lastActive: Date }>();

    members.forEach((member) => {
        if (typeof member.user_id !== 'string') return;
        userStats.set(member.user_id, { workouts: 0, volume: 0, lastActive: new Date(0) });
    });

    filteredActivities.forEach((activity) => {
        const stats = userStats.get(activity.user_id) || { workouts: 0, volume: 0, lastActive: new Date(0) };
        const totalVolume = isRecord(activity.payload) && typeof activity.payload.totalVolume === 'number'
            ? activity.payload.totalVolume
            : 0;
        const activityDate = new Date(activity.created_at);

        stats.workouts += 1;
        stats.volume += totalVolume;
        if (activityDate > stats.lastActive) {
            stats.lastActive = activityDate;
        }

        userStats.set(activity.user_id, stats);
    });

    return Array.from(userStats.entries())
        .map(([userId, stats]) => {
            const member = members.find((candidate) => candidate.user_id === userId);
            return {
                userId,
                displayName: member?.profile?.display_name || 'Unknown Member',
                avatarUrl: member?.profile?.avatar_url,
                ...stats,
            };
        })
        .sort((a, b) => b.workouts - a.workouts || b.volume - a.volume);
}
