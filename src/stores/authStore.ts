/**
 * Auth Store
 *
 * Manages user authentication state with Supabase.
 * Handles sign in, sign out, and profile management.
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { translate } from '@/lib/translate';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/types/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { track } from '@/lib/analytics/track';

let authSubscription: { unsubscribe: () => void } | null = null;

// Workout, nutrition and measurement data moved to device storage (ADR 11)
// and is no longer cleared here: until cloud sync exists (Lane E Day 6),
// clearing it on sign-out would permanently delete data that exists nowhere
// else. Day 6 clears it after a successful sync via clearLocalUserData().
const SENSITIVE_LOCAL_STORAGE_KEYS = [
    'fitwizard-trainer',
    'fitwizard-onboarding',
    'fitwizard-wizard',
    'fitwizard-wisdom',
];

const SENSITIVE_SESSION_STORAGE_KEYS = [
    'fitwizard-trainer-access-unlocked',
    'pendingInviteCode',
];

function getDisplayNameForUser(user: User): string {
    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const candidates = [
        metadata?.full_name,
        metadata?.name,
        metadata?.display_name,
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

    return 'Member';
}

function stripTrainerFields(updates: Partial<Profile>): Partial<Profile> {
    const { role: _role, is_trainer: _isTrainer, ...safeUpdates } = updates;
    return safeUpdates;
}

// Set by signOut({ quiet: true }) so the SIGNED_OUT event that follows doesn't
// show the "data stays on this device" toast either.
let quietSignOutPending = false;

function clearSensitiveStorage({ quiet = false }: { quiet?: boolean } = {}): void {
    if (typeof window === 'undefined') {
        return;
    }

    for (const key of SENSITIVE_LOCAL_STORAGE_KEYS) {
        window.localStorage.removeItem(key);
    }

    for (const key of SENSITIVE_SESSION_STORAGE_KEYS) {
        window.sessionStorage.removeItem(key);
    }

    if (quiet) {
        return;
    }

    // Same id: signOut() and the SIGNED_OUT event both call this; show one toast.
    toast.info(
        translate('storage.kept_on_device', 'Signed out. Your training data stays on this device.'),
        { id: 'fitwizard-data-kept-on-device' },
    );
}

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
    verifyEmailCode: (email: string, code: string) => Promise<{ error: Error | null }>;
    /** `quiet` skips the "data stays on this device" toast (for example after account deletion). */
    signOut: (options?: { quiet?: boolean }) => Promise<void>;
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
        authSubscription?.unsubscribe();
        authSubscription = null;

        if (!isSupabaseConfigured()) {
            set({
                user: null,
                session: null,
                profile: null,
                isLoading: false,
                isConfigured: false,
            });
            return;
        }

        set({ isLoading: true, isConfigured: true });

        try {
            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Session error:', sessionError);
                set({ isLoading: false, isConfigured: true });
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
                set({ user: null, session: null, profile: null, isLoading: false });
            }

            // Listen for auth changes
            const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
                try {
                    if (event === 'SIGNED_IN' && session?.user) {
                        track('signed_in'); // Lane C Day 4: covers magic-link and email-code sign-in
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
                                display_name: getDisplayNameForUser(session.user),
                                username: null,
                                avatar_url: null,
                                experience_level: null,
                                primary_goal: null,
                                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                role: 'client',
                                is_trainer: false,
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
                        clearSensitiveStorage({ quiet: quietSignOutPending });
                        quietSignOutPending = false;
                        set({
                            user: null,
                            session: null,
                            profile: null,
                            showAuthModal: false,
                            redirectUrl: null,
                        });
                    }
                } catch (error) {
                    console.error('Auth state change error:', error);
                }
            });
            authSubscription = data.subscription;
        } catch (error) {
            console.error('Auth initialization error:', error);
            toast.error('Failed to initialize authentication');
            set({ isLoading: false, isConfigured: true });
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

    // Verify the 6-digit code from the sign-in email (contract #7). On success
    // Supabase emits SIGNED_IN, and the onAuthStateChange handler above loads
    // the session and profile, exactly as for the magic link.
    verifyEmailCode: async (email, code) => {
        if (!isSupabaseConfigured()) {
            return { error: new Error('Supabase not configured') };
        }

        const { error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: code.trim(),
            type: 'email',
        });

        return { error: error as Error | null };
    },

    // Sign out
    signOut: async ({ quiet = false } = {}) => {
        clearSensitiveStorage({ quiet });
        set({
            user: null,
            session: null,
            profile: null,
            showAuthModal: false,
            redirectUrl: null,
        });

        if (!isSupabaseConfigured()) return;

        quietSignOutPending = quiet;
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
                toast.error('Failed to sign out');
            }
        } catch (error) {
            console.error('Sign out error:', error);
            toast.error('Failed to sign out');
        } finally {
            quietSignOutPending = false;
        }

    },

    // Update profile
    updateProfile: async (updates) => {
        const { user } = get();
        if (!user || !isSupabaseConfigured()) {
            return { error: new Error('Not authenticated') };
        }

        const safeUpdates = stripTrainerFields(updates);
        const { data, error } = await supabase
            .from('profiles')
            .update(safeUpdates)
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
    setRedirectUrl: (url) => {
        if (url === null) { set({ redirectUrl: null }); return; }
        try {
            const parsed = new URL(url);
            if (parsed.origin !== window.location.origin) {
                if (import.meta.env.DEV) console.warn('[Auth] Rejected cross-origin redirect:', parsed.origin);
                set({ redirectUrl: window.location.origin });
                return;
            }
        } catch {
            set({ redirectUrl: window.location.origin });
            return;
        }
        set({ redirectUrl: url });
    },
}));
