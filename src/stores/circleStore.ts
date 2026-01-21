/**
 * Circle Store
 * 
 * Manages accountability circles, memberships, activities, and challenges.
 * Uses Supabase for persistence and real-time updates.
 */

import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
    Circle,
    CircleMember,
    CircleActivity,
    CircleChallenge,
    CircleWithMembers,
    ActivityWithProfile,
    ActivityReaction,
    ActivityCommentWithProfile,
    ReactionType,
    Profile,
} from '@/types/supabase';

// ============================================
// STATE INTERFACE
// ============================================

interface CircleState {
    // Data
    circles: CircleWithMembers[];
    currentCircle: CircleWithMembers | null;
    activities: ActivityWithProfile[];
    challenges: CircleChallenge[];
    reactions: Map<string, ActivityReaction[]>; // activityId -> reactions
    comments: Map<string, ActivityCommentWithProfile[]>; // activityId -> comments

    // Loading states
    isLoading: boolean;
    isLoadingActivities: boolean;

    // Actions - Circles
    fetchUserCircles: (userId: string) => Promise<void>;
    fetchCircleById: (circleId: string) => Promise<CircleWithMembers | null>;
    createCircle: (name: string, description?: string) => Promise<{ circle: Circle | null; error: Error | null }>;
    joinCircle: (inviteCode: string) => Promise<{ error: Error | null }>;
    leaveCircle: (circleId: string) => Promise<void>;
    setCurrentCircle: (circleId: string | null) => void;

    // Actions - Activities
    fetchActivities: (circleId: string) => Promise<void>;
    postActivity: (
        circleId: string,
        activityType: string,
        payload: Record<string, any>
    ) => Promise<void>;
    subscribeToActivities: (circleId: string) => () => void;

    // Actions - Reactions
    fetchReactions: (activityIds: string[]) => Promise<void>;
    addReaction: (activityId: string, reactionType: ReactionType) => Promise<void>;
    removeReaction: (activityId: string, reactionType: ReactionType) => Promise<void>;
    getUserReaction: (activityId: string, userId: string) => ReactionType | null;

