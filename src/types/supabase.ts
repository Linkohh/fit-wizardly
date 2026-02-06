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
    soundsExplicitlySet?: boolean;
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

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            circle_activities: {
                Row: {
                    activity_type: string
                    circle_id: string | null
                    created_at: string | null
                    id: string
                    payload: Json | null
                    user_id: string | null
                }
                Insert: {
                    activity_type: string
                    circle_id?: string | null
                    created_at?: string | null
                    id?: string
                    payload?: Json | null
                    user_id?: string | null
                }
                Update: {
                    activity_type?: string
                    circle_id?: string | null
                    created_at?: string | null
                    id?: string
                    payload?: Json | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "circle_activities_circle_id_fkey"
                        columns: ["circle_id"]
                        isOneToOne: false
                        referencedRelation: "circles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "circle_activities_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            circle_challenges: {
                Row: {
                    challenge_type: string | null
                    circle_id: string | null
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    end_date: string
                    goal_value: number | null
                    id: string
                    start_date: string
                    status: string | null
                    title: string
                    unit: string | null
                    winner_id: string | null
                }
                Insert: {
                    challenge_type?: string | null
                    circle_id?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    end_date: string
                    goal_value?: number | null
                    id?: string
                    start_date: string
                    status?: string | null
                    title: string
                    unit?: string | null
                    winner_id?: string | null
                }
                Update: {
                    challenge_type?: string | null
                    circle_id?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    end_date?: string
                    goal_value?: number | null
                    id?: string
                    start_date?: string
                    status?: string | null
                    title?: string
                    unit?: string | null
                    winner_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "circle_challenges_circle_id_fkey"
                        columns: ["circle_id"]
                        isOneToOne: false
                        referencedRelation: "circles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "circle_challenges_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "circle_challenges_winner_id_fkey"
                        columns: ["winner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            circle_members: {
                Row: {
                    circle_id: string | null
                    id: string
                    joined_at: string | null
                    role: string | null
                    user_id: string | null
                }
                Insert: {
                    circle_id?: string | null
                    id?: string
                    joined_at?: string | null
                    role?: string | null
                    user_id?: string | null
                }
                Update: {
                    circle_id?: string | null
                    id?: string
                    joined_at?: string | null
                    role?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "circle_members_circle_id_fkey"
                        columns: ["circle_id"]
                        isOneToOne: false
                        referencedRelation: "circles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "circle_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            circles: {
                Row: {
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    id: string
                    invite_code: string | null
                    is_public: boolean | null
                    max_members: number | null
                    name: string
                }
                Insert: {
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    invite_code?: string | null
                    is_public?: boolean | null
                    max_members?: number | null
                    name: string
                }
                Update: {
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    invite_code?: string | null
                    is_public?: boolean | null
                    max_members?: number | null
                    name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "circles_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    display_name: string | null
                    experience_level: string | null
                    id: string
                    primary_goal: string | null
                    timezone: string | null
                    username: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    experience_level?: string | null
                    id: string
                    primary_goal?: string | null
                    timezone?: string | null
                    username?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    experience_level?: string | null
                    id?: string
                    primary_goal?: string | null
                    timezone?: string | null
                    username?: string | null
                }
                Relationships: []
            }
            plans: {
                Row: {
                    user_id: string
                    id: string
                    plan: Json
                    schema_version: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    id: string
                    plan: Json
                    schema_version?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    id?: string
                    plan?: Json
                    schema_version?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            activity_reactions: {
                Row: {
                    id: string
                    activity_id: string
                    user_id: string
                    reaction_type: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    activity_id: string
                    user_id: string
                    reaction_type?: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    activity_id?: string
                    user_id?: string
                    reaction_type?: string
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_reactions_activity_id_fkey"
                        columns: ["activity_id"]
                        isOneToOne: false
                        referencedRelation: "circle_activities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_reactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            activity_comments: {
                Row: {
                    id: string
                    activity_id: string
                    user_id: string
                    content: string
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    activity_id: string
                    user_id: string
                    content: string
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    activity_id?: string
                    user_id?: string
                    content?: string
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_comments_activity_id_fkey"
                        columns: ["activity_id"]
                        isOneToOne: false
                        referencedRelation: "circle_activities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_comments_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            circle_posts: {
                Row: {
                    id: string
                    circle_id: string
                    user_id: string
                    content: string
                    image_url: string | null
                    post_type: string
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    circle_id: string
                    user_id: string
                    content: string
                    image_url?: string | null
                    post_type?: string
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    circle_id?: string
                    user_id?: string
                    content?: string
                    image_url?: string | null
                    post_type?: string
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "circle_posts_circle_id_fkey"
                        columns: ["circle_id"]
                        isOneToOne: false
                        referencedRelation: "circles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "circle_posts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            challenge_participants: {
                Row: {
                    id: string
                    challenge_id: string
                    user_id: string
                    score: number | null
                    last_updated: string | null
                    joined_at: string | null
                }
                Insert: {
                    id?: string
                    challenge_id: string
                    user_id: string
                    score?: number | null
                    last_updated?: string | null
                    joined_at?: string | null
                }
                Update: {
                    id?: string
                    challenge_id?: string
                    user_id?: string
                    score?: number | null
                    last_updated?: string | null
                    joined_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "challenge_participants_challenge_id_fkey"
                        columns: ["challenge_id"]
                        isOneToOne: false
                        referencedRelation: "circle_challenges"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "challenge_participants_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            exercise_interactions: {
                Row: {
                    id: string
                    user_id: string | null
                    exercise_id: string
                    interaction_type: string
                    created_at: string | null
                    metadata: Json | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    exercise_id: string
                    interaction_type: string
                    created_at?: string | null
                    metadata?: Json | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    exercise_id?: string
                    interaction_type?: string
                    created_at?: string | null
                    metadata?: Json | null
                }
                Relationships: []
            }
            user_exercise_preferences: {
                Row: {
                    user_id: string
                    favorites: string[] | null
                    collections: Json | null
                    filter_presets: Json | null
                    settings: Json | null
                    recently_viewed: string[] | null
                    updated_at: string | null
                }
                Insert: {
                    user_id: string
                    favorites?: string[] | null
                    collections?: Json | null
                    filter_presets?: Json | null
                    settings?: Json | null
                    recently_viewed?: string[] | null
                    updated_at?: string | null
                }
                Update: {
                    user_id?: string
                    favorites?: string[] | null
                    collections?: Json | null
                    filter_presets?: Json | null
                    settings?: Json | null
                    recently_viewed?: string[] | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            exercise_stats: {
                Row: {
                    id: string
                    exercise_id: string
                    stat_date: string
                    view_count: number | null
                    perform_count: number | null
                    favorite_count: number | null
                }
                Insert: {
                    id?: string
                    exercise_id: string
                    stat_date?: string
                    view_count?: number | null
                    perform_count?: number | null
                    favorite_count?: number | null
                }
                Update: {
                    id?: string
                    exercise_id?: string
                    stat_date?: string
                    view_count?: number | null
                    perform_count?: number | null
                    favorite_count?: number | null
                }
                Relationships: []
            }
            user_streaks: {
                Row: {
                    user_id: string
                    current_streak: number | null
                    longest_streak: number | null
                    last_activity_date: string | null
                    streak_started_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    user_id: string
                    current_streak?: number | null
                    longest_streak?: number | null
                    last_activity_date?: string | null
                    streak_started_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    user_id?: string
                    current_streak?: number | null
                    longest_streak?: number | null
                    last_activity_date?: string | null
                    streak_started_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            exercise_badges: {
                Row: {
                    id: string
                    user_id: string | null
                    badge_type: string
                    badge_name: string
                    earned_at: string | null
                    metadata: Json | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    badge_type: string
                    badge_name: string
                    earned_at?: string | null
                    metadata?: Json | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    badge_type?: string
                    badge_name?: string
                    earned_at?: string | null
                    metadata?: Json | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_trending_exercises: {
                Args: {
                    p_limit?: number
                }
                Returns: {
                    exercise_id: string
                    total_views: number
                    total_performs: number
                    total_favorites: number
                    trend_score: number
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Circle = Database['public']['Tables']['circles']['Row'];
export type CircleMember = Database['public']['Tables']['circle_members']['Row'];
export type CircleActivity = Database['public']['Tables']['circle_activities']['Row'];
export type CircleChallenge = Database['public']['Tables']['circle_challenges']['Row'];

// Extended types with joins
export interface CircleWithMembers extends Circle {
    members: (CircleMember & { profile: Profile | null })[];
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

// ============================================
// Social Features Types (Phase 2)
// ============================================

// Reaction types
export type ReactionType = 'like' | 'fire' | 'muscle' | 'clap';

export interface ActivityReaction {
    id: string;
    activity_id: string;
    user_id: string;
    reaction_type: ReactionType;
    created_at: string;
}

export interface ActivityComment {
    id: string;
    activity_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface ActivityCommentWithProfile extends ActivityComment {
    profile: Profile;
}

export interface CirclePost {
    id: string;
    circle_id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    post_type: 'text' | 'image' | 'milestone';
    created_at: string;
    updated_at: string;
}

export interface CirclePostWithProfile extends CirclePost {
    profile: Profile;
}

export interface ChallengeParticipant {
    id: string;
    challenge_id: string;
    user_id: string;
    score: number;
    last_updated: string;
    joined_at: string;
}

export interface ChallengeParticipantWithProfile extends ChallengeParticipant {
    profile: Profile;
}

// Extended activity type with social interactions
export interface ActivityWithInteractions extends ActivityWithProfile {
    reactions: ActivityReaction[];
    comments: ActivityCommentWithProfile[];
    reaction_count: number;
    comment_count: number;
    user_reaction?: ReactionType | null;
}

// Extended challenge type with participants
export interface ChallengeWithParticipants extends CircleChallenge {
    participants: ChallengeParticipantWithProfile[];
    user_progress?: ChallengeParticipant;
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
