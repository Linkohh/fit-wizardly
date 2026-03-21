import type { CircleChallenge } from '@/types/supabase';
import type { CircleStoreDeps } from './types';

export function createChallengeActions({ set, get, supabase, isSupabaseConfigured }: CircleStoreDeps) {
    return {
        fetchChallenges: async (circleId: string) => {
            if (!isSupabaseConfigured()) return;

            const { data } = await supabase
                .from('circle_challenges')
                .select('*')
                .eq('circle_id', circleId)
                .order('start_date', { ascending: false });

            set({ challenges: data || [] });
        },

        createChallenge: async (
            circleId: string,
            title: string,
            challengeType: string,
            startDate: Date,
            endDate: Date,
            description?: string
        ) => {
            if (!isSupabaseConfigured()) {
                return { error: new Error('Supabase not configured') };
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { error: new Error('Not authenticated') };
            }

            const { error } = await supabase
                .from('circle_challenges')
                .insert({
                    circle_id: circleId,
                    title,
                    description,
                    challenge_type: challengeType,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    created_by: user.id,
                });

            if (!error) {
                await get().fetchChallenges(circleId);
                await get().postActivity(circleId, 'challenge_created', { title, challengeType });
            }

            return { error: error as Error | null };
        },
    };
}
