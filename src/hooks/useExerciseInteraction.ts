/**
 * Exercise Interaction Tracking Hook
 *
 * Tracks user interactions with exercises for:
 * - Community pulse (trending exercises)
 * - Personalized recommendations
 * - Badge unlocking
 * - Streak tracking
 *
 * Interactions are batched and sent to Supabase in the background.
 */

import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { InteractionType, TrendingExercise, UserStreak, ExerciseBadge, Json } from '@/types/supabase';

type InteractionMetadata = Record<string, Json>;

// Pending interaction to be synced
interface PendingInteraction {
    exerciseId: string;
    type: InteractionType;
    metadata?: InteractionMetadata;
    timestamp: number;
}

// Store state
interface InteractionState {
    // Tracking data
    viewedExercises: Set<string>;
    performedExercises: Map<string, number>; // exerciseId -> count
    pendingInteractions: PendingInteraction[];

    // Community data
    trendingExercises: TrendingExercise[];
    lastTrendingFetch: number | null;

    // User stats
    streak: UserStreak | null;
    badges: ExerciseBadge[];

    // Actions
    trackView: (exerciseId: string) => void;
    trackPerform: (exerciseId: string, metadata?: InteractionMetadata) => void;
    trackAddToWorkout: (exerciseId: string) => void;

    // Sync
    flushInteractions: () => Promise<void>;
    fetchTrending: () => Promise<void>;
    fetchUserStats: () => Promise<void>;

    // Internal
    _addPending: (interaction: Omit<PendingInteraction, 'timestamp'>) => void;
}

// Create store
export const useInteractionStore = create<InteractionState>((set, get) => ({
    viewedExercises: new Set(),
    performedExercises: new Map(),
    pendingInteractions: [],
    trendingExercises: [],
    lastTrendingFetch: null,
    streak: null,
    badges: [],

    // Track a view (debounced - only track first view per session)
    trackView: (exerciseId) => {
        const { viewedExercises, _addPending } = get();

        // Only track first view per session
        if (viewedExercises.has(exerciseId)) return;

        set((state) => ({
            viewedExercises: new Set([...state.viewedExercises, exerciseId]),
        }));

        _addPending({ exerciseId, type: 'view' });
    },

    // Track a perform (exercise completed in workout)
    trackPerform: (exerciseId, metadata) => {
        const { performedExercises, _addPending } = get();

        const currentCount = performedExercises.get(exerciseId) || 0;
        set((state) => ({
            performedExercises: new Map(state.performedExercises).set(
                exerciseId,
                currentCount + 1
            ),
        }));

        _addPending({ exerciseId, type: 'perform', metadata });
    },

    // Track adding to workout
    trackAddToWorkout: (exerciseId) => {
        get()._addPending({ exerciseId, type: 'add_to_workout' });
    },

    // Add pending interaction
    _addPending: (interaction) => {
        set((state) => ({
            pendingInteractions: [
                ...state.pendingInteractions,
                { ...interaction, timestamp: Date.now() },
            ],
        }));
    },

    // Flush pending interactions to Supabase
    flushInteractions: async () => {
        if (!isSupabaseConfigured()) return;

        const user = useAuthStore.getState().user;
        if (!user) return;

        const { pendingInteractions } = get();
        if (pendingInteractions.length === 0) return;

        // Clear pending before sending (optimistic)
        set({ pendingInteractions: [] });

        try {
            const interactions = pendingInteractions.map((i) => ({
                user_id: user.id,
                exercise_id: i.exerciseId,
                interaction_type: i.type,
                metadata: i.metadata || {},
                created_at: new Date(i.timestamp).toISOString(),
            }));

            const { error } = await supabase
                .from('exercise_interactions')
                .insert(interactions);

            if (error) {
                // Put back on queue if failed
                set((state) => ({
                    pendingInteractions: [...pendingInteractions, ...state.pendingInteractions],
                }));
                console.error('Failed to flush interactions:', error);
            }
        } catch (error) {
            // Put back on queue if failed
            set((state) => ({
                pendingInteractions: [...pendingInteractions, ...state.pendingInteractions],
            }));
            console.error('Failed to flush interactions:', error);
        }
    },

    // Fetch trending exercises
    fetchTrending: async () => {
        if (!isSupabaseConfigured()) return;

        const { lastTrendingFetch } = get();
        const now = Date.now();

        // Cache for 5 minutes
        if (lastTrendingFetch && now - lastTrendingFetch < 5 * 60 * 1000) {
            return;
        }

        try {
            const { data, error } = await supabase.rpc('get_trending_exercises', {
                p_limit: 20,
            });

            if (error) throw error;

            set({
                trendingExercises: data || [],
                lastTrendingFetch: now,
            });
        } catch (error) {
            // Only log detailed error once to avoid spamming console during network issues
            const now = Date.now();
            const lastError = (window as any).__lastTrendingError;
            if (!lastError || now - lastError > 30000) {
                console.warn('Unable to fetch trending exercises (likely offline or network issue):', error);
                (window as any).__lastTrendingError = now;
            }
        }
    },

    // Fetch user stats (streak, badges)
    fetchUserStats: async () => {
        if (!isSupabaseConfigured()) return;

        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
            // Fetch streak
            const { data: streakData } = await supabase
                .from('user_streaks')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // Fetch badges
            const { data: badgesData } = await supabase
                .from('exercise_badges')
                .select('*')
                .eq('user_id', user.id);

            set({
                streak: streakData || null,
                badges: badgesData || [],
            });
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
        }
    },
}));

