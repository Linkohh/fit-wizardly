import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plan } from '@/types/fitness';

const mocks = vi.hoisted(() => ({
  currentUser: { id: 'user-1' } as { id: string } | null,
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
  } as unknown as Plan;
}

describe('planStore syncWithBackend', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    window.localStorage.clear();
    mocks.currentUser = { id: 'user-1' };
  });

  it('never writes plans or workout data to localStorage', async () => {
    // Since ADR 11 (2026-11) user data is saved to device storage (IndexedDB /
    // app files), not localStorage. Round-trip tests: planStore.persistence.test.ts.
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
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(window.localStorage.getItem('fitwizard-plans')).toBeNull();
  });
});
