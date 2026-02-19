import { beforeEach, describe, expect, it } from 'vitest';
import { useCircleStore } from '@/stores/circleStore';

describe('circleStore operations', () => {
    beforeEach(() => {
        useCircleStore.setState({
            circles: [],
            currentCircle: null,
            activities: [],
            challenges: [],
            reactions: new Map(),
            comments: new Map(),
            isLoading: false,
            isLoadingActivities: false,
        });
    });

    it('generates invite codes with expected length and charset', () => {
        const code = useCircleStore.getState().generateInviteCode();

        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    });

    it('returns user reaction for activity when present', () => {
        const reactions = new Map<string, Array<{ user_id: string; reaction_type: string }>>();
        reactions.set('activity-1', [{ user_id: 'user-1', reaction_type: 'fire' }]);
        useCircleStore.setState({ reactions: reactions as unknown as Map<string, never[]> });

        const reaction = useCircleStore.getState().getUserReaction('activity-1', 'user-1');
        expect(reaction).toBe('fire');
    });

    it('computes leaderboard from workout activities', () => {
        useCircleStore.setState({
            currentCircle: {
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
            } as never,
            activities: [
                {
                    activity_type: 'workout_logged',
                    user_id: 'u1',
                    created_at: new Date().toISOString(),
                    payload: { totalVolume: 1000 },
                },
                {
                    activity_type: 'workout_logged',
                    user_id: 'u1',
                    created_at: new Date().toISOString(),
                    payload: { totalVolume: 800 },
                },
                {
                    activity_type: 'workout_logged',
                    user_id: 'u2',
                    created_at: new Date().toISOString(),
                    payload: { totalVolume: 1200 },
                },
            ] as never[],
        });

        const leaderboard = useCircleStore.getState().getLeaderboard('all-time');
        expect(leaderboard[0].displayName).toBe('Alice');
        expect(leaderboard[0].workouts).toBe(2);
        expect(leaderboard[1].displayName).toBe('Bob');
    });
});
