import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stopRestNotificationSyncForTests } from '@/hooks/restNotificationSync';
import { RestTimer } from '../RestTimer';

interface MockPlanState {
  activeWorkout: { restTimerEndTime: number | null } | null;
  cancelRestTimer: () => void;
  adjustRestTimer: (seconds: number) => void;
}

const mocks = vi.hoisted(() => ({
  native: true,
  ensurePermission: vi.fn(async () => true),
  scheduleRestEnd: vi.fn(async () => undefined),
  cancelRestEnd: vi.fn(async () => undefined),
  t: (_key: string, fallback?: string) => fallback ?? _key,
}));

const { usePlanStore } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { create } = require('zustand') as typeof import('zustand');
  return {
    usePlanStore: create<MockPlanState>((set) => ({
      activeWorkout: { restTimerEndTime: null },
      cancelRestTimer: () => set({ activeWorkout: { restTimerEndTime: null } }),
      adjustRestTimer: (seconds) =>
        set((state) => ({
          activeWorkout: {
            restTimerEndTime: (state.activeWorkout?.restTimerEndTime ?? Date.now()) + seconds * 1000,
          },
        })),
    })),
  };
});

vi.mock('@/stores/planStore', () => ({ usePlanStore }));
vi.mock('@/lib/platform', () => ({ isNativeApp: () => mocks.native }));
vi.mock('@/lib/i18n', () => ({ default: { t: mocks.t } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: mocks.t }) }));
vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({ emit: vi.fn(async () => undefined) }),
}));
vi.mock('@/hooks/useLocalNotifications', () => ({
  ensureNotificationPermissionOnce: mocks.ensurePermission,
  scheduleRestEnd: mocks.scheduleRestEnd,
  cancelRestEnd: mocks.cancelRestEnd,
}));

const BODY = 'Rest over. Time for your next set.';

describe('RestTimer notifications', () => {
  beforeEach(() => {
    stopRestNotificationSyncForTests();
    mocks.native = true;
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
    expect(mocks.scheduleRestEnd).toHaveBeenCalledWith(new Date(end), BODY);
  });

  it('reschedules when the rest is adjusted', async () => {
    const end = Date.now() + 90_000;
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: end } });
    render(<RestTimer />);
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalledTimes(1));

    act(() => usePlanStore.getState().adjustRestTimer(30));
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalledTimes(2));
    expect(mocks.scheduleRestEnd).toHaveBeenLastCalledWith(new Date(end + 30_000), BODY);
  });

  it('cancels the notification when the rest is skipped', async () => {
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: Date.now() + 90_000 } });
    render(<RestTimer />);
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalledTimes(1));

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

  it('keeps the notification when RestTimer unmounts mid-rest', async () => {
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: Date.now() + 90_000 } });
    const view = render(<RestTimer />);
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalled());
    view.unmount();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mocks.cancelRestEnd).not.toHaveBeenCalled();
  });

  it('cancels the notification when a workout is discarded after RestTimer unmounted (PR #89 review)', async () => {
    // Mid-rest, the person leaves the logger; later WorkoutLogger shows the
    // "resume or discard" prompt without RestTimer, and they discard.
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: Date.now() + 90_000 } });
    const view = render(<RestTimer />);
    await waitFor(() => expect(mocks.scheduleRestEnd).toHaveBeenCalled());
    view.unmount();
    mocks.cancelRestEnd.mockClear();

    act(() => usePlanStore.setState({ activeWorkout: null }));
    await waitFor(() => expect(mocks.cancelRestEnd).toHaveBeenCalled());
  });

  it('a skip during the first permission prompt wins over the rest it was asked for', async () => {
    let answer: (granted: boolean) => void = () => undefined;
    mocks.ensurePermission.mockImplementation(
      () => new Promise<boolean>((resolve) => {
        answer = resolve;
      }),
    );
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: Date.now() + 90_000 } });
    render(<RestTimer />);
    await waitFor(() => expect(mocks.ensurePermission).toHaveBeenCalled());

    act(() => usePlanStore.getState().cancelRestTimer());
    answer(true);
    await waitFor(() => expect(mocks.cancelRestEnd).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mocks.scheduleRestEnd).not.toHaveBeenCalled();
  });

  it('does nothing on the web', async () => {
    mocks.native = false;
    usePlanStore.setState({ activeWorkout: { restTimerEndTime: Date.now() + 90_000 } });
    render(<RestTimer />);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mocks.ensurePermission).not.toHaveBeenCalled();
    expect(mocks.scheduleRestEnd).not.toHaveBeenCalled();
  });
});
