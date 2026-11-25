import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkoutRemindersSettings } from '../WorkoutRemindersCard';

/**
 * PR #89 review: a day/time edit followed quickly by switching reminders off
 * must not leave reminders scheduled. Uses the real notifications module with
 * the plugin mocked, and holds checkPermissions() open to force the overlap.
 */

const mocks = vi.hoisted(() => {
  let release: () => void = () => undefined;
  return {
    storage: new Map<string, string>(),
    calls: [] as string[],
    holdPermission: false,
    release: () => release(),
    setRelease: (fn: () => void) => {
      release = fn;
    },
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en' },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.t, i18n: mocks.i18n }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/lib/platform', () => ({ isNativeApp: () => true }));

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
  usePlanStore: (selector: (state: unknown) => unknown) => selector({ currentPlan: null }),
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: () => {
      if (!mocks.holdPermission) return Promise.resolve({ display: 'granted' });
      return new Promise((resolve) => {
        mocks.setRelease(() => resolve({ display: 'granted' }));
      });
    },
    requestPermissions: async () => ({ display: 'granted' }),
    cancel: async () => {
      mocks.calls.push('cancel');
    },
    schedule: async () => {
      mocks.calls.push('schedule');
      return { notifications: [] };
    },
  },
}));

describe('WorkoutRemindersCard: overlapping changes', () => {
  beforeEach(() => {
    mocks.calls.length = 0;
    mocks.holdPermission = false;
    mocks.storage.clear();
    mocks.storage.set('fitwizard-notif-asked', '{"granted":true}');
    mocks.storage.set('fitwizard-reminders', JSON.stringify({ enabled: true, days: [1, 3, 5], hour: 18, minute: 0 }));
  });

  it('the latest state wins: switching off after a day edit leaves nothing scheduled', async () => {
    render(<WorkoutRemindersSettings />);
    const tuesday = await screen.findByRole('button', { name: 'Tuesday' });

    mocks.holdPermission = true;
    fireEvent.click(tuesday); // schedules; stalls on checkPermissions()
    await new Promise((resolve) => setTimeout(resolve, 10));
    fireEvent.click(screen.getByRole('switch')); // switch off: cancels
    await new Promise((resolve) => setTimeout(resolve, 10));

    mocks.holdPermission = false;
    mocks.release();

    await waitFor(() => expect(JSON.parse(mocks.storage.get('fitwizard-reminders') ?? '{}').enabled).toBe(false));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocks.calls.at(-1)).toBe('cancel');
  });
});
