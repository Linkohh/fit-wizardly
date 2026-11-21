/**
 * Where the Supabase session lives (ADR 12).
 *
 * - Native (Capacitor): `@capacitor/preferences` (UserDefaults on iOS,
 *   SharedPreferences on Android). The WebView's own storage can be cleared by
 *   the OS, so the session is kept outside it. The plugin is loaded lazily.
 * - Web: `window.localStorage`, the Supabase default, so a closed tab or a
 *   browser restart no longer signs people out.
 *
 * Before this change the session lived in `sessionStorage`. The first time the
 * adapter is used it moves any session found there into the new storage, so
 * nobody is signed out by the update. The move runs once per app start and
 * removes the old copy, so it never runs again for the same session.
 */

import { isNativeApp } from '@/lib/platform';

/** The async storage shape Supabase's `auth.storage` option accepts. */
export interface AuthSessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

type PreferencesPlugin = {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
};

/**
 * The key Supabase uses by default: `sb-<project ref>-auth-token`. We pass it
 * explicitly so the migration below and the client always agree on it.
 */
export function getAuthStorageKey(supabaseUrl: string): string {
  let hostname = 'placeholder';
  try {
    hostname = new URL(supabaseUrl).hostname;
  } catch {
    // Keep the placeholder; an invalid URL is reported by validateRemoteEndpoint.
  }
  return `sb-${hostname.split('.')[0]}-auth-token`;
}

function getWindowStorage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window[kind];
  } catch {
    // Some browsers throw on access when site data is blocked.
    return null;
  }
}

let preferencesPromise: Promise<PreferencesPlugin> | null = null;

function loadPreferences(): Promise<PreferencesPlugin> {
  if (!preferencesPromise) {
    preferencesPromise = import('@capacitor/preferences').then(
      (module): PreferencesPlugin => module.Preferences,
    );
    // Let a later call try again if the first load fails.
    preferencesPromise.catch(() => {
      preferencesPromise = null;
    });
  }
  return preferencesPromise;
}

function createNativeStorage(): AuthSessionStorage {
  return {
    async getItem(key) {
      const { value } = await (await loadPreferences()).get({ key });
      return value ?? null;
    },
    async setItem(key, value) {
      await (await loadPreferences()).set({ key, value });
    },
    async removeItem(key) {
      await (await loadPreferences()).remove({ key });
    },
  };
}

function createWebStorage(): AuthSessionStorage {
  return {
    async getItem(key) {
      return getWindowStorage('localStorage')?.getItem(key) ?? null;
    },
    async setItem(key, value) {
      getWindowStorage('localStorage')?.setItem(key, value);
    },
    async removeItem(key) {
      getWindowStorage('localStorage')?.removeItem(key);
    },
  };
}

/**
 * Copies every `sessionStorage` entry that belongs to this Supabase session
 * (the token and its `-user` / `-code-verifier` companions) into `target`,
 * unless `target` already holds a value, then removes the old copy.
 */
async function migrateFromSessionStorage(
  target: AuthSessionStorage,
  storageKey: string,
): Promise<void> {
  const legacy = getWindowStorage('sessionStorage');
  if (!legacy) return;

  const legacyKeys: string[] = [];
  for (let index = 0; index < legacy.length; index += 1) {
    const key = legacy.key(index);
    if (key && key.startsWith(storageKey)) legacyKeys.push(key);
  }

  for (const key of legacyKeys) {
    const value = legacy.getItem(key);
    if (value !== null && (await target.getItem(key)) === null) {
      await target.setItem(key, value);
    }
    legacy.removeItem(key);
  }
}

/**
 * Builds the storage passed to `createClient(..., { auth: { storage } })`.
 * Every call waits for the one-time migration, so Supabase's first read on
 * start-up already sees a session that was moved.
 */
export function createAuthSessionStorage(storageKey: string): AuthSessionStorage {
  const target = isNativeApp() ? createNativeStorage() : createWebStorage();

  let migration: Promise<void> | null = null;
  const ready = (): Promise<void> => {
    if (!migration) {
      migration = migrateFromSessionStorage(target, storageKey).catch((error: unknown) => {
        // A failed move must not block sign-in; the user can sign in again.
        console.error('[FitWizard] Could not move the saved session.', error);
      });
    }
    return migration;
  };

  return {
    async getItem(key) {
      await ready();
      return target.getItem(key);
    },
    async setItem(key, value) {
      await ready();
      await target.setItem(key, value);
    },
    async removeItem(key) {
      await ready();
      await target.removeItem(key);
    },
  };
}
