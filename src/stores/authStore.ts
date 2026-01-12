/**
 * Auth Store
 * 
 * Manages user authentication state with Supabase.
 * Handles sign in, sign out, and profile management.
 */

import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/types/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
    // State
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    isConfigured: boolean;

    // Actions
    initialize: () => Promise<void>;
    signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;

    // UI state
    showAuthModal: boolean;
    setShowAuthModal: (show: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    // Initial state
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isConfigured: isSupabaseConfigured(),
    showAuthModal: false,

    // Initialize auth state
    initialize: async () => {
        if (!isSupabaseConfigured()) {
            set({ isLoading: false, isConfigured: false });
            return;
        }

        try {
            // Get current session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                set({
                    user: session.user,
                    session,
                    profile,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    // Fetch or create profile
                    let { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (!profile) {
                        // Create new profile
                        const newProfile = {
                            id: session.user.id,
                            display_name: session.user.email?.split('@')[0] || 'User',
                            username: null,
                            avatar_url: null,
                            experience_level: null,
                            primary_goal: null,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        };

                        const { data } = await supabase
                            .from('profiles')
                            .insert(newProfile)
                            .select()
                            .single();

                        profile = data;
                    }

                    set({
                        user: session.user,
                        session,
                        profile,
                        showAuthModal: false,
                    });
                } else if (event === 'SIGNED_OUT') {
                    set({
                        user: null,
                        session: null,
                        profile: null,
                    });
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ isLoading: false });
        }
    },

    // Sign in with magic link
    signInWithEmail: async (email) => {
        if (!isSupabaseConfigured()) {
            return { error: new Error('Supabase not configured') };
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });

        return { error: error as Error | null };
    },

    // Sign out
    signOut: async () => {
        if (!isSupabaseConfigured()) return;

        await supabase.auth.signOut();
        set({
            user: null,
            session: null,
            profile: null,
        });
    },

    // Update profile
    updateProfile: async (updates) => {
        const { user } = get();
        if (!user || !isSupabaseConfigured()) {
            return { error: new Error('Not authenticated') };
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (data) {
            set({ profile: data });
        }

        return { error: error as Error | null };
    },

    // UI
    setShowAuthModal: (show) => set({ showAuthModal: show }),
}));
