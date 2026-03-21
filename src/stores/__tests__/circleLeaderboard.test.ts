import { describe, expect, it } from 'vitest';
import { buildLeaderboard } from '@/stores/circles/utils';
import type { CircleWithMembers, ActivityWithProfile } from '@/types/supabase';

describe('buildLeaderboard', () => {
    it('aggregates workouts and volume by member and sorts descending', () => {
        const circle = {
            id: 'circle-1',
            name: 'Test Circle',
            invite_code: 'ABCDEFGH',
            created_by: 'owner',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            max_members: 20,
            members: [
                { user_id: 'u1', profile: { display_name: 'Alice', avatar_url: null } },
                { user_id: 'u2', profile: { display_name: 'Bob', avatar_url: null } },
            ],
            member_count: 2,
        } as CircleWithMembers;

        const activities: ActivityWithProfile[] = [
            {
                activity_type: 'workout_logged',
                user_id: 'u1',
                created_at: new Date().toISOString(),
                payload: { totalVolume: 1000 },
            } as ActivityWithProfile,
            {
                activity_type: 'workout_logged',
                user_id: 'u1',
                created_at: new Date().toISOString(),
                payload: { totalVolume: 800 },
            } as ActivityWithProfile,
            {
                activity_type: 'workout_logged',
                user_id: 'u2',
                created_at: new Date().toISOString(),
                payload: { totalVolume: 1200 },
            } as ActivityWithProfile,
        ];

        const leaderboard = buildLeaderboard(circle, activities, 'all-time');

        expect(leaderboard[0].displayName).toBe('Alice');
        expect(leaderboard[0].workouts).toBe(2);
        expect(leaderboard[0].volume).toBe(1800);
        expect(leaderboard[1].displayName).toBe('Bob');
        expect(leaderboard[1].workouts).toBe(1);
    });
});