    // Actions - Comments
    fetchComments: (activityId: string) => Promise<void>;
    addComment: (activityId: string, content: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;

    // Actions - Challenges
    fetchChallenges: (circleId: string) => Promise<void>;
    createChallenge: (
        circleId: string,
        title: string,
        challengeType: string,
        startDate: Date,
        endDate: Date,
        description?: string
    ) => Promise<{ error: Error | null }>;

    // Utilities
    generateInviteCode: () => string;
    getLeaderboard: (timeframe?: 'week' | 'month' | 'all-time') => Array<{
        userId: string;
        displayName: string;
        avatarUrl?: string | null;
        workouts: number;
        volume: number;
        lastActive: Date;
    }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(randomValues[i] % chars.length);
    }
    return result;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useCircleStore = create<CircleState>((set, get) => ({
    // Initial state
    circles: [],
    currentCircle: null,
    activities: [],
    challenges: [],
    reactions: new Map(),
    comments: new Map(),
    isLoading: false,
    isLoadingActivities: false,

    // ========================================
    // CIRCLE ACTIONS
    // ========================================

    fetchUserCircles: async (userId) => {
        if (!isSupabaseConfigured()) return;

        set({ isLoading: true });

        try {
            // Get circles the user is a member of
            const { data: memberships } = await supabase
                .from('circle_members')
                .select('circle_id')
                .eq('user_id', userId);

            if (!memberships?.length) {
                set({ circles: [], isLoading: false });
                return;
            }

            const circleIds = memberships.map(m => m.circle_id);

            // Fetch circles with member details
            const { data: circles } = await supabase
                .from('circles')
                .select(`
          *,
          circle_members (
            *,
            profile:profiles (*)
          )
        `)
                .in('id', circleIds);

            const circlesWithMembers: CircleWithMembers[] = (circles || []).map(circle => ({
                ...circle,
                members: circle.circle_members || [],
                member_count: circle.circle_members?.length || 0,
            }));

            set({ circles: circlesWithMembers, isLoading: false });
        } catch (error) {
            console.error('Error fetching circles:', error);
            set({ isLoading: false });
        }
    },

    fetchCircleById: async (circleId) => {
        if (!isSupabaseConfigured()) return null;

        try {
            // Fetch circle with member details
            const { data: circle, error } = await supabase
                .from('circles')
                .select(`
                    *,
                    circle_members (
                        *,
                        profile:profiles (*)
                    )
                `)
                .eq('id', circleId)
                .single();

            if (error || !circle) {
                console.error('Error fetching circle:', error);
                return null;
            }

            const circleWithMembers: CircleWithMembers = {
                ...circle,
                members: circle.circle_members || [],
                member_count: circle.circle_members?.length || 0,
            };

            return circleWithMembers;
        } catch (error) {
            console.error('Error fetching circle by ID:', error);
            return null;
        }
    },

    createCircle: async (name, description) => {
        if (!isSupabaseConfigured()) {
            return { circle: null, error: new Error('Supabase not configured') };
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { circle: null, error: new Error('Not authenticated') };
        }

        const inviteCode = generateRandomCode();

        // Create circle
        const { data: circle, error: circleError } = await supabase
            .from('circles')
            .insert({
                name,
                description,
                created_by: user.id,
                invite_code: inviteCode,
            })
            .select()
            .single();

        if (circleError || !circle) {
            return { circle: null, error: circleError as Error };
        }

        // Add creator as admin member
        await supabase
            .from('circle_members')
            .insert({
                circle_id: circle.id,
                user_id: user.id,
                role: 'admin',
            });

        // Refresh circles
        await get().fetchUserCircles(user.id);

        return { circle, error: null };
    },

    joinCircle: async (inviteCode) => {
        if (!isSupabaseConfigured()) {
            return { error: new Error('Supabase not configured') };
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: new Error('Not authenticated') };
        }

        // Find circle by invite code
        const { data: circle } = await supabase
            .from('circles')
            .select('*')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

        if (!circle) {
            return { error: new Error('Invalid invite code') };
        }

        // Check if already a member
        const { data: existing } = await supabase
            .from('circle_members')
            .select('id')
            .eq('circle_id', circle.id)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            return { error: new Error('Already a member of this circle') };
        }

        // Check member limit
        const { count } = await supabase
            .from('circle_members')
            .select('*', { count: 'exact', head: true })
            .eq('circle_id', circle.id);

        if (count && count >= circle.max_members) {
            return { error: new Error('Circle is full') };
        }

        // Join circle
        const { error } = await supabase
            .from('circle_members')
            .insert({
                circle_id: circle.id,
                user_id: user.id,
                role: 'member',
            });

        if (error) {
            return { error: error as Error };
        }

        // Post activity about new member
        await get().postActivity(circle.id, 'member_joined', {
            memberName: user.email?.split('@')[0] || 'A new member',
        });

        // Refresh circles
        await get().fetchUserCircles(user.id);

        return { error: null };
    },

    leaveCircle: async (circleId) => {
        if (!isSupabaseConfigured()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('circle_members')
            .delete()
            .eq('circle_id', circleId)
            .eq('user_id', user.id);

        set(state => ({
            circles: state.circles.filter(c => c.id !== circleId),
            currentCircle: state.currentCircle?.id === circleId ? null : state.currentCircle,
        }));
    },

    setCurrentCircle: (circleId) => {
        if (!circleId) {
            set({ currentCircle: null });
            return;
        }

        const circle = get().circles.find(c => c.id === circleId);
        set({ currentCircle: circle || null });

        if (circle) {
            get().fetchActivities(circleId);
            get().fetchChallenges(circleId);
        }
    },

    // ========================================
    // ACTIVITY ACTIONS
    // ========================================

    fetchActivities: async (circleId) => {
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

    postActivity: async (circleId, activityType, payload) => {
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

    subscribeToActivities: (circleId) => {
        if (!isSupabaseConfigured()) return () => { };

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
                    // Fetch the new activity with profile
                    const { data } = await supabase
                        .from('circle_activities')
                        .select(`*, profile:profiles (*)`)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        set(state => ({
                            activities: [data as ActivityWithProfile, ...state.activities],
                        }));
                    }
                }
            )
            .subscribe();

        // Return unsubscribe function
        return () => {
            supabase.removeChannel(channel);
        };
    },

    // ========================================
    // REACTION ACTIONS
    // ========================================

    fetchReactions: async (activityIds) => {
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

    addReaction: async (activityId, reactionType) => {
        if (!isSupabaseConfigured()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        const currentReactions = get().reactions;
        const activityReactions = currentReactions.get(activityId) || [];
        const newReaction: ActivityReaction = {
            id: crypto.randomUUID(),
            activity_id: activityId,
            user_id: user.id,
            reaction_type: reactionType,
            created_at: new Date().toISOString(),
        };

        // Remove any existing reaction from this user first
        const filteredReactions = activityReactions.filter(
            r => r.user_id !== user.id
        );
        filteredReactions.push(newReaction);

        const updatedReactions = new Map(currentReactions);
        updatedReactions.set(activityId, filteredReactions);
        set({ reactions: updatedReactions });

        // Remove existing reaction if any
        await supabase
            .from('activity_reactions')
            .delete()
            .eq('activity_id', activityId)
            .eq('user_id', user.id);

        // Insert new reaction
        const { error } = await supabase
            .from('activity_reactions')
            .insert({
                activity_id: activityId,
                user_id: user.id,
                reaction_type: reactionType,
            });

        if (error) {
            // Revert optimistic update on error
            console.error('Error adding reaction:', error);
            set({ reactions: currentReactions });
        }
    },

    removeReaction: async (activityId, reactionType) => {
        if (!isSupabaseConfigured()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        const currentReactions = get().reactions;
        const activityReactions = currentReactions.get(activityId) || [];
        const filteredReactions = activityReactions.filter(
            r => !(r.user_id === user.id && r.reaction_type === reactionType)
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
            // Revert optimistic update on error
            console.error('Error removing reaction:', error);
            set({ reactions: currentReactions });
        }
    },

    getUserReaction: (activityId, userId) => {
        const reactions = get().reactions.get(activityId) || [];
        const userReaction = reactions.find(r => r.user_id === userId);
        return userReaction?.reaction_type as ReactionType || null;
    },

    // ========================================
    // COMMENT ACTIONS
    // ========================================

    fetchComments: async (activityId) => {
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
            const currentComments = get().comments;
            const updatedComments = new Map(currentComments);
            updatedComments.set(activityId, data as ActivityCommentWithProfile[]);
            set({ comments: updatedComments });
        }
    },

    addComment: async (activityId, content) => {
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

    deleteComment: async (commentId) => {
        if (!isSupabaseConfigured()) return;

        // Find the comment to get its activity_id
        let activityId: string | null = null;
        const currentComments = get().comments;

        currentComments.forEach((comments, aId) => {
            if (comments.some(c => c.id === commentId)) {
                activityId = aId;
            }
        });

        if (!activityId) return;

        // Optimistic update
        const activityComments = currentComments.get(activityId) || [];
        const filteredComments = activityComments.filter(c => c.id !== commentId);
        const updatedComments = new Map(currentComments);
        updatedComments.set(activityId, filteredComments);
        set({ comments: updatedComments });

        const { error } = await supabase
            .from('activity_comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            // Revert optimistic update on error
            console.error('Error deleting comment:', error);
            set({ comments: currentComments });
        }
    },

    // ========================================
    // CHALLENGE ACTIONS
    // ========================================

    fetchChallenges: async (circleId) => {
        if (!isSupabaseConfigured()) return;

        const { data } = await supabase
            .from('circle_challenges')
            .select('*')
            .eq('circle_id', circleId)
            .order('start_date', { ascending: false });

        set({ challenges: data || [] });
    },

    createChallenge: async (circleId, title, challengeType, startDate, endDate, description) => {
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

    // ========================================
    // UTILITIES
    // ========================================

    generateInviteCode: () => generateRandomCode(),

    // ========================================
    // LEADERBOARD ACTIONS (Computed from Activities)
    // ========================================

    getLeaderboard: (timeframe: 'week' | 'month' | 'all-time' = 'week') => {
        const activities = get().activities;
        const members = get().currentCircle?.members || [];
        const now = new Date();

        // precise start of week (Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const filteredActivities = activities.filter(a => {
            if (a.activity_type !== 'workout_logged') return false;
            const date = new Date(a.created_at);

            if (timeframe === 'week') return date >= startOfWeek;
            if (timeframe === 'month') return date >= startOfMonth;
            return true;
        });

        // Map userId -> stats
        const userStats = new Map<string, { workouts: number, volume: number, lastActive: Date }>();

        // Initialize all members with 0
        members.forEach(m => {
            userStats.set(m.user_id, { workouts: 0, volume: 0, lastActive: new Date(0) });
        });

        filteredActivities.forEach(a => {
            const stats = userStats.get(a.user_id) || { workouts: 0, volume: 0, lastActive: new Date(0) };
            const payload = a.payload as any;

            stats.workouts += 1;
            stats.volume += payload?.totalVolume || 0;
            const activityDate = new Date(a.created_at);
            if (activityDate > stats.lastActive) stats.lastActive = activityDate;

            userStats.set(a.user_id, stats);
        });

        // Convert to array and sort
        return Array.from(userStats.entries())
            .map(([userId, stats]) => {
                const member = members.find(m => m.user_id === userId);
                return {
                    userId,
                    displayName: member?.profile?.display_name || 'Unknown Member',
                    avatarUrl: member?.profile?.avatar_url,
                    ...stats
                };
            })
            .sort((a, b) => b.workouts - a.workouts || b.volume - a.volume);
    }
}));
