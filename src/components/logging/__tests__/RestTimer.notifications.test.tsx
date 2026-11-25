import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RestTimer } from '../RestTimer';

interface MockPlanState {
  activeWorkout: { restTimerEndTime: number | null } | null;
  cancelRestTimer: () => void;
  adjustRestTimer: (seconds: number) => void;
}

const mocks = vi.hoisted(() => ({
  ensurePermission: vi.fn(async () => true),
  scheduleRestEnd: vi.fn(async () => undefined),
  cancelRestEnd: vi.fn(async () => undefined),
  t: (_key: string, fallback?: string) => fallback ?? _key,
}));

const { usePlanStore } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { create } = require('zustand') as typeof import('zustand');
  return { usePlanStore: create<MockPlanState>((set) => ({
  activeWorkout: { restTimerEndTime: null },
  cancelRestTimer: () => set({ activeWorkout: { restTimerEndTime: null } }),
  adjustRestTimer: (seconds) =>
    set((state) => ({
      activeWorkout: {
        restTimerEndTime: (state.activeWorkout?.restTimerEndTime ?? Date.now()) + seconds * 1000,
      },
    })),
  })) };
});

vi.mock('@/stores/planStore', () => ({ usePlanStore }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.t }),
}));

vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({ emit: vi.fn(async () => undefined) }),
}));

vi.mock('@/hooks/useLocalNotifications', () => {
  const api = { scheduleRestEnd: mocks.scheduleRestEnd, cancelRestEnd: mocks.cancelRestEnd };
  return {
    ensureNotificationPermissionOnce: mocks.ensurePermission,
    useLocalNotifications: () => api,
  };
});

describe('RestTimer notifications', () => {
  beforeEach(() => {
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: null } });
    mocks.ensurePermission.mockReset();
    mocks.ensurePermission.mockResolvedValue(true);
    mocks.scheduleRestEnd.mockClear();
    mocks.cancelRestEnd.mockClear();
  });

  it('asks for permission and schedules the notification when a rest starts', async () => {
    render(<RestTimer />);
    const end = Date.now() + 90_000;
    act(() => usePlanStore.setState({ activeWorkout: { restTimerEndTime: end } }));

    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalledTimes(1));
    expect(mocks.ensurePermission).toHaveBeenCalled();
    expect(mocks.scheduleRestEnd).toHaveBeenCalledWith(new Date(end), 'Rest over. Time for your next set.');
  });

  it('reschedules when the rest is adjusted', async () => {
    const end = Date.now() + 90_000;
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: end } });
    render(<RestTimer />);
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalledTimes(1));

    act(() => usePlanStore.getState().adjustRestTimer(30));
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalledTimes(2));
    expect(mocks.scheduleRestEnd).toHaveBeenLastCalledWith(new Date(end + 30_000), expect.any(String));
  });

  it('cancels the notification when the rest is skipped', async () => {
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: Date.now() + 90_000 } });
    render(<RestTimer />);
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalledTimes(1));
    mocks.cancelRestEnd.mockClear();

    act(() => usePlanStore.getState().cancelRestTimer());
    await waitFor(() => expect(mocks.cancelRestEnd).toHaveBeenCalled());
  });

  it('does not schedule when permission was declined', async () => {
    mocks.ensurePermission.mockResolvedValue(false);
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: Date.now() + 90_000 } });
    render(<RestTimer />);
    await waitFor(() => expect(mocks.ensurePermission).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mocks.scheduleRestEnd).not.toHaveBeenCalled();
  });

  it('cancels on unmount only when the rest is over', async () => {
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: Date.now() + 90_000 } });
    const first = render(<RestTimer />);
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalled());
    mocks.cancelRestEnd.mockClear();
    first.unmount();
    expect(mocks.cancelRestEnd).not.toHaveBeenCalled();

    const second = render(<RestTimer />);
    usePlanStore.setState({ activeWorkout: null });
    second.unmount();
    expect(mocks.cancelRestEnd).toHaveBeenCalled();
  });
});
