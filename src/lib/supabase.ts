/**
 * Supabase Client Configuration
 *
 * Initializes the Supabase client for database, auth, and real-time features.
 * Environment variables are loaded from .env.local.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { createAuthSessionStorage, getAuthStorageKey } from '@/lib/authSessionStorage';

function isLoopbackHost(hostname: string) {
  const normalized = hostname.replace(/^\[/, '').replace(/\]$/, '');
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.endsWith('.localhost')
  );
}

export function validateRemoteEndpoint(value: string | undefined, label: string) {
  if (!value) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`[FitWizard] ${label} is not a valid URL`);
  }

  if (parsed.protocol !== 'https:' && !isLoopbackHost(parsed.hostname)) {
    throw new Error(
      `[FitWizard] ${label} must use HTTPS outside localhost (received ${parsed.protocol}//${parsed.host})`
    );
  }

  return parsed.toString().replace(/\/$/, '');
}

const supabaseUrl = validateRemoteEndpoint(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials not found. Circles feature will be disabled.\n' +
      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
  );
}

const resolvedSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const authStorageKey = getAuthStorageKey(resolvedSupabaseUrl);

export const supabase = createClient<Database>(
  resolvedSupabaseUrl,
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Sessions last across restarts (ADR 12): @capacitor/preferences on
      // native, localStorage on the web. Sessions saved in sessionStorage by
      // older versions are moved over once.
      storageKey: authStorageKey,
      storage: typeof window !== 'undefined' ? createAuthSessionStorage(authStorageKey) : undefined,
    },
  }
);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
