/**
 * Supabase Database Types
 *
 * TypeScript definitions for the Supabase database schema.
 * This provides type safety for all database operations.
 */

// Exercise preferences settings
export interface ExerciseSettings {
    haptics: boolean;
    sounds: boolean;
    reducedMotion?: boolean;
}

// Exercise collection type
export interface ExerciseCollection {
    id: string;
    name: string;
    color?: string;
    exerciseIds: string[];
    createdAt: string;
}

export interface Database {
    public: {
        Tables: {
            exercise_interactions: {
                Row: {
                    id: string;
                    user_id: string;
                    exercise_id: string;
                    interaction_type: 'view' | 'favorite' | 'unfavorite' | 'perform' | 'add_to_workout' | 'add_to_collection';
                    created_at: string;
                    metadata: Record<string, any>;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    exercise_id: string;
                    interaction_type: 'view' | 'favorite' | 'unfavorite' | 'perform' | 'add_to_workout' | 'add_to_collection';
                    created_at?: string;
                    metadata?: Record<string, any>;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    exercise_id?: string;
                    interaction_type?: 'view' | 'favorite' | 'unfavorite' | 'perform' | 'add_to_workout' | 'add_to_collection';
                    created_at?: string;
                    metadata?: Record<string, any>;
                };
            };
            user_exercise_preferences: {
                Row: {
                    user_id: string;
                    favorites: string[];
                    collections: Record<string, string[]>;
                    filter_presets: Record<string, any>;
                    settings: ExerciseSettings;
                    recently_viewed: string[];
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    favorites?: string[];
                    collections?: Record<string, string[]>;
                    filter_presets?: Record<string, any>;
                    settings?: ExerciseSettings;
                    recently_viewed?: string[];
                    updated_at?: string;
                };
                Update: {
                    user_id?: string;
                    favorites?: string[];
                    collections?: Record<string, string[]>;
                    filter_presets?: Record<string, any>;
                    settings?: ExerciseSettings;
                    recently_viewed?: string[];
                    updated_at?: string;
                };
            };
            exercise_stats: {
                Row: {
                    id: string;
                    exercise_id: string;
                    stat_date: string;
                    view_count: number;
                    perform_count: number;
                    favorite_count: number;
                };
                Insert: {
                    id?: string;
                    exercise_id: string;
                    stat_date?: string;
                    view_count?: number;
                    perform_count?: number;
                    favorite_count?: number;
                };
                Update: {
                    id?: string;
                    exercise_id?: string;
                    stat_date?: string;
                    view_count?: number;
                    perform_count?: number;
                    favorite_count?: number;
                };
            };
            user_streaks: {
                Row: {
                    user_id: string;
                    current_streak: number;
                    longest_streak: number;
                    last_activity_date: string | null;
                    streak_started_at: string | null;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    current_streak?: number;
                    longest_streak?: number;
                    last_activity_date?: string | null;
                    streak_started_at?: string | null;
                    updated_at?: string;
                };
                Update: {
                    user_id?: string;
                    current_streak?: number;
                    longest_streak?: number;
                    last_activity_date?: string | null;
                    streak_started_at?: string | null;
                    updated_at?: string;
                };
            };
            exercise_badges: {
                Row: {
                    id: string;
                    user_id: string;
                    badge_type: string;
                    badge_name: string;
                    earned_at: string;
                    metadata: Record<string, any>;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    badge_type: string;
                    badge_name: string;
                    earned_at?: string;
                    metadata?: Record<string, any>;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    badge_type?: string;
                    badge_name?: string;
                    earned_at?: string;
                    metadata?: Record<string, any>;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    display_name: string | null;
                    avatar_url: string | null;
                    experience_level: string | null;
                    primary_goal: string | null;
                    timezone: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    experience_level?: string | null;
                    primary_goal?: string | null;
                    timezone?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    experience_level?: string | null;
                    primary_goal?: string | null;
                    timezone?: string | null;
                    created_at?: string;
                };
            };
            circles: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    created_by: string | null;
                    max_members: number;
                    is_public: boolean;
                    invite_code: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    created_by?: string | null;
                    max_members?: number;
                    is_public?: boolean;
                    invite_code?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    created_by?: string | null;
                    max_members?: number;
                    is_public?: boolean;
                    invite_code?: string | null;
                    created_at?: string;
                };
            };
            circle_members: {
                Row: {
                    id: string;
                    circle_id: string;
                    user_id: string;
                    role: string;
                    joined_at: string;
                };
                Insert: {
                    id?: string;
                    circle_id: string;
                    user_id: string;
                    role?: string;
                    joined_at?: string;
                };
                Update: {
                    id?: string;
                    circle_id?: string;
                    user_id?: string;
                    role?: string;
                    joined_at?: string;
                };
            };
            circle_activities: {
                Row: {
                    id: string;
                    circle_id: string;
                    user_id: string | null;
                    activity_type: string;
                    payload: Record<string, any> | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    circle_id: string;
                    user_id?: string | null;
                    activity_type: string;
                    payload?: Record<string, any> | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    circle_id?: string;
                    user_id?: string | null;
                    activity_type?: string;
                    payload?: Record<string, any> | null;
                    created_at?: string;
                };
            };
            circle_challenges: {
                Row: {
                    id: string;
                    circle_id: string;
                    title: string;
                    description: string | null;
                    challenge_type: string | null;
                    start_date: string;
                    end_date: string;
                    created_by: string | null;
                    winner_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    circle_id: string;
                    title: string;
                    description?: string | null;
                    challenge_type?: string | null;
                    start_date: string;
                    end_date: string;
                    created_by?: string | null;
                    winner_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    circle_id?: string;
                    title?: string;
                    description?: string | null;
                    challenge_type?: string | null;
                    start_date?: string;
                    end_date?: string;
                    created_by?: string | null;
                    winner_id?: string | null;
                    created_at?: string;
                };
            };
        };
        Views: {};
        Functions: {};
        Enums: {};
    };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Circle = Database['public']['Tables']['circles']['Row'];
