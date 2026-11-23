import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plan } from '@/types/fitness';

const mocks = vi.hoisted(() => ({
  upsertPlanSupabase: vi.fn(),
  listPlansSupabase: vi.fn(),
  getPlanSupabase: vi.fn(),
  deletePlanSupabase: vi.fn(),
}));

async function loadPlansClient({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  vi.doMock('@/lib/supabase', () => ({
    isSupabaseConfigured: () => supabaseConfigured,
  }));

  vi.doMock('@/lib/plans/supabasePlansRepo', () => ({
    upsertPlanSupabase: mocks.upsertPlanSupabase,
    listPlansSupabase: mocks.listPlansSupabase,
    getPlanSupabase: mocks.getPlanSupabase,
    deletePlanSupabase: mocks.deletePlanSupabase,
  }));

  return import('./plansClient');
}

describe('plansClient (Supabase only)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('is enabled only when Supabase is configured', async () => {
    expect((await loadPlansClient({ supabaseConfigured: true })).isPlansRemoteEnabled()).toBe(true);
    vi.resetModules();
    expect((await loadPlansClient({ supabaseConfigured: false })).isPlansRemoteEnabled()).toBe(false);
  });

  it('saves a plan through Supabase without forwarding the user id', async () => {
    const plan = { id: 'plan-1' } as Plan;
    mocks.upsertPlanSupabase.mockResolvedValue(plan);

    const { savePlanRemote } = await loadPlansClient({ supabaseConfigured: true });

    await expect(savePlanRemote(plan, 'user-1')).resolves.toBe(plan);
    expect(mocks.upsertPlanSupabase).toHaveBeenCalledWith(plan);
  });

  it('lists, reads and deletes plans through Supabase', async () => {
    const plan = { id: 'plan-2' } as Plan;
    mocks.listPlansSupabase.mockResolvedValue([plan]);
    mocks.getPlanSupabase.mockResolvedValue(plan);
    mocks.deletePlanSupabase.mockResolvedValue(undefined);

    const client = await loadPlansClient({ supabaseConfigured: true });

    await expect(client.getPlansRemote('user-2')).resolves.toEqual([plan]);
    expect(mocks.listPlansSupabase).toHaveBeenCalledWith();
    await expect(client.getPlanRemote('plan-2')).resolves.toBe(plan);
    expect(mocks.getPlanSupabase).toHaveBeenCalledWith('plan-2');
    await client.deletePlanRemote('plan-2');
    expect(mocks.deletePlanSupabase).toHaveBeenCalledWith('plan-2');
  });

  it('passes Supabase errors through to the caller', async () => {
    mocks.upsertPlanSupabase.mockRejectedValue(new Error('Supabase not configured'));

    const { savePlanRemote } = await loadPlansClient({ supabaseConfigured: false });

    await expect(savePlanRemote({ id: 'plan-3' } as Plan)).rejects.toThrow('Supabase not configured');
  });
});
