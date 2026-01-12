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

    // Loading states
    isLoading: boolean;
    isLoadingActivities: boolean;

    // Actions - Circles
    fetchUserCircles: (userId: string) => Promise<void>;
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
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
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
}));
