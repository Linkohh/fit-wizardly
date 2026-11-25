import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkoutRemindersCard, WorkoutRemindersSettings } from '../WorkoutRemindersCard';

const mocks = vi.hoisted(() => ({
  native: true,
  storage: new Map<string, string>(),
  ensurePermission: vi.fn(async () => true),
  scheduleWorkoutReminders: vi.fn(async () => undefined),
  cancelWorkoutReminders: vi.fn(async () => undefined),
  toastError: vi.fn(),
  t: (_key: string, fallback?: string) => fallback ?? _key,
  i18n: { language: 'en' },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.t, i18n: mocks.i18n }),
}));

vi.mock('sonner', () => ({ toast: { error: mocks.toastError, success: vi.fn() } }));

vi.mock('@/lib/platform', () => ({ isNativeApp: () => mocks.native }));

vi.mock('@/lib/storage/appStorage', () => ({
  appStorage: {
    getItem: async (name: string) => mocks.storage.get(name) ?? null,
    setItem: async (name: string, value: string) => {
      mocks.storage.set(name, value);
    },
    removeItem: async (name: string) => {
      mocks.storage.delete(name);
    },
  },
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: (selector: (state: unknown) => unknown) =>
    selector({ currentPlan: { selections: { daysPerWeek: 3 }, workoutDays: [] } }),
}));

vi.mock('@/hooks/useLocalNotifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useLocalNotifications')>();
  const api = {
    scheduleWorkoutReminders: mocks.scheduleWorkoutReminders,
    cancelWorkoutReminders: mocks.cancelWorkoutReminders,
  };
  return {
    createLatestWinsQueue: actual.createLatestWinsQueue,
    ensureNotificationPermissionOnce: mocks.ensurePermission,
    useLocalNotifications: () => api,
  };
});

async function renderSettings() {
  render(<WorkoutRemindersSettings />);
  return screen.findByRole('switch');
}

describe('WorkoutRemindersCard', () => {
  beforeEach(() => {
    mocks.native = true;
    mocks.storage.clear();
    mocks.ensurePermission.mockReset();
    mocks.ensurePermission.mockResolvedValue(true);
    mocks.scheduleWorkoutReminders.mockClear();
    mocks.cancelWorkoutReminders.mockClear();
    mocks.toastError.mockClear();
  });

  it('renders nothing on the web', () => {
    mocks.native = false;
    const { container } = render(<WorkoutRemindersCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('turning it on schedules reminders on the plan days', async () => {
    const toggle = await renderSettings();
    fireEvent.click(toggle);

    await waitFor(() => expect(mocks.scheduleWorkoutReminders).toHaveBeenCalledWith([1, 3, 5], 18, 0));
    expect(mocks.ensurePermission).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Monday' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Tuesday' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reminders follow the chosen days and time', async () => {
    const toggle = await renderSettings();
    fireEvent.click(toggle);
    await screen.findByRole('button', { name: 'Tuesday' });

    fireEvent.click(screen.getByRole('button', { name: 'Tuesday' }));
    await waitFor(() => expect(mocks.scheduleWorkoutReminders).toHaveBeenLastCalledWith([1, 2, 3, 5], 18, 0));

    fireEvent.click(screen.getByRole('button', { name: 'Monday' }));
    await waitFor(() => expect(mocks.scheduleWorkoutReminders).toHaveBeenLastCalledWith([2, 3, 5], 18, 0));

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '06:45' } });
    await waitFor(() => expect(mocks.scheduleWorkoutReminders).toHaveBeenLastCalledWith([2, 3, 5], 6, 45));

    expect(JSON.parse(mocks.storage.get('fitwizard-reminders') ?? 'null')).toEqual({
      enabled: true,
      days: [2, 3, 5],
      hour: 6,
      minute: 45,
    });
  });

  it('turning it off cancels the reminders', async () => {
    const toggle = await renderSettings();
    fireEvent.click(toggle);
    await waitFor(() => expect(mocks.scheduleWorkoutReminders).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(mocks.cancelWorkoutReminders).toHaveBeenCalled());
    expect(JSON.parse(mocks.storage.get('fitwizard-reminders') ?? 'null')).toMatchObject({ enabled: false });
  });

  it('stays off and explains when notifications are not allowed', async () => {
    mocks.ensurePermission.mockResolvedValue(false);
    const toggle = await renderSettings();
    fireEvent.click(toggle);

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(mocks.scheduleWorkoutReminders).not.toHaveBeenCalled();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });
});
