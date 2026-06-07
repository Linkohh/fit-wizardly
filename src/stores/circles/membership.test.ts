import { describe, expect, it, vi } from 'vitest';
import { createMembershipActions, getMemberDisplayName } from './membership';

describe('getMemberDisplayName', () => {
  it('prefers explicit profile metadata over email local-parts', () => {
    expect(
      getMemberDisplayName({
        email: 'trainer@example.com',
        user_metadata: { display_name: 'Coach Ada' },
      } as never),
    ).toBe('Coach Ada');
  });

  it('falls back to a generic label when no public name exists', () => {
    expect(
      getMemberDisplayName({
        email: 'trainer@example.com',
        user_metadata: {},
      } as never),
    ).toBe('A new member');
  });
});

describe('joinCircle', () => {
  it('joins by invite through the hardened RPC while preserving member activity', async () => {
    const postActivity = vi.fn().mockResolvedValue(undefined);
    const fetchUserCircles = vi.fn().mockResolvedValue(undefined);
    const rpc = vi.fn().mockResolvedValue({
      data: [{ circle_id: 'circle-1', circle_name: 'Strength Crew' }],
      error: null,
    });
    const getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          user_metadata: { display_name: 'Ada' },
        },
      },
    });

    const actions = createMembershipActions({
      set: vi.fn(),
      get: () => ({
        postActivity,
        fetchUserCircles,
      }),
      isSupabaseConfigured: () => true,
      supabase: {
        auth: { getUser },
        rpc,
      },
    } as never);

    const result = await actions.joinCircle('ab12cd34');

    expect(result.error).toBeNull();
    expect(rpc).toHaveBeenCalledWith('join_circle_by_invite', {
      p_invite_code: 'AB12CD34',
    });
    expect(postActivity).toHaveBeenCalledWith('circle-1', 'member_joined', {
      memberName: 'Ada',
    });
    expect(fetchUserCircles).toHaveBeenCalledWith('user-1');
  });
});