export type CircleMember = Database['public']['Tables']['circle_members']['Row'];
export type CircleActivity = Database['public']['Tables']['circle_activities']['Row'];
export type CircleChallenge = Database['public']['Tables']['circle_challenges']['Row'];

// Extended types with joins
export interface CircleWithMembers extends Circle {
    members: (CircleMember & { profile: Profile })[];
    member_count: number;
}

export interface ActivityWithProfile extends CircleActivity {
    profile: Profile;
}

// Activity payload types
export interface WorkoutLoggedPayload {
    workoutName: string;
    duration: number;
    exerciseCount: number;
    totalVolume: number;
}

export interface PRSetPayload {
    exerciseName: string;
    oldValue: number;
    newValue: number;
    prType: 'weight' | 'reps' | 'volume';
}

export interface StreakPayload {
    streakDays: number;
}

// Exercise convenience types
export type ExerciseInteraction = Database['public']['Tables']['exercise_interactions']['Row'];
export type UserExercisePreferences = Database['public']['Tables']['user_exercise_preferences']['Row'];
export type ExerciseStat = Database['public']['Tables']['exercise_stats']['Row'];
export type UserStreak = Database['public']['Tables']['user_streaks']['Row'];
export type ExerciseBadge = Database['public']['Tables']['exercise_badges']['Row'];

// Interaction types
export type InteractionType = ExerciseInteraction['interaction_type'];

// Badge types for exercises
export type ExerciseBadgeType =
    | 'first_exercise' // First exercise viewed
    | 'explorer_10' // Viewed 10 different exercises
    | 'explorer_50' // Viewed 50 different exercises
    | 'explorer_100' // Viewed 100 different exercises
    | 'chest_master' // Performed 20 chest exercises
    | 'back_master' // Performed 20 back exercises
    | 'leg_master' // Performed 20 leg exercises
    | 'arm_master' // Performed 20 arm exercises
    | 'core_master' // Performed 20 core exercises
    | 'full_body' // Performed exercises for all muscle groups
    | 'workout_builder' // Built first custom workout
    | 'collector' // Created first collection
    | 'streak_7' // 7-day streak
    | 'streak_30' // 30-day streak
    | 'streak_100'; // 100-day streak

// Trending exercise result from Supabase function
export interface TrendingExercise {
    exercise_id: string;
    total_views: number;
    total_performs: number;
    total_favorites: number;
    trend_score: number;
}
