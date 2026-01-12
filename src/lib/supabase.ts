/**
 * Supabase Client Configuration
 * 
 * Initializes the Supabase client for database, auth, and real-time features.
 * Environment variables are loaded from .env.local
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase credentials not found. Circles feature will be disabled.\n' +
        'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
    );
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
    return !!(supabaseUrl && supabaseAnonKey);
};
