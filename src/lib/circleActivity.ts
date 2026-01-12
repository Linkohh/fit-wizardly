/**
 * Circle Activity Integration
 * 
 * Helper functions to post workout activities to user's circles.
 * This module bridges planStore actions with circleStore.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Post activity to all user's circles
export async function postWorkoutToCircles(activity: {
    workoutName: string;
    duration: number;
    exerciseCount: number;
    totalVolume: number;
}): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's circles
        const { data: memberships } = await supabase
            .from('circle_members')
            .select('circle_id')
            .eq('user_id', user.id);

        if (!memberships?.length) return;

        // Post to each circle
        const activities = memberships.map(m => ({
            circle_id: m.circle_id,
            user_id: user.id,
            activity_type: 'workout_logged',
            payload: activity,
        }));

        await supabase.from('circle_activities').insert(activities);
    } catch (error) {
        console.error('Failed to post workout to circles:', error);
    }
}

// Post a PR achievement to circles
export async function postPRToCircles(pr: {
    exerciseName: string;
    oldValue: number;
    newValue: number;
    prType: 'weight' | 'reps' | 'volume';
}): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberships } = await supabase
            .from('circle_members')
            .select('circle_id')
            .eq('user_id', user.id);

        if (!memberships?.length) return;

        const activities = memberships.map(m => ({
            circle_id: m.circle_id,
            user_id: user.id,
            activity_type: 'pr_set',
            payload: pr,
        }));

        await supabase.from('circle_activities').insert(activities);
    } catch (error) {
        console.error('Failed to post PR to circles:', error);
    }
}

// Post streak achievement to circles
export async function postStreakToCircles(streakDays: number): Promise<void> {
    if (!isSupabaseConfigured()) return;

    // Only post for milestone streaks
    if (![3, 7, 14, 30, 60, 90].includes(streakDays)) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberships } = await supabase
            .from('circle_members')
            .select('circle_id')
            .eq('user_id', user.id);

        if (!memberships?.length) return;

        const activities = memberships.map(m => ({
            circle_id: m.circle_id,
            user_id: user.id,
            activity_type: 'streak',
            payload: { streakDays },
        }));

        await supabase.from('circle_activities').insert(activities);
    } catch (error) {
        console.error('Failed to post streak to circles:', error);
    }
}
