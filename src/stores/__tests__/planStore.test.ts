import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plan } from '@/types/fitness';

const mocks = vi.hoisted(() => ({
  currentUser: { id: 'user-1' } as { id: string } | null,
  deletePlanRemote: vi.fn(),
  getPlansRemote: vi.fn(),
  isPlansRemoteEnabled: vi.fn(),
  savePlanRemote: vi.fn(),
  toastError: vi.fn(),
  analyzePerformance: vi.fn(),
  generateWeeklySummary: vi.fn(),
  detectPersonalRecords: vi.fn(),
  calculateTotalVolume: vi.fn(),
  postWorkoutToCircles: vi.fn(),
  postPRToCircles: vi.fn(),
}));

async function loadPlanStore() {
  vi.doMock('sonner', () => ({
    toast: {
      error: mocks.toastError,
    },
  }));

  vi.doMock('@/stores/authStore', () => ({
    useAuthStore: {
      getState: () => ({
        user: mocks.currentUser,
      }),
    },
  }));

  vi.doMock('@/lib/plans/plansClient', () => ({
    deletePlanRemote: mocks.deletePlanRemote,
    getPlansRemote: mocks.getPlansRemote,
    isPlansRemoteEnabled: mocks.isPlansRemoteEnabled,
    savePlanRemote: mocks.savePlanRemote,
  }));

  vi.doMock('@/lib/progressionEngine', () => ({
    analyzePerformance: mocks.analyzePerformance,
    generateWeeklySummary: mocks.generateWeeklySummary,
    detectPersonalRecords: mocks.detectPersonalRecords,
    calculateTotalVolume: mocks.calculateTotalVolume,
  }));

  vi.doMock('@/lib/circleActivity', () => ({
    postWorkoutToCircles: mocks.postWorkoutToCircles,
    postPRToCircles: mocks.postPRToCircles,
  }));

  return import('@/stores/planStore');
}

function buildPlan(id: string, label: string): Plan {
  return {
    id,
    splitType: 'upper-lower',
    selections: {
      daysPerWeek: 4,
      sessionDuration: 60,
      equipment: ['dumbbells'],
      optPhase: 'hypertrophy',
    },
    rirProgression: [],
    workoutDays: [
      {
        dayIndex: 0,
        name: label,
        exercises: [],
      },
    ],
  } as Plan;
}

describe('planStore syncWithBackend', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    window.localStorage.clear();
    mocks.currentUser = { id: 'user-1' };
    mocks.isPlansRemoteEnabled.mockReturnValue(true);
  });

  it('prefers remote plans in merged history and restores currentPlan to the remote copy', async () => {
    const remotePlan = buildPlan('plan-1', 'Remote plan');
    const localPlan = buildPlan('plan-1', 'Local plan');
    const localOnlyPlan = buildPlan('plan-2', 'Local-only plan');
    mocks.getPlansRemote.mockResolvedValue([remotePlan]);

    const { usePlanStore } = await loadPlanStore();
    usePlanStore.setState({
      currentPlan: localPlan,
      planHistory: [localPlan, localOnlyPlan],
      workoutLogs: [],
      currentWeek: 1,
      activeWorkout: null,
      personalRecords: [],
      preferredWeightUnit: 'lbs',
    });

    await usePlanStore.getState().syncWithBackend('user-1');

    const state = usePlanStore.getState();
    expect(state.planHistory).toEqual([remotePlan, localOnlyPlan]);
    expect(state.currentPlan).toEqual(remotePlan);
    expect(mocks.savePlanRemote).toHaveBeenCalledTimes(1);
    expect(mocks.savePlanRemote).toHaveBeenCalledWith(localOnlyPlan, 'user-1');
  });

  it('restores currentPlan from the first merged plan when no current plan is selected', async () => {
    const remotePlan = buildPlan('plan-3', 'Remote plan');
    const localPlan = buildPlan('plan-4', 'Local-only plan');
    mocks.getPlansRemote.mockResolvedValue([remotePlan]);

    const { usePlanStore } = await loadPlanStore();
    usePlanStore.setState({
      currentPlan: null,
      planHistory: [localPlan],
      workoutLogs: [],
      currentWeek: 1,
      activeWorkout: null,
      personalRecords: [],
      preferredWeightUnit: 'lbs',
    });

    await usePlanStore.getState().syncWithBackend('user-1');

    const state = usePlanStore.getState();
    expect(state.planHistory).toEqual([remotePlan, localPlan]);
    expect(state.currentPlan).toEqual(remotePlan);
  });

  it('persists only non-sensitive preference fields', async () => {
    const { usePlanStore } = await loadPlanStore();
    const sensitivePlan = buildPlan('plan-5', 'Sensitive plan');

    usePlanStore.setState({
      currentPlan: sensitivePlan,
      planHistory: [sensitivePlan],
      workoutLogs: [{ planId: 'plan-5' } as never],
      currentWeek: 3,
      activeWorkout: { planId: 'plan-5' } as never,
      personalRecords: [{ exerciseId: 'exercise-1' } as never],
      preferredWeightUnit: 'kg',
    });

    const persisted = JSON.parse(window.localStorage.getItem('fitwizard-plans') ?? '{"state":{}}');

    expect(persisted.state.currentWeek).toBe(3);
    expect(persisted.state.preferredWeightUnit).toBe('kg');
    expect(persisted.state.currentPlan).toBeUndefined();
    expect(persisted.state.planHistory).toBeUndefined();
    expect(persisted.state.workoutLogs).toBeUndefined();
    expect(persisted.state.activeWorkout).toBeUndefined();
    expect(persisted.state.personalRecords).toBeUndefined();
  });
});
