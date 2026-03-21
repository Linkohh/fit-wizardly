import type { ActivityCommentWithProfile, ActivityReaction, ReactionType } from '@/types/supabase';
import type { CircleStoreDeps } from './types';

export function createInteractionActions({ set, get, supabase, isSupabaseConfigured }: CircleStoreDeps) {
    return {
        addReaction: async (activityId: string, reactionType: ReactionType) => {
            if (!isSupabaseConfigured()) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const currentReactions = get().reactions;
            const activityReactions = currentReactions.get(activityId) || [];
            const newReaction: ActivityReaction = {
                id: crypto.randomUUID(),
                activity_id: activityId,
                user_id: user.id,
                reaction_type: reactionType,
                created_at: new Date().toISOString(),
            };

            const filteredReactions = activityReactions.filter((reaction) => reaction.user_id !== user.id);
            filteredReactions.push(newReaction);

            const updatedReactions = new Map(currentReactions);
            updatedReactions.set(activityId, filteredReactions);
            set({ reactions: updatedReactions });

            const { error } = await supabase
                .from('activity_reactions')
                .delete()
                .eq('activity_id', activityId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error adding reaction:', error);
                set({ reactions: currentReactions });
                return;
            }

            const insertResult = await supabase
                .from('activity_reactions')
                .insert({
                    activity_id: activityId,
                    user_id: user.id,
                    reaction_type: reactionType,
                });

            if (insertResult.error) {
                console.error('Error adding reaction:', insertResult.error);
                set({ reactions: currentReactions });
            }
        },

        removeReaction: async (activityId: string, reactionType: ReactionType) => {
            if (!isSupabaseConfigured()) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const currentReactions = get().reactions;
            const activityReactions = currentReactions.get(activityId) || [];
            const filteredReactions = activityReactions.filter(
                (reaction) => !(reaction.user_id === user.id && reaction.reaction_type === reactionType)
            );

            const updatedReactions = new Map(currentReactions);
            updatedReactions.set(activityId, filteredReactions);
            set({ reactions: updatedReactions });

            const { error } = await supabase
                .from('activity_reactions')
                .delete()
                .eq('activity_id', activityId)
                .eq('user_id', user.id)
                .eq('reaction_type', reactionType);

            if (error) {
                console.error('Error removing reaction:', error);
                set({ reactions: currentReactions });
            }
        },

        getUserReaction: (activityId: string, userId: string) => {
            const reactions = get().reactions.get(activityId) || [];
            const userReaction = reactions.find((reaction) => reaction.user_id === userId);
            return (userReaction?.reaction_type as ReactionType) || null;
        },

        addComment: async (activityId: string, content: string) => {
            if (!isSupabaseConfigured()) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('activity_comments')
                .insert({
                    activity_id: activityId,
                    user_id: user.id,
                    content,
                })
                .select(`
                    *,
                    profile:profiles (*)
                `)
                .single();

            if (error) {
                console.error('Error adding comment:', error);
                return;
            }

            if (data) {
                const currentComments = get().comments;
                const activityComments = currentComments.get(activityId) || [];
                const updatedComments = new Map(currentComments);
                updatedComments.set(activityId, [...activityComments, data as ActivityCommentWithProfile]);
                set({ comments: updatedComments });
            }
        },

        deleteComment: async (commentId: string) => {
            if (!isSupabaseConfigured()) return;

            let activityId: string | null = null;
            const currentComments = get().comments;

            currentComments.forEach((comments, candidateActivityId) => {
                if (comments.some((comment) => comment.id === commentId)) {
                    activityId = candidateActivityId;
                }
            });

            if (!activityId) return;

            const activityComments = currentComments.get(activityId) || [];
            const filteredComments = activityComments.filter((comment) => comment.id !== commentId);
            const updatedComments = new Map(currentComments);
            updatedComments.set(activityId, filteredComments);
            set({ comments: updatedComments });

            const { error } = await supabase
                .from('activity_comments')
                .delete()
                .eq('id', commentId);

            if (error) {
                console.error('Error deleting comment:', error);
                set({ comments: currentComments });
            }
        },
    };
}
