import type { StoreApi } from 'zustand';
import type {
    Circle,
    CircleActivity,
    CircleChallenge,
    CircleWithMembers,
    ActivityWithProfile,
    ActivityReaction,
    ActivityCommentWithProfile,
    ReactionType,
    Json,
} from '@/types/supabase';

export interface CircleLeaderboardEntry {
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
    workouts: number;
    volume: number;
    lastActive: Date;
}

export interface CircleState {
    circles: CircleWithMembers[];
    currentCircle: CircleWithMembers | null;
    activities: ActivityWithProfile[];
    challenges: CircleChallenge[];
    reactions: Map<string, ActivityReaction[]>;
    comments: Map<string, ActivityCommentWithProfile[]>;
    isLoading: boolean;
    isLoadingActivities: boolean;
    fetchUserCircles: (userId: string) => Promise<void>;
    fetchCircleById: (circleId: string) => Promise<CircleWithMembers | null>;
    createCircle: (name: string, description?: string) => Promise<{ circle: Circle | null; error: Error | null }>;
    joinCircle: (inviteCode: string) => Promise<{ error: Error | null }>;
    leaveCircle: (circleId: string) => Promise<void>;
    setCurrentCircle: (circleId: string | null) => void;
    fetchActivities: (circleId: string) => Promise<void>;
    postActivity: (circleId: string, activityType: string, payload: Json) => Promise<void>;
    subscribeToActivities: (circleId: string) => () => void;
    fetchReactions: (activityIds: string[]) => Promise<void>;
    addReaction: (activityId: string, reactionType: ReactionType) => Promise<void>;
    removeReaction: (activityId: string, reactionType: ReactionType) => Promise<void>;
    getUserReaction: (activityId: string, userId: string) => ReactionType | null;
    fetchComments: (activityId: string) => Promise<void>;
    addComment: (activityId: string, content: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
    fetchChallenges: (circleId: string) => Promise<void>;
    createChallenge: (
        circleId: string,
        title: string,
        challengeType: string,
        startDate: Date,
        endDate: Date,
        description?: string
    ) => Promise<{ error: Error | null }>;
    generateInviteCode: () => string;
    getLeaderboard: (timeframe?: 'week' | 'month' | 'all-time') => CircleLeaderboardEntry[];
}

export type CircleStoreSetState = StoreApi<CircleState>['setState'];
export type CircleStoreGetState = StoreApi<CircleState>['getState'];

export interface CircleStoreDeps {
    set: CircleStoreSetState;
    get: CircleStoreGetState;
    supabase: typeof import('@/lib/supabase').supabase;
    isSupabaseConfigured: typeof import('@/lib/supabase').isSupabaseConfigured;
}
