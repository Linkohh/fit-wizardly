/**
 * Auth Store
 *
 * Manages user authentication state with Supabase.
 * Handles sign in, sign out, and profile management.
 */

import { create } from 'zustand';
import { toast } from 'sonner';
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
    redirectUrl: string | null;
    setRedirectUrl: (url: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    // Initial state
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isConfigured: isSupabaseConfigured(),
    showAuthModal: false,
    redirectUrl: null,

    // Initialize auth state
    initialize: async () => {
        if (!isSupabaseConfigured()) {
            set({ isLoading: false, isConfigured: false });
            return;
        }

        try {
            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Session error:', sessionError);
                set({ isLoading: false });
                return;
            }

            if (session?.user) {
                // Fetch user profile - use maybeSingle to handle missing profile gracefully
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error('Profile fetch error:', profileError);
                    // Continue without profile rather than failing
                }

                set({
                    user: session.user,
                    session,
                    profile: profile || null,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                try {
                    if (event === 'SIGNED_IN' && session?.user) {
                        // Fetch or create profile
                        const { data: existingProfile, error: fetchError } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .maybeSingle();

                        let profile = existingProfile;

                        if (fetchError) {
                            console.error('Profile fetch error on sign in:', fetchError);
                        }

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

                            const { data: createdProfile, error: createError } = await supabase
                                .from('profiles')
                                .insert(newProfile)
                                .select()
                                .single();

                            if (createError) {
                                console.error('Profile creation error:', createError);
                                toast.error('Failed to create profile');
                            } else {
                                profile = createdProfile;
                            }
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
                } catch (error) {
                    console.error('Auth state change error:', error);
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            toast.error('Failed to initialize authentication');
            set({ isLoading: false });
        }
    },

    // Sign in with magic link
    signInWithEmail: async (email) => {
        if (!isSupabaseConfigured()) {
            return { error: new Error('Supabase not configured') };
        }

        const { redirectUrl } = get();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectUrl || window.location.origin,
            },
        });

        return { error: error as Error | null };
    },

    // Sign out
    signOut: async () => {
        if (!isSupabaseConfigured()) return;

        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
                toast.error('Failed to sign out');
            }
        } catch (error) {
            console.error('Sign out error:', error);
            toast.error('Failed to sign out');
        }

        // Clear state regardless of API result to ensure user can log out
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
    setRedirectUrl: (url) => set({ redirectUrl: url }),
}));
