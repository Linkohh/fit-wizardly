import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  return import('./authStore');
}

describe('authStore.initialize', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
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
});
