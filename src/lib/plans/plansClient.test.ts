import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plan } from '@/types/fitness';

const mocks = vi.hoisted(() => ({
  savePlanApi: vi.fn(),
  getPlansApi: vi.fn(),
  getPlanApi: vi.fn(),
  deletePlanApi: vi.fn(),
  isApiEnabled: vi.fn(),
  upsertPlanSupabase: vi.fn(),
  listPlansSupabase: vi.fn(),
  getPlanSupabase: vi.fn(),
  deletePlanSupabase: vi.fn(),
}));

async function loadPlansClient({
  provider,
  supabaseConfigured,
  apiEnabled = true,
}: {
  provider?: string;
  supabaseConfigured: boolean;
  apiEnabled?: boolean;
}) {
  if (provider) {
    vi.stubEnv('VITE_PLANS_PROVIDER', provider);
  } else {
    vi.unstubAllEnvs();
  }

  vi.doMock('@/lib/supabase', () => ({
    isSupabaseConfigured: () => supabaseConfigured,
  }));

  mocks.isApiEnabled.mockReturnValue(apiEnabled);

  vi.doMock('@/lib/apiClient', () => ({
    savePlan: mocks.savePlanApi,
    getPlans: mocks.getPlansApi,
    getPlan: mocks.getPlanApi,
    deletePlanApi: mocks.deletePlanApi,
    isApiEnabled: mocks.isApiEnabled,
  }));

  vi.doMock('@/lib/plans/supabasePlansRepo', () => ({
    upsertPlanSupabase: mocks.upsertPlanSupabase,
    listPlansSupabase: mocks.listPlansSupabase,
    getPlanSupabase: mocks.getPlanSupabase,
    deletePlanSupabase: mocks.deletePlanSupabase,
  }));

  return import('./plansClient');
}

describe('plansClient provider selection', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('prefers direct Supabase in auto mode when Supabase is configured', async () => {
    const plan = { id: 'plan-1' } as Plan;
    mocks.upsertPlanSupabase.mockResolvedValue(plan);

    const { savePlanRemote } = await loadPlansClient({
      supabaseConfigured: true,
    });

    await savePlanRemote(plan, 'user-1');

    expect(mocks.upsertPlanSupabase).toHaveBeenCalledWith(plan);
    expect(mocks.savePlanApi).not.toHaveBeenCalled();
  });

  it('falls back to the API client in auto mode when Supabase is unavailable', async () => {
    const plan = { id: 'plan-2' } as Plan;
    mocks.savePlanApi.mockResolvedValue(plan);

    const { savePlanRemote } = await loadPlansClient({
      supabaseConfigured: false,
      apiEnabled: true,
    });

    await savePlanRemote(plan, 'user-2');

    expect(mocks.savePlanApi).toHaveBeenCalledWith(plan, 'user-2');
    expect(mocks.upsertPlanSupabase).not.toHaveBeenCalled();
  });
});
