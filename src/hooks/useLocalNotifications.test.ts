import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOTIFICATION_ASKED_KEY,
  REST_END_NOTIFICATION_ID,
  cancelRestEnd,
  cancelWorkoutReminders,
  ensureNotificationPermissionOnce,
  resetLocalNotificationsForTests,
  scheduleRestEnd,
  scheduleWorkoutReminders,
  useLocalNotifications,
} from './useLocalNotifications';

type Display = 'granted' | 'denied' | 'prompt';

const mocks = vi.hoisted(() => ({
  native: false,
  display: 'prompt' as Display,
  answer: 'granted' as Display,
  storage: new Map<string, string>(),
  schedule: vi.fn(async () => ({ notifications: [] })),
  cancel: vi.fn(async () => undefined),
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => mocks.native,
}));

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

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: mocks.schedule,
    cancel: mocks.cancel,
    checkPermissions: mocks.checkPermissions,
    requestPermissions: mocks.requestPermissions,
  },
}));

const REMINDER_IDS = [2001, 2002, 2003, 2004, 2005, 2006, 2007];

describe('useLocalNotifications', () => {
  beforeEach(() => {
    resetLocalNotificationsForTests();
    mocks.native = false;
    mocks.display = 'prompt';
    mocks.answer = 'granted';
    mocks.storage.clear();
    mocks.schedule.mockClear();
    mocks.cancel.mockClear();
    mocks.checkPermissions.mockReset();
    mocks.checkPermissions.mockImplementation(async () => ({ display: mocks.display }));
    mocks.requestPermissions.mockReset();
    mocks.requestPermissions.mockImplementation(async () => {
      mocks.display = mocks.answer;
      return { display: mocks.answer };
    });
  });

  describe('on the web', () => {
    it('does nothing and never touches the plugin or storage', async () => {
      const { result } = renderHook(() => useLocalNotifications());
      await expect(result.current.requestPermission()).resolves.toBe(false);
      await result.current.scheduleRestEnd(new Date(Date.now() + 60_000), 'Rest over');
      await result.current.cancelRestEnd();
      await result.current.scheduleWorkoutReminders([1, 3], 18, 0);
      await result.current.cancelWorkoutReminders();
      await expect(ensureNotificationPermissionOnce()).resolves.toBe(false);

      expect(mocks.checkPermissions).not.toHaveBeenCalled();
      expect(mocks.schedule).not.toHaveBeenCalled();
      expect(mocks.cancel).not.toHaveBeenCalled();
      expect(mocks.storage.size).toBe(0);
    });
  });

  describe('on native', () => {
    beforeEach(() => {
      mocks.native = true;
    });

    it('schedules the rest notification with id 1001 as an inexact alarm', async () => {
      mocks.display = 'granted';
      const at = new Date(Date.now() + 90_000);
      await scheduleRestEnd(at, 'Rest over. Time for your next set.');

      expect(mocks.schedule).toHaveBeenCalledWith({
        notifications: [
          {
            id: REST_END_NOTIFICATION_ID,
            title: 'FitWizard',
            body: 'Rest over. Time for your next set.',
            schedule: { at, allowWhileIdle: true },
            isExactNotification: false,
          },
        ],
      });
    });

    it('cancels the rest notification by id 1001', async () => {
      await cancelRestEnd();
      expect(mocks.cancel).toHaveBeenCalledWith({ notifications: [{ id: 1001 }] });
    });

    it('does not schedule without permission, so the plugin never prompts on its own', async () => {
      mocks.display = 'prompt';
      await scheduleRestEnd(new Date(Date.now() + 60_000), 'Rest over');
      await scheduleWorkoutReminders([1], 18, 0, 'Train');
      expect(mocks.schedule).not.toHaveBeenCalled();
      expect(mocks.requestPermissions).not.toHaveBeenCalled();
    });

    it('skips a rest end time that has already passed', async () => {
      mocks.display = 'granted';
      await scheduleRestEnd(new Date(Date.now() - 1000), 'Rest over');
      expect(mocks.schedule).not.toHaveBeenCalled();
    });

    it('schedules one weekly reminder per chosen day with ids 2001 + weekday', async () => {
      mocks.display = 'granted';
      await scheduleWorkoutReminders([5, 1, 3, 3, 9], 7, 30, 'Time to train.');

      // Every earlier reminder is cleared first.
      expect(mocks.cancel).toHaveBeenCalledWith({ notifications: REMINDER_IDS.map((id) => ({ id })) });
      expect(mocks.schedule).toHaveBeenCalledTimes(1);
      const [{ notifications }] = mocks.schedule.mock.calls[0] as unknown as [
        { notifications: Array<{ id: number; schedule: unknown; isExactNotification: boolean }> },
      ];
      expect(notifications.map((notification) => notification.id)).toEqual([2002, 2004, 2006]);
      // Plugin weekdays are 1 = Sunday … 7 = Saturday: Monday is 2.
      expect(notifications[0].schedule).toEqual({ on: { weekday: 2, hour: 7, minute: 30 }, allowWhileIdle: true });
      expect(notifications.every((notification) => notification.isExactNotification === false)).toBe(true);
    });

    it('maps Sunday to id 2001 and Saturday to id 2007', async () => {
      mocks.display = 'granted';
      await scheduleWorkoutReminders([0, 6], 18, 0, 'Train');
      const [{ notifications }] = mocks.schedule.mock.calls[0] as unknown as [
        { notifications: Array<{ id: number; schedule: { on: { weekday: number } } }> },
      ];
      expect(notifications.map((notification) => [notification.id, notification.schedule.on.weekday])).toEqual([
        [2001, 1],
        [2007, 7],
      ]);
    });

    it('only cancels when no days are chosen or the time is invalid', async () => {
      mocks.display = 'granted';
      await scheduleWorkoutReminders([], 18, 0, 'Train');
      await scheduleWorkoutReminders([1], 24, 0, 'Train');
      expect(mocks.cancel).toHaveBeenCalledTimes(2);
      expect(mocks.schedule).not.toHaveBeenCalled();
    });

    it('cancels all seven reminder ids', async () => {
      await cancelWorkoutReminders();
      expect(mocks.cancel).toHaveBeenCalledWith({ notifications: REMINDER_IDS.map((id) => ({ id })) });
    });

    it('the hook passes a translated reminder body', async () => {
      mocks.display = 'granted';
      const { result } = renderHook(() => useLocalNotifications());
      await result.current.scheduleWorkoutReminders([2], 18, 0);
      const [{ notifications }] = mocks.schedule.mock.calls[0] as unknown as [
        { notifications: Array<{ body: string }> },
      ];
      expect(notifications[0].body).toBeTruthy();
    });

    it('never throws when the plugin fails', async () => {
      mocks.display = 'granted';
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mocks.schedule.mockRejectedValueOnce(new Error('boom'));
      await expect(scheduleRestEnd(new Date(Date.now() + 60_000), 'Rest over')).resolves.toBeUndefined();
      mocks.cancel.mockRejectedValueOnce(new Error('boom'));
      await expect(cancelRestEnd()).resolves.toBeUndefined();
      errorSpy.mockRestore();
    });

    it('a cancel queued while a schedule waits on permission wins (PR #89 review)', async () => {
      let grant: () => void = () => undefined;
      mocks.checkPermissions.mockImplementationOnce(
        () => new Promise((resolve) => {
          grant = () => resolve({ display: 'granted' });
        }),
      );
      const scheduling = scheduleWorkoutReminders([1, 3], 18, 0, 'Train');
      // The schedule is running and waiting on permission when "off" arrives.
      await vi.waitFor(() => expect(mocks.checkPermissions).toHaveBeenCalled());
      const cancelling = cancelWorkoutReminders();
      grant();
      await Promise.all([scheduling, cancelling]);

      expect(mocks.schedule).not.toHaveBeenCalled();
      expect(mocks.cancel).toHaveBeenCalledTimes(2);
    });

    it('a later rest replaces an earlier one still waiting on permission', async () => {
      let grant: () => void = () => undefined;
      mocks.checkPermissions.mockImplementationOnce(
        () => new Promise((resolve) => {
          grant = () => resolve({ display: 'granted' });
        }),
      );
      mocks.display = 'granted';
      const first = new Date(Date.now() + 60_000);
      const second = new Date(Date.now() + 90_000);
      const a = scheduleRestEnd(first, 'Rest over');
      await vi.waitFor(() => expect(mocks.checkPermissions).toHaveBeenCalled());
      const b = scheduleRestEnd(second, 'Rest over');
      grant();
      await Promise.all([a, b]);

      expect(mocks.schedule).toHaveBeenCalledTimes(1);
      expect(mocks.schedule.mock.calls[0]).toMatchObject([{ notifications: [{ schedule: { at: second } }] }]);
    });

    describe('permission prompt', () => {
      it('asks only the first time and records it in device storage', async () => {
        await expect(ensureNotificationPermissionOnce()).resolves.toBe(true);
        expect(mocks.requestPermissions).toHaveBeenCalledTimes(1);
        expect(mocks.storage.has(NOTIFICATION_ASKED_KEY)).toBe(true);

        await expect(ensureNotificationPermissionOnce()).resolves.toBe(true);
        expect(mocks.requestPermissions).toHaveBeenCalledTimes(1);
      });

      it('never asks again after the person declines', async () => {
        mocks.answer = 'denied';
        await expect(ensureNotificationPermissionOnce()).resolves.toBe(false);
        expect(JSON.parse(mocks.storage.get(NOTIFICATION_ASKED_KEY) ?? '{}')).toMatchObject({ granted: false });

        // Even if the OS would allow another prompt, the app doesn't show one.
        mocks.display = 'prompt';
        await expect(ensureNotificationPermissionOnce()).resolves.toBe(false);
        await expect(ensureNotificationPermissionOnce()).resolves.toBe(false);
        expect(mocks.requestPermissions).toHaveBeenCalledTimes(1);
      });

      it('two rests started together show one prompt', async () => {
        await Promise.all([ensureNotificationPermissionOnce(), ensureNotificationPermissionOnce()]);
        expect(mocks.requestPermissions).toHaveBeenCalledTimes(1);
      });

      it('does not prompt when permission is already granted', async () => {
        mocks.display = 'granted';
        await expect(ensureNotificationPermissionOnce()).resolves.toBe(true);
        expect(mocks.requestPermissions).not.toHaveBeenCalled();
      });

      it('does not keep the record in localStorage', async () => {
        await ensureNotificationPermissionOnce();
        expect(window.localStorage.getItem(NOTIFICATION_ASKED_KEY)).toBeNull();
      });
    });
  });
});
