import { createClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthSessionStorage, getAuthStorageKey } from './authSessionStorage';

const mocks = vi.hoisted(() => {
  const preferences = new Map<string, string>();
  return {
    nativeApp: false,
    preferences,
    Preferences: {
      get: vi.fn(async ({ key }: { key: string }) => ({ value: preferences.get(key) ?? null })),
      set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
        preferences.set(key, value);
      }),
      remove: vi.fn(async ({ key }: { key: string }) => {
        preferences.delete(key);
      }),
    },
  };
});

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => mocks.nativeApp,
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: mocks.Preferences,
}));

const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const KEY = getAuthStorageKey(SUPABASE_URL);

function fakeSession(userId = 'user-restored') {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'lifter@example.com',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

beforeEach(() => {
  mocks.nativeApp = false;
  mocks.preferences.clear();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAuthStorageKey', () => {
  it('matches the key Supabase uses by default', () => {
    expect(getAuthStorageKey(SUPABASE_URL)).toBe('sb-abcdefgh-auth-token');
  });

  it('falls back to a placeholder for an invalid URL', () => {
    expect(getAuthStorageKey('not a url')).toBe('sb-placeholder-auth-token');
  });
});

describe('createAuthSessionStorage on the web', () => {
  it('reads and writes localStorage, never sessionStorage', async () => {
    const storage = createAuthSessionStorage(KEY);

    await storage.setItem(KEY, 'token');
    expect(window.localStorage.getItem(KEY)).toBe('token');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    await expect(storage.getItem(KEY)).resolves.toBe('token');

    await storage.removeItem(KEY);
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(mocks.Preferences.set).not.toHaveBeenCalled();
  });
});

describe('createAuthSessionStorage on native', () => {
  it('uses @capacitor/preferences instead of WebView storage', async () => {
    mocks.nativeApp = true;
    const storage = createAuthSessionStorage(KEY);

    await storage.setItem(KEY, 'token');
    expect(mocks.Preferences.set).toHaveBeenCalledWith({ key: KEY, value: 'token' });
    expect(window.localStorage.getItem(KEY)).toBeNull();

    await expect(storage.getItem(KEY)).resolves.toBe('token');
    expect(mocks.Preferences.get).toHaveBeenCalledWith({ key: KEY });

    await storage.removeItem(KEY);
    expect(mocks.Preferences.remove).toHaveBeenCalledWith({ key: KEY });
    await expect(storage.getItem(KEY)).resolves.toBeNull();
  });
});

describe('one-time move from sessionStorage', () => {
  it('moves the old session and its companions on first use, then removes them', async () => {
    window.sessionStorage.setItem(KEY, 'old-session');
    window.sessionStorage.setItem(`${KEY}-user`, 'old-user');
    window.sessionStorage.setItem('pendingInviteCode', 'keep-me');

    const storage = createAuthSessionStorage(KEY);
    await expect(storage.getItem(KEY)).resolves.toBe('old-session');

    expect(window.localStorage.getItem(KEY)).toBe('old-session');
    expect(window.localStorage.getItem(`${KEY}-user`)).toBe('old-user');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    expect(window.sessionStorage.getItem(`${KEY}-user`)).toBeNull();
    // Unrelated keys are left alone.
    expect(window.sessionStorage.getItem('pendingInviteCode')).toBe('keep-me');
  });

  it('runs once: a later sessionStorage value is not copied again', async () => {
    window.sessionStorage.setItem(KEY, 'old-session');
    const storage = createAuthSessionStorage(KEY);
    await storage.getItem(KEY);

    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    window.sessionStorage.setItem(KEY, 'written-later');
    setItem.mockClear();

    await expect(storage.getItem(KEY)).resolves.toBe('old-session');
    await storage.removeItem(KEY);
    expect(setItem).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(KEY)).toBe('written-later');
  });

  it('does not overwrite a session that already exists in the new storage', async () => {
    window.localStorage.setItem(KEY, 'current-session');
    window.sessionStorage.setItem(KEY, 'old-session');

    const storage = createAuthSessionStorage(KEY);
    await expect(storage.getItem(KEY)).resolves.toBe('current-session');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('moves the old session into Preferences on native', async () => {
    mocks.nativeApp = true;
    window.sessionStorage.setItem(KEY, 'old-session');

    const storage = createAuthSessionStorage(KEY);
    await expect(storage.getItem(KEY)).resolves.toBe('old-session');
    expect(mocks.Preferences.set).toHaveBeenCalledWith({ key: KEY, value: 'old-session' });
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });
});

describe('with a real Supabase client', () => {
  function makeClient(fetchImpl: typeof fetch) {
    return createClient(SUPABASE_URL, 'anon-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: KEY,
        storage: createAuthSessionStorage(KEY),
      },
      global: { fetch: fetchImpl },
    });
  }

  it('restores a session saved before a restart', async () => {
    window.localStorage.setItem(KEY, JSON.stringify(fakeSession()));
    const fetchImpl = vi.fn<typeof fetch>();

    const { data, error } = await makeClient(fetchImpl).auth.getSession();

    expect(error).toBeNull();
    expect(data.session?.user.id).toBe('user-restored');
  });

  it('restores a session that an older version left in sessionStorage', async () => {
    window.sessionStorage.setItem(KEY, JSON.stringify(fakeSession('user-migrated')));
    const fetchImpl = vi.fn<typeof fetch>();

    const { data } = await makeClient(fetchImpl).auth.getSession();

    expect(data.session?.user.id).toBe('user-migrated');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    expect(window.localStorage.getItem(KEY)).not.toBeNull();
  });

  it('signOut removes the session from the new storage', async () => {
    window.localStorage.setItem(KEY, JSON.stringify(fakeSession()));
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    const client = makeClient(fetchImpl);
    await client.auth.getSession();

    const { error } = await client.auth.signOut();

    expect(error).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(window.localStorage.getItem(`${KEY}-user`)).toBeNull();
    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('signOut removes the session from Preferences on native', async () => {
    mocks.nativeApp = true;
    mocks.preferences.set(KEY, JSON.stringify(fakeSession()));
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    const client = makeClient(fetchImpl);
    await client.auth.getSession();

    await client.auth.signOut();

    expect(mocks.preferences.has(KEY)).toBe(false);
  });
});
