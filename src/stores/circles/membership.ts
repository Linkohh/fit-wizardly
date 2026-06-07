import type { Circle, CircleWithMembers } from '@/types/supabase';
import type { CircleStoreDeps } from './types';
import { generateRandomCode } from './utils';

type MemberIdentitySource = {
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
};

export function getMemberDisplayName(user: MemberIdentitySource): string {
    const metadata = user.user_metadata;
    const candidates = [
        metadata?.display_name,
        metadata?.full_name,
        metadata?.name,
        metadata?.preferred_username,
    ];

    for (const candidate of candidates) {
        if (typeof candidate !== 'string') {
            continue;
        }

        const trimmed = candidate.trim();
        if (trimmed) {
            return trimmed;
        }
    }

    return 'A new member';
}

function mapCircleWithMembers(circle: Circle & { circle_members?: CircleWithMembers['members'] }) {
    return {
        ...circle,
        members: circle.circle_members || [],
        member_count: circle.circle_members?.length || 0,
    } as CircleWithMembers;
}

export function createMembershipActions({ set, get, supabase, isSupabaseConfigured }: CircleStoreDeps) {
    return {
        fetchUserCircles: async (userId: string) => {
            if (!isSupabaseConfigured()) return;

            set({ isLoading: true });

            try {
                const { data: memberships } = await supabase
                    .from('circle_members')
                    .select('circle_id')
                    .eq('user_id', userId);

                if (!memberships?.length) {
                    set({ circles: [], isLoading: false });
                    return;
                }

                const circleIds = memberships
                    .map((membership) => membership.circle_id)
                    .filter((id): id is string => typeof id === 'string');

                if (circleIds.length === 0) {
                    set({ circles: [], isLoading: false });
                    return;
                }

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

                set({
                    circles: (circles || []).map((circle) => mapCircleWithMembers(circle as Circle & { circle_members?: CircleWithMembers['members'] })),
                    isLoading: false,
                });
            } catch (error) {
                console.error('Error fetching circles:', error);
                set({ isLoading: false });
            }
        },

        fetchCircleById: async (circleId: string) => {
            if (!isSupabaseConfigured()) return null;

            try {
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

                return mapCircleWithMembers(circle as Circle & { circle_members?: CircleWithMembers['members'] });
            } catch (error) {
                console.error('Error fetching circle by ID:', error);
                return null;
            }
        },

        createCircle: async (name: string, description?: string) => {
            if (!isSupabaseConfigured()) {
                return { circle: null, error: new Error('Supabase not configured') };
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { circle: null, error: new Error('Not authenticated') };
            }

            const inviteCode = generateRandomCode();

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

            await supabase
                .from('circle_members')
                .insert({
                    circle_id: circle.id,
                    user_id: user.id,
                    role: 'admin',
                });

            await get().fetchUserCircles(user.id);

            return { circle, error: null };
        },

        joinCircle: async (inviteCode: string) => {
            if (!isSupabaseConfigured()) {
                return { error: new Error('Supabase not configured') };
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { error: new Error('Not authenticated') };
            }

            const { data, error } = await supabase
                .rpc('join_circle_by_invite', {
                    p_invite_code: inviteCode.toUpperCase(),
                });

            if (error) {
                return { error: error as Error };
            }

            const joinedCircle = Array.isArray(data) ? data[0] : null;
            if (joinedCircle?.circle_id) {
                await get().postActivity(joinedCircle.circle_id, 'member_joined', {
                    memberName: getMemberDisplayName(user),
                });
            }

            await get().fetchUserCircles(user.id);

            return { error: null };
        },

        leaveCircle: async (circleId: string) => {
            if (!isSupabaseConfigured()) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('circle_members')
                .delete()
                .eq('circle_id', circleId)
                .eq('user_id', user.id);

            set((state) => ({
                circles: state.circles.filter((circle) => circle.id !== circleId),
                currentCircle: state.currentCircle?.id === circleId ? null : state.currentCircle,
            }));
        },

        setCurrentCircle: (circleId: string | null) => {
            if (!circleId) {
                set({ currentCircle: null });
                return;
            }

            const circle = get().circles.find((candidate) => candidate.id === circleId);
            set({ currentCircle: circle || null });

            if (circle) {
                void get().fetchActivities(circleId);
                void get().fetchChallenges(circleId);
            }
        },
    };
}
