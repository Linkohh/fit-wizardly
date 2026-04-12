import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@/types/supabase';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  from: vi.fn(),
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

async function loadAuthStore({ configured = true }: { configured?: boolean } = {}) {
  const profileQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    single: vi.fn(),
  };

  profileQuery.select.mockReturnValue(profileQuery);
  profileQuery.eq.mockReturnValue(profileQuery);
  profileQuery.update.mockReturnValue(profileQuery);
  profileQuery.insert.mockReturnValue(profileQuery);
  profileQuery.single.mockResolvedValue({ data: null, error: null });
  profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

  mocks.from.mockReturnValue(profileQuery);

  vi.doMock('@/lib/supabase', () => ({
    isSupabaseConfigured: () => configured,
    supabase: {
      auth: {
        getSession: mocks.getSession,
        onAuthStateChange: mocks.onAuthStateChange,
        signInWithOtp: mocks.signInWithOtp,
        signOut: mocks.signOut,
      },
      from: mocks.from,
    },
  }));

  const store = await import('./authStore');
  return { ...store, profileQuery };
}

describe('authStore.initialize', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('marks auth as unavailable when Supabase is not configured', async () => {
    const { useAuthStore } = await loadAuthStore({ configured: false });

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isConfigured).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('unsubscribes the previous auth listener before registering a new one', async () => {
    const unsubscribeFirst = vi.fn();
    const unsubscribeSecond = vi.fn();

    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.onAuthStateChange
      .mockReturnValueOnce({ data: { subscription: { unsubscribe: unsubscribeFirst } } })
      .mockReturnValueOnce({ data: { subscription: { unsubscribe: unsubscribeSecond } } });

    const { useAuthStore } = await loadAuthStore();

    await useAuthStore.getState().initialize();
    await useAuthStore.getState().initialize();

    expect(unsubscribeFirst).toHaveBeenCalledTimes(1);
    expect(unsubscribeSecond).not.toHaveBeenCalled();
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(2);
  });

  it('sets session and marks loading false when an existing session is found', async () => {
    const fakeSession = {
      access_token: 'token-abc',
      user: { id: 'user-1', email: 'user@example.com' },
    };

    mocks.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { useAuthStore } = await loadAuthStore();

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isConfigured).toBe(true);
    expect(state.session).toEqual(fakeSession);
    expect(state.user).toEqual(fakeSession.user);
  });

  it('marks trainer authorization from the fetched profile', async () => {
    const fakeSession = {
      access_token: 'token-abc',
      user: { id: 'user-1', email: 'coach@example.com' },
    };
    const fakeProfile: Profile = {
      id: 'user-1',
      display_name: 'Coach Alex',
      username: 'coach-alex',
      avatar_url: null,
      experience_level: null,
      primary_goal: null,
      timezone: 'America/New_York',
      created_at: null,
      role: 'trainer',
      is_trainer: true,
    };

    mocks.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { useAuthStore, profileQuery } = await loadAuthStore();
    profileQuery.maybeSingle.mockResolvedValue({ data: fakeProfile, error: null });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.profile).toEqual(fakeProfile);
    expect(state.profile?.is_trainer).toBe(true);
  });

  it('creates new trainer profiles without deriving display names from email prefixes', async () => {
    const fakeSession = {
      access_token: 'token-abc',
      user: {
        id: 'user-1',
        email: 'coach@example.com',
        user_metadata: { full_name: 'Coach Alex' },
      },
    };
    let authStateChangeHandler:
      | ((event: string, session: typeof fakeSession | null) => Promise<void> | void)
      | null = null;

    mocks.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mocks.onAuthStateChange.mockImplementation(
      (handler: (event: string, session: typeof fakeSession | null) => Promise<void> | void) => {
        authStateChangeHandler = handler;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }
    );

    const { useAuthStore, profileQuery } = await loadAuthStore();
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    profileQuery.select.mockReturnValue(profileQuery);
    profileQuery.insert.mockReturnValue(profileQuery);
    profileQuery.single.mockResolvedValue({
      data: {
        id: 'user-1',
        display_name: 'Coach Alex',
        username: null,
        avatar_url: null,
        experience_level: null,
        primary_goal: null,
        timezone: null,
        created_at: null,
        role: 'client',
        is_trainer: false,
      },
      error: null,
    });

    await useAuthStore.getState().initialize();
    await authStateChangeHandler?.('SIGNED_IN', fakeSession);

    expect(profileQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        display_name: 'Coach Alex',
        role: 'client',
        is_trainer: false,
      })
    );
  });

  it('creates a generic profile display name when metadata is absent', async () => {
    const fakeSession = {
      access_token: 'token-abc',
      user: {
        id: 'user-1',
        email: 'coach@example.com',
        user_metadata: {},
      },
    };
    let authStateChangeHandler:
      | ((event: string, session: typeof fakeSession | null) => Promise<void> | void)
      | null = null;

    mocks.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mocks.onAuthStateChange.mockImplementation(
      (handler: (event: string, session: typeof fakeSession | null) => Promise<void> | void) => {
        authStateChangeHandler = handler;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }
    );

    const { useAuthStore, profileQuery } = await loadAuthStore();
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    profileQuery.single.mockResolvedValue({
      data: {
        id: 'user-1',
        display_name: 'Member',
        username: null,
        avatar_url: null,
        experience_level: null,
        primary_goal: null,
        timezone: null,
        created_at: null,
        role: 'client',
        is_trainer: false,
      },
      error: null,
    });

    await useAuthStore.getState().initialize();
    await authStateChangeHandler?.('SIGNED_IN', fakeSession);

    const insertPayload = profileQuery.insert.mock.calls[0]?.[0] as Profile | undefined;
    expect(insertPayload).toBeDefined();
    expect(insertPayload?.display_name).toEqual(expect.any(String));
    expect(insertPayload?.display_name?.toLowerCase()).not.toContain('coach');
  });
});

