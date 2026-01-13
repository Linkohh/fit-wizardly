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
import type { InteractionType, TrendingExercise, UserStreak, ExerciseBadge } from '@/types/supabase';

// Pending interaction to be synced
interface PendingInteraction {
    exerciseId: string;
    type: InteractionType;
    metadata?: Record<string, any>;
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
    trackPerform: (exerciseId: string, metadata?: Record<string, any>) => void;
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
            console.error('Failed to fetch trending:', error);
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
    const store = useInteractionStore();
    const { user } = useAuthStore();
    const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Set up periodic flushing of interactions
    useEffect(() => {
        if (!user) return;

        // Flush every 30 seconds
        flushIntervalRef.current = setInterval(() => {
            store.flushInteractions();
        }, 30000);

        // Flush on page unload
        const handleUnload = () => {
            store.flushInteractions();
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            if (flushIntervalRef.current) {
                clearInterval(flushIntervalRef.current);
            }
            window.removeEventListener('beforeunload', handleUnload);
            // Flush remaining on cleanup
            store.flushInteractions();
        };
    }, [user, store.flushInteractions]);

    // Fetch trending and user stats on mount
    useEffect(() => {
        store.fetchTrending();
        if (user) {
            store.fetchUserStats();
        }
    }, [user, store.fetchTrending, store.fetchUserStats]);

    // Track exercise view with debounce
    const trackView = useCallback(
        (exerciseId: string) => {
            store.trackView(exerciseId);
        },
        [store.trackView]
    );

    // Track exercise performance
    const trackPerform = useCallback(
        (exerciseId: string, metadata?: { sets?: number; reps?: number; weight?: number }) => {
            store.trackPerform(exerciseId, metadata);
        },
        [store.trackPerform]
    );

    // Check if exercise is trending
    const isTrending = useCallback(
        (exerciseId: string): boolean => {
            return store.trendingExercises.some(
                (t) => t.exercise_id === exerciseId && t.trend_score > 50
            );
        },
        [store.trendingExercises]
    );

    // Get trending score for exercise
    const getTrendingScore = useCallback(
        (exerciseId: string): number => {
            const trending = store.trendingExercises.find((t) => t.exercise_id === exerciseId);
            return trending?.trend_score || 0;
        },
        [store.trendingExercises]
    );

    // Get exercise view count (from trending data)
    const getViewCount = useCallback(
        (exerciseId: string): number => {
            const trending = store.trendingExercises.find((t) => t.exercise_id === exerciseId);
            return Number(trending?.total_views || 0);
        },
        [store.trendingExercises]
    );

    // Get exercise perform count (from trending data)
    const getPerformCount = useCallback(
        (exerciseId: string): number => {
            const trending = store.trendingExercises.find((t) => t.exercise_id === exerciseId);
            return Number(trending?.total_performs || 0);
        },
        [store.trendingExercises]
    );

    return {
        // Tracking
        trackView,
        trackPerform,
        trackAddToWorkout: store.trackAddToWorkout,

        // Session data
        viewedExercises: store.viewedExercises,
        performedExercises: store.performedExercises,

        // Trending
        trendingExercises: store.trendingExercises,
        isTrending,
        getTrendingScore,
        getViewCount,
        getPerformCount,
        refreshTrending: store.fetchTrending,

        // User stats
        streak: store.streak,
        badges: store.badges,
        refreshUserStats: store.fetchUserStats,

        // Manual flush
        flushInteractions: store.flushInteractions,
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
