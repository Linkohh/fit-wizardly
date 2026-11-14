import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authUser: { id: 'user-1' } as { id: string } | null,
  from: vi.fn(),
  isSupabaseConfigured: vi.fn(),
  upsertResult: { error: null } as { error: Error | null },
}));

async function loadPreferencesModule({
  singleResponse,
}: {
  singleResponse?: { data: unknown; error: { code?: string } | null };
} = {}) {
  const preferencesQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    upsert: vi.fn(),
  };
  preferencesQuery.select.mockReturnValue(preferencesQuery);
  preferencesQuery.eq.mockReturnValue(preferencesQuery);
  preferencesQuery.single.mockResolvedValue(
    singleResponse ?? {
      data: null,
      error: { code: 'PGRST116' },
    }
  );
  preferencesQuery.upsert.mockResolvedValue(mocks.upsertResult);

  mocks.from.mockReturnValue(preferencesQuery);

  const useAuthStoreMock = Object.assign(
    () => ({
      user: mocks.authUser,
    }),
    {
      getState: () => ({
        user: mocks.authUser,
      }),
    }
  );

  vi.doMock('@/lib/supabase', () => ({
    isSupabaseConfigured: mocks.isSupabaseConfigured,
    supabase: {
      from: mocks.from,
    },
  }));

  vi.doMock('@/stores/authStore', () => ({
    useAuthStore: useAuthStoreMock,
  }));

  return import('@/hooks/useUserPreferences');
}

describe('useUserPreferences store behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.authUser = { id: 'user-1' };
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.upsertResult = { error: null };
  });

  it('normalizes legacy cloud settings and queues the migrated settings for persistence', async () => {
    const cloudSettings = {
      haptics: false,
      sounds: false,
      soundsExplicitlySet: false,
    };

    const { usePreferencesStore } = await loadPreferencesModule({
      singleResponse: {
        data: {
          favorites: ['ex-1'],
          collections: {},
          filter_presets: {},
          settings: cloudSettings,
          recently_viewed: ['ex-2'],
          updated_at: '2026-03-20T00:00:00.000Z',
        },
        error: null,
      },
    });

    await usePreferencesStore.getState().loadFromCloud();

    expect(usePreferencesStore.getState().settings).toEqual({
      haptics: false,
      sounds: true,
      soundsExplicitlySet: true,
      reducedMotion: false,
      motionTilt: true,
    });
    expect(usePreferencesStore.getState().lastSyncedAt).toBe('2026-03-20T00:00:00.000Z');
    expect(usePreferencesStore.getState().offlineQueue).toHaveLength(1);
    expect(usePreferencesStore.getState().offlineQueue[0]).toEqual(
      expect.objectContaining({
        type: 'settings',
        payload: {
          haptics: false,
          sounds: true,
          soundsExplicitlySet: true,
          reducedMotion: false,
          motionTilt: true,
        },
      })
    );
  });

  it('keeps a change that is queued while a sync is in flight', async () => {
    const { usePreferencesStore } = await loadPreferencesModule();
    usePreferencesStore.setState({ favorites: [], offlineQueue: [] });

    let finishUpsert: (value: { error: null }) => void = () => {};
    const preferencesQuery = mocks.from() as { upsert: ReturnType<typeof vi.fn> };
    preferencesQuery.upsert.mockReturnValueOnce(
      new Promise((resolve) => {
        finishUpsert = resolve;
      })
    );

    usePreferencesStore.getState().addFavorite('ex-1');
    const sync = usePreferencesStore.getState().syncToCloud();
    usePreferencesStore.getState().addFavorite('ex-2');
    finishUpsert({ error: null });
    await sync;

    const queue = usePreferencesStore.getState().offlineQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0]).toEqual(expect.objectContaining({ type: 'favorite', payload: 'ex-2' }));
  });

  it('keeps the whole queue when the sync fails', async () => {
    const { usePreferencesStore } = await loadPreferencesModule();
    usePreferencesStore.setState({ favorites: [], offlineQueue: [] });
    const preferencesQuery = mocks.from() as { upsert: ReturnType<typeof vi.fn> };
    preferencesQuery.upsert.mockResolvedValueOnce({ error: new Error('offline') });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    usePreferencesStore.getState().addFavorite('ex-1');
    await usePreferencesStore.getState().syncToCloud();

    expect(usePreferencesStore.getState().offlineQueue).toHaveLength(1);
    consoleError.mockRestore();
  });

  it('queues local settings updates and flushes them through cloud sync', async () => {
    const { usePreferencesStore } = await loadPreferencesModule();

    usePreferencesStore.setState({
      favorites: ['ex-1'],
      collections: {
        'collection-1': {
          id: 'collection-1',
          name: 'Strength',
          color: '#111111',
          exerciseIds: ['ex-1'],
          createdAt: '2026-03-20T00:00:00.000Z',
        },
      },
      filterPresets: {
        goal: 'strength',
      },
      settings: {
        haptics: true,
        sounds: true,
        soundsExplicitlySet: true,
        reducedMotion: true,
        motionTilt: false,
      },
      recentlyViewed: ['ex-2'],
      offlineQueue: [],
    });

    usePreferencesStore.getState().updateSettings({
      reducedMotion: false,
      motionTilt: true,
    });

    expect(usePreferencesStore.getState().offlineQueue).toHaveLength(1);

    await usePreferencesStore.getState().processOfflineQueue();

    expect(mocks.from).toHaveBeenCalledWith('user_exercise_preferences');
    expect(usePreferencesStore.getState().offlineQueue).toEqual([]);
    expect(usePreferencesStore.getState().lastSyncedAt).toEqual(expect.any(String));
    const preferencesQuery = mocks.from.mock.results[0]?.value as {
      upsert: ReturnType<typeof vi.fn>;
    };

    expect(preferencesQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        favorites: ['ex-1'],
        collections: {
          'collection-1': {
            id: 'collection-1',
            name: 'Strength',
            color: '#111111',
            exerciseIds: ['ex-1'],
            createdAt: '2026-03-20T00:00:00.000Z',
          },
        },
        filter_presets: {
          goal: 'strength',
        },
        settings: {
          haptics: true,
          sounds: true,
          soundsExplicitlySet: true,
          reducedMotion: false,
          motionTilt: true,
        },
        recently_viewed: ['ex-2'],
      })
    );
  });
});
