import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authUser: { id: 'user-1', email: 'user@example.com' } as { id: string; email?: string } | null,
  circleInsertResult: { data: null, error: null } as { data: unknown; error: Error | null },
  realtimeActivity: null as Record<string, unknown> | null,
  channel: null as unknown,
  from: vi.fn(),
  getUser: vi.fn(),
  isSupabaseConfigured: vi.fn(),
  removeChannel: vi.fn(),
}));

async function loadCircleStore() {
  const activityQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };
  activityQuery.select.mockReturnValue(activityQuery);
  activityQuery.eq.mockReturnValue(activityQuery);
  activityQuery.single.mockResolvedValue({
    data: mocks.realtimeActivity,
    error: null,
  });

  const reactionQuery = {
    delete: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
  };
  reactionQuery.delete.mockReturnValue(reactionQuery);
  reactionQuery.eq.mockReturnValue(reactionQuery);
  reactionQuery.insert.mockResolvedValue(mocks.circleInsertResult);

  const channelHandler = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };
  channelHandler.on.mockReturnThis();
  channelHandler.subscribe.mockReturnValue(channelHandler);

  mocks.from.mockImplementation((table: string) => {
    if (table === 'circle_activities') return activityQuery;
    if (table === 'activity_reactions') return reactionQuery;
    throw new Error(`Unexpected table: ${table}`);
  });

  mocks.channel = channelHandler;

  vi.doMock('@/lib/supabase', () => ({
    isSupabaseConfigured: mocks.isSupabaseConfigured,
    supabase: {
      auth: {
        getUser: mocks.getUser,
      },
      channel: vi.fn(() => channelHandler),
      from: mocks.from,
      removeChannel: mocks.removeChannel,
    },
  }));

  return import('@/stores/circleStore');
}

describe('circleStore optimistic and realtime boundaries', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.authUser = { id: 'user-1', email: 'user@example.com' };
    mocks.realtimeActivity = null;
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getUser.mockResolvedValue({ data: { user: mocks.authUser } });
  });

  it('applies an optimistic reaction immediately and rolls back on insert failure', async () => {
    const { useCircleStore } = await loadCircleStore();
    const initialReaction = {
      id: 'reaction-1',
      activity_id: 'activity-1',
      user_id: 'user-2',
      reaction_type: 'fire',
      created_at: '2026-03-20T00:00:00.000Z',
    };

    useCircleStore.setState({
      reactions: new Map([['activity-1', [initialReaction]]]),
    });

    let resolveInsert: (value: { data: null; error: Error | null }) => void = () => {};
    const insertPromise = new Promise<{ data: null; error: Error | null }>((resolve) => {
      resolveInsert = resolve;
    });
    mocks.circleInsertResult = { data: null, error: null };

    const reactionQuery = {
      delete: vi.fn(),
      eq: vi.fn(),
      insert: vi.fn(),
    };
    reactionQuery.delete.mockReturnValue(reactionQuery);
    reactionQuery.eq.mockReturnValue(reactionQuery);
    reactionQuery.insert.mockReturnValue(insertPromise);
    mocks.from.mockImplementation((table: string) => {
      if (table === 'activity_reactions') return reactionQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    const promise = useCircleStore.getState().addReaction('activity-1', 'clap');

    await Promise.resolve();

    expect(useCircleStore.getState().reactions.get('activity-1')).toHaveLength(2);
    expect(useCircleStore.getState().reactions.get('activity-1')).toEqual(
      expect.arrayContaining([
        initialReaction,
        expect.objectContaining({
          activity_id: 'activity-1',
          user_id: 'user-1',
          reaction_type: 'clap',
        }),
      ])
    );

    resolveInsert({ data: null, error: new Error('insert failed') });
    await promise;

    expect(useCircleStore.getState().reactions.get('activity-1')).toEqual([initialReaction]);
  });

  it('hydrates a realtime activity insert into the top of the activity feed', async () => {
    const realtimeActivity = {
      id: 'activity-99',
      circle_id: 'circle-1',
      user_id: 'user-2',
      activity_type: 'workout_logged',
      created_at: '2026-03-20T12:00:00.000Z',
      payload: { totalVolume: 1250 },
      profile: {
        display_name: 'Bob',
        avatar_url: null,
      },
    };
    mocks.realtimeActivity = realtimeActivity;

    const { useCircleStore } = await loadCircleStore();
    useCircleStore.setState({ activities: [] });

    const unsubscribe = useCircleStore.getState().subscribeToActivities('circle-1');

    const channel = mocks.channel as {
      on: ReturnType<typeof vi.fn>;
      subscribe: ReturnType<typeof vi.fn>;
    };
    const [, , handler] = channel.on.mock.calls[0] as [
      string,
      Record<string, unknown>,
      (payload: { new: { id: string } }) => Promise<void>
    ];

    await handler({ new: { id: realtimeActivity.id } });

    expect(mocks.from).toHaveBeenCalledWith('circle_activities');
    expect(useCircleStore.getState().activities[0]).toEqual(realtimeActivity);

    unsubscribe();
    expect(mocks.removeChannel).toHaveBeenCalledWith(channel);
  });
});