describe('authStore.signInWithEmail', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns an error immediately when Supabase is not configured', async () => {
    const { useAuthStore } = await loadAuthStore({ configured: false });

    const result = await useAuthStore.getState().signInWithEmail('test@example.com');

    expect(result.error).toBeDefined();
    expect(result.error?.message).toMatch(/not configured/i);
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('calls signInWithOtp and returns no error on success', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mocks.signInWithOtp.mockResolvedValue({ error: null });

    const { useAuthStore } = await loadAuthStore();
    await useAuthStore.getState().initialize();

    const result = await useAuthStore.getState().signInWithEmail('user@example.com');

    expect(result.error).toBeNull();
    expect(mocks.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' })
    );
  });
});

describe('authStore.signOut', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('clears session, user, and profile state after sign out', async () => {
    const fakeSession = {
      access_token: 'token-abc',
      user: { id: 'user-1', email: 'user@example.com' },
    };

    mocks.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mocks.signOut.mockResolvedValue({ error: null });

    const { useAuthStore } = await loadAuthStore();
    await useAuthStore.getState().initialize();

    // Pre-condition: session should be set
    expect(useAuthStore.getState().session).toEqual(fakeSession);

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });

  it('clears legacy privacy-sensitive storage on sign out', async () => {
    window.localStorage.setItem('fitwizard-trainer', '1');
    window.localStorage.setItem('fitwizard-plans', '1');
    window.localStorage.setItem('fitwizard-onboarding', '1');
    window.localStorage.setItem('fitwizard-wizard', '1');
    window.localStorage.setItem('fitwizard-nutrition-storage', '1');
    window.localStorage.setItem('measurements-storage', '1');
    window.localStorage.setItem('fitwizard-wisdom', '1');

    const { useAuthStore } = await loadAuthStore({ configured: false });

    await useAuthStore.getState().signOut();

    expect(window.localStorage.getItem('fitwizard-trainer')).toBeNull();
    expect(window.localStorage.getItem('fitwizard-plans')).toBeNull();
    expect(window.localStorage.getItem('fitwizard-onboarding')).toBeNull();
    expect(window.localStorage.getItem('fitwizard-wizard')).toBeNull();
    expect(window.localStorage.getItem('fitwizard-nutrition-storage')).toBeNull();
    expect(window.localStorage.getItem('measurements-storage')).toBeNull();
    expect(window.localStorage.getItem('fitwizard-wisdom')).toBeNull();
  });
});

describe('authStore.updateProfile', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('strips trainer escalation fields before persisting profile updates', async () => {
    const fakeSession = {
      access_token: 'token-abc',
      user: { id: 'user-1', email: 'coach@example.com' },
    };
    const fakeProfile: Profile = {
      id: 'user-1',
      display_name: 'Coach Alex',
      username: 'coach-alex',
      avatar_url: null,
      experience_level: null,
      primary_goal: null,
      timezone: 'America/New_York',
      created_at: null,
      role: 'client',
      is_trainer: false,
    };
    let capturedUpdate: Record<string, unknown> | null = null;

    mocks.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { useAuthStore, profileQuery } = await loadAuthStore();

    profileQuery.maybeSingle.mockResolvedValue({ data: fakeProfile, error: null });
    profileQuery.update.mockImplementation((updates: Record<string, unknown>) => {
      capturedUpdate = updates;
      return profileQuery;
    });
    profileQuery.select.mockReturnValue(profileQuery);
    profileQuery.single.mockResolvedValue({ data: { ...fakeProfile, display_name: 'Updated' }, error: null });

    await useAuthStore.getState().initialize();
    await useAuthStore.getState().updateProfile({
      display_name: 'Updated',
      role: 'trainer',
      is_trainer: true,
    } as Partial<Profile>);

    expect(capturedUpdate).toMatchObject({
      display_name: 'Updated',
    });
    expect(capturedUpdate).not.toHaveProperty('role');
    expect(capturedUpdate).not.toHaveProperty('is_trainer');
  });
});
