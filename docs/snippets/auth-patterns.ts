/**
 * Authentication Patterns - Reusable auth implementations
 *
 * This file contains copy-paste-ready patterns for authentication with Supabase.
 * Patterns include store management, protected routes, and API authentication.
 *
 * Key dependencies:
 * - @supabase/supabase-js
 * - zustand
 * - react-router-dom
 */

import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// ============================================================================
// PATTERN 1: Supabase Client Setup
// ============================================================================

/**
 * Create Supabase client with type-safe environment variables
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

// ============================================================================
// PATTERN 2: Auth Store (Zustand + Supabase)
// ============================================================================

interface Profile {
    id: string;
    display_name: string;
    username: string | null;
    avatar_url: string | null;
    experience_level: string | null;
    primary_goal: string | null;
    timezone: string | null;
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
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

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
                if (event === 'SIGNED_IN' && session?.user) {
                    // Fetch or create profile
                    let { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (!profile) {
                        // Create new profile
                        const newProfile = {
                            id: session.user.id,
                            display_name: session.user.email?.split('@')[0] || 'User',
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

        await supabase.auth.signOut();

        // Clear state regardless of API result
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

// ============================================================================
// PATTERN 3: RequireAuth Component
// ============================================================================

interface RequireAuthProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Route wrapper that requires authentication.
 * Redirects to login or shows fallback if not authenticated.
 */
export function RequireAuth({ children, fallback }: RequireAuthProps) {
    const { user, isLoading, setShowAuthModal, setRedirectUrl } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        // Show loading state
        return fallback || <div>Loading...</div>;
    }

    if (!user) {
        // Store intended destination for redirect after login
        setRedirectUrl(location.pathname + location.search);
        setShowAuthModal(true);

        // Redirect to home or login page
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

// Usage in router:
// <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

// ============================================================================
// PATTERN 4: useRequireAuth Hook
// ============================================================================

/**
 * Hook for programmatic auth checks.
 * Returns auth state and helper functions.
 */
export function useRequireAuth() {
    const {
        user,
        session,
        isLoading,
        setShowAuthModal,
        setRedirectUrl,
    } = useAuthStore();

    const requireAuth = (redirectPath?: string) => {
        if (!user) {
            if (redirectPath) {
                setRedirectUrl(redirectPath);
            }
            setShowAuthModal(true);
            return false;
        }
        return true;
    };

    return {
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        requireAuth,
    };
}

// Usage:
// const { requireAuth } = useRequireAuth();
// const handleClick = () => {
//   if (!requireAuth('/dashboard')) return;
//   // Proceed with authenticated action
// };

// ============================================================================
// PATTERN 5: Auth Headers for API Requests
// ============================================================================

/**
 * Get authorization headers for API requests.
 */
export function getAuthHeaders(): HeadersInit {
    const { session } = useAuthStore.getState();

    if (!session?.access_token) {
        throw new Error('Not authenticated');
    }

    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Authenticated fetch wrapper.
 */
export async function authFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers = getAuthHeaders();

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    // Handle token expiry
    if (response.status === 401) {
        // Trigger re-authentication
        useAuthStore.getState().setShowAuthModal(true);
        throw new Error('Session expired');
    }

    return response;
}

// ============================================================================
// PATTERN 6: Server-Side Token Verification (Express)
// ============================================================================

/**
 * Express middleware for token verification.
 * Place this in server/src/middleware/auth.ts
 */

/*
import { Request, Response, NextFunction } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
}

export const requireAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Missing or invalid Authorization header'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token with Supabase Auth API
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY || ''
            }
        });

        if (!response.ok) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const data = await response.json();
        req.user = { id: data.id, email: data.email };
        next();
    } catch (error) {
        console.error('Auth verification failed:', error);
        res.status(500).json({ error: 'Internal authentication error' });
    }
};
*/

// ============================================================================
// PATTERN 7: OAuth Sign-In
// ============================================================================

type OAuthProvider = 'google' | 'github' | 'discord';

export async function signInWithOAuth(provider: OAuthProvider) {
    if (!isSupabaseConfigured()) {
        return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    return { error: error as Error | null };
}

// ============================================================================
// PATTERN 8: Password Auth (Alternative to Magic Link)
// ============================================================================

export async function signUpWithPassword(email: string, password: string) {
    if (!isSupabaseConfigured()) {
        return { error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
    });

    return { data, error: error as Error | null };
}

export async function signInWithPassword(email: string, password: string) {
    if (!isSupabaseConfigured()) {
        return { error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return { data, error: error as Error | null };
}

// ============================================================================
// PATTERN 9: Session Refresh
// ============================================================================

/**
 * Manually refresh the session.
 * Useful before making important API calls.
 */
export async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
        console.error('Session refresh failed:', error);
        // Force re-authentication
        useAuthStore.getState().setShowAuthModal(true);
        return { session: null, error };
    }

    return { session: data.session, error: null };
}

// ============================================================================
// PATTERN 10: Auth State Selectors
// ============================================================================

/**
 * Zustand selectors for efficient re-renders.
 * Only re-render when specific slice of state changes.
 */

// Only re-render when user changes
export const useUser = () => useAuthStore((state) => state.user);

// Only re-render when loading state changes
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

// Only re-render when authenticated status changes
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);

// Combined selector for common use case
export const useAuth = () =>
    useAuthStore((state) => ({
        user: state.user,
        session: state.session,
        isLoading: state.isLoading,
        isAuthenticated: !!state.user,
    }));