/**
 * Hook for tracking exercise interactions
 */
export function useExerciseInteraction() {
    const { user } = useAuthStore();
    const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const flushInteractions = useInteractionStore((state) => state.flushInteractions);
    const fetchTrending = useInteractionStore((state) => state.fetchTrending);
    const fetchUserStats = useInteractionStore((state) => state.fetchUserStats);
    const trackViewStore = useInteractionStore((state) => state.trackView);
    const trackPerformStore = useInteractionStore((state) => state.trackPerform);
    const trackAddToWorkout = useInteractionStore((state) => state.trackAddToWorkout);

    const viewedExercises = useInteractionStore((state) => state.viewedExercises);
    const performedExercises = useInteractionStore((state) => state.performedExercises);
    const trendingExercises = useInteractionStore((state) => state.trendingExercises);
    const streak = useInteractionStore((state) => state.streak);
    const badges = useInteractionStore((state) => state.badges);

    // Set up periodic flushing of interactions
    useEffect(() => {
        if (!user) return;

        // Flush every 30 seconds
        flushIntervalRef.current = setInterval(() => {
            flushInteractions();
        }, 30000);

        // Flush on page unload
        const handleUnload = () => {
            flushInteractions();
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            if (flushIntervalRef.current) {
                clearInterval(flushIntervalRef.current);
            }
            window.removeEventListener('beforeunload', handleUnload);
            // Flush remaining on cleanup
            flushInteractions();
        };
    }, [user, flushInteractions]);

    // Fetch trending and user stats on mount
    useEffect(() => {
        fetchTrending();
        if (user) {
            fetchUserStats();
        }
    }, [user, fetchTrending, fetchUserStats]);

    // Track exercise view with debounce
    const trackView = useCallback(
        (exerciseId: string) => {
            trackViewStore(exerciseId);
        },
        [trackViewStore]
    );

    // Track exercise performance
    const trackPerform = useCallback(
        (exerciseId: string, metadata?: { sets?: number; reps?: number; weight?: number }) => {
            trackPerformStore(exerciseId, metadata);
        },
        [trackPerformStore]
    );

    // Check if exercise is trending
    const isTrending = useCallback(
        (exerciseId: string): boolean => {
            return trendingExercises.some(
                (t) => t.exercise_id === exerciseId && t.trend_score > 50
            );
        },
        [trendingExercises]
    );

    // Get trending score for exercise
    const getTrendingScore = useCallback(
        (exerciseId: string): number => {
            const trending = trendingExercises.find((t) => t.exercise_id === exerciseId);
            return trending?.trend_score || 0;
        },
        [trendingExercises]
    );

    // Get exercise view count (from trending data)
    const getViewCount = useCallback(
        (exerciseId: string): number => {
            const trending = trendingExercises.find((t) => t.exercise_id === exerciseId);
            return Number(trending?.total_views || 0);
        },
        [trendingExercises]
    );

    // Get exercise perform count (from trending data)
    const getPerformCount = useCallback(
        (exerciseId: string): number => {
            const trending = trendingExercises.find((t) => t.exercise_id === exerciseId);
            return Number(trending?.total_performs || 0);
        },
        [trendingExercises]
    );

    return {
        // Tracking
        trackView,
        trackPerform,
        trackAddToWorkout,

        // Session data
        viewedExercises,
        performedExercises,

        // Trending
        trendingExercises,
        isTrending,
        getTrendingScore,
        getViewCount,
        getPerformCount,
        refreshTrending: fetchTrending,

        // User stats
        streak,
        badges,
        refreshUserStats: fetchUserStats,

        // Manual flush
        flushInteractions,
    };
}

/**
 * Hook for tracking a specific exercise view
 * Automatically tracks when component mounts
 */
export function useTrackExerciseView(exerciseId: string | null) {
    const { trackView } = useExerciseInteraction();

    useEffect(() => {
        if (exerciseId) {
            trackView(exerciseId);
        }
    }, [exerciseId, trackView]);
}

export default useExerciseInteraction;
