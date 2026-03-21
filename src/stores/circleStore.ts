/**
 * Circle Store
 *
 * Facade that composes the circle domain actions while keeping the public
 * Zustand API stable for existing consumers.
 */

import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CircleState } from '@/stores/circles/types';
import { createMembershipActions } from '@/stores/circles/membership';
import { createActivityActions } from '@/stores/circles/activity';
import { createInteractionActions } from '@/stores/circles/interaction';
import { createChallengeActions } from '@/stores/circles/challenges';
import { buildLeaderboard, generateRandomCode } from '@/stores/circles/utils';

const initialState = {
    circles: [],
    currentCircle: null,
    activities: [],
    challenges: [],
    reactions: new Map(),
    comments: new Map(),
    isLoading: false,
    isLoadingActivities: false,
};

export const useCircleStore = create<CircleState>((set, get) => ({
    ...initialState,
    ...createMembershipActions({ set, get, supabase, isSupabaseConfigured }),
    ...createActivityActions({ set, get, supabase, isSupabaseConfigured }),
    ...createInteractionActions({ set, get, supabase, isSupabaseConfigured }),
    ...createChallengeActions({ set, get, supabase, isSupabaseConfigured }),
    generateInviteCode: () => generateRandomCode(),
    getLeaderboard: (timeframe = 'week') => buildLeaderboard(get().currentCircle, get().activities, timeframe),
}));
