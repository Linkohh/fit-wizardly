/**
 * Where the Supabase session lives (ADR 12).
 *
 * - Native (Capacitor): `@capacitor/preferences` (UserDefaults on iOS,
 *   SharedPreferences on Android). The WebView's own storage can be cleared by
 *   the OS, so the session is kept outside it. The plugin is loaded lazily.
 * - Web: `window.localStorage`, the Supabase default, so a closed tab or a
 *   browser restart no longer signs people out. If localStorage can't be used
 *   (site data blocked), the session stays in `sessionStorage` for the tab, or
 *   in memory for the page, rather than being lost.
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

function createNativeStorage(): TargetStorage {
  return {
    async isSavedDurably(key) {
      return (await this.getItem(key)) !== null;
    },
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

/** Returns the storage only if it can actually be written (it can throw when site data is blocked). */
function getWritableStorage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  const storage = getWindowStorage(kind);
  if (!storage) return null;
  try {
    const probeKey = '__fitwizard_auth_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}

/** Internal: also says whether a key is saved somewhere that outlives the page. */
interface TargetStorage extends AuthSessionStorage {
  isSavedDurably(key: string): Promise<boolean>;
}

interface WebStorageChoice {
  storage: TargetStorage;
  /** True when localStorage is unusable and the session stays in sessionStorage. */
  usesLegacyStore: boolean;
}

/**
 * localStorage when it works. If it doesn't (site data blocked, private modes
 * that throw), sessionStorage, which still keeps the user signed in for this
 * tab. Any write that still fails goes to memory, so the session lasts at least
 * for the current page instead of being lost.
 */
function createWebStorage(): WebStorageChoice {
  const local = getWritableStorage('localStorage');
  const backend = local ?? getWritableStorage('sessionStorage');
  const memory = new Map<string, string>();

  return {
    usesLegacyStore: !local && backend !== null,
    storage: {
      async isSavedDurably(key) {
        if (memory.has(key)) return false;
        try {
          return (backend?.getItem(key) ?? null) !== null;
        } catch {
          return false;
        }
      },
      async getItem(key) {
        if (memory.has(key)) return memory.get(key) ?? null;
        try {
          return backend?.getItem(key) ?? null;
        } catch {
          return null;
        }
      },
      async setItem(key, value) {
        try {
          if (!backend) throw new Error('No writable web storage');
          backend.setItem(key, value);
          memory.delete(key);
        } catch {
          memory.set(key, value);
        }
      },
      async removeItem(key) {
        memory.delete(key);
        try {
          backend?.removeItem(key);
        } catch {
          // Nothing stored there to remove.
        }
      },
    },
  };
}

/**
 * Copies every `sessionStorage` entry that belongs to this Supabase session
 * (the token and its `-user` / `-code-verifier` companions) into `target`,
 * unless `target` already holds a value. The old copy is removed only once
 * `target` reads it back from durable storage (not the in-memory fallback),
 * so a failed write never loses the session.
 */
async function migrateFromSessionStorage(
  target: TargetStorage,
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
    if (value === null) continue;
    if ((await target.getItem(key)) === null) {
      await target.setItem(key, value);
    }
    if (await target.isSavedDurably(key)) {
      legacy.removeItem(key);
    }
  }
}

/**
 * Builds the storage passed to `createClient(..., { auth: { storage } })`.
 * Every call waits for the one-time migration, so Supabase's first read on
 * start-up already sees a session that was moved.
 */
export function createAuthSessionStorage(storageKey: string): AuthSessionStorage {
  let target: TargetStorage;
  let skipMigration = false;
  if (isNativeApp()) {
    target = createNativeStorage();
  } else {
    const web = createWebStorage();
    target = web.storage;
    // Already in sessionStorage: there is nothing to move.
    skipMigration = web.usesLegacyStore;
  }

  let migration: Promise<void> | null = null;
  const ready = (): Promise<void> => {
    if (!migration) {
      migration = (skipMigration
        ? Promise.resolve()
        : migrateFromSessionStorage(target, storageKey)
      ).catch((error: unknown) => {
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
