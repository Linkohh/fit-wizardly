/**
 * Supabase Database Types
 * 
 * TypeScript definitions for the Supabase database schema.
 * This provides type safety for all database operations.
 */

export interface Database {
    public: {
        Tables: {
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
