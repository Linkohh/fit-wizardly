import type {
    Json,
    ActivityReaction,
    ActivityCommentWithProfile,
    ActivityWithProfile,
} from '@/types/supabase';
import type { CircleStoreDeps } from './types';

export function createActivityActions({ set, get, supabase, isSupabaseConfigured }: CircleStoreDeps) {
    return {
        fetchActivities: async (circleId: string) => {
            if (!isSupabaseConfigured()) return;

            set({ isLoadingActivities: true });

            const { data } = await supabase
                .from('circle_activities')
                .select(`
                    *,
                    profile:profiles (*)
                `)
                .eq('circle_id', circleId)
                .order('created_at', { ascending: false })
                .limit(50);

            set({
                activities: (data || []) as ActivityWithProfile[],
                isLoadingActivities: false,
            });
        },

        postActivity: async (circleId: string, activityType: string, payload: Json) => {
            if (!isSupabaseConfigured()) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('circle_activities')
                .insert({
                    circle_id: circleId,
                    user_id: user.id,
                    activity_type: activityType,
                    payload,
                });
        },

        subscribeToActivities: (circleId: string) => {
            if (!isSupabaseConfigured()) return () => {};

            const channel = supabase
                .channel(`activities:${circleId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'circle_activities',
                        filter: `circle_id=eq.${circleId}`,
                    },
                    async (payload) => {
                        const { data } = await supabase
                            .from('circle_activities')
                            .select(`*, profile:profiles (*)`)
                            .eq('id', payload.new.id)
                            .single();

                        if (data) {
                            set((state) => ({
                                activities: [data as ActivityWithProfile, ...state.activities],
                            }));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        },

        fetchReactions: async (activityIds: string[]) => {
            if (!isSupabaseConfigured() || activityIds.length === 0) return;

            const { data } = await supabase
                .from('activity_reactions')
                .select('*')
                .in('activity_id', activityIds);

            if (data) {
                const reactionsMap = new Map<string, ActivityReaction[]>();
                data.forEach((reaction) => {
                    const existing = reactionsMap.get(reaction.activity_id) || [];
                    existing.push(reaction as ActivityReaction);
                    reactionsMap.set(reaction.activity_id, existing);
                });
                set({ reactions: reactionsMap });
            }
        },

        fetchComments: async (activityId: string) => {
            if (!isSupabaseConfigured()) return;

            const { data } = await supabase
                .from('activity_comments')
                .select(`
                    *,
                    profile:profiles (*)
                `)
                .eq('activity_id', activityId)
                .order('created_at', { ascending: true });

            if (data) {
                const updatedComments = new Map(get().comments);
                updatedComments.set(activityId, data as ActivityCommentWithProfile[]);
                set({ comments: updatedComments });
            }
        },
    };
}
