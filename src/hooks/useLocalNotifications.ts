import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isNativeApp } from '@/lib/platform';
import { appStorage } from '@/lib/storage/appStorage';

/**
 * Local notifications (contract #10, roadmap 2.4).
 *
 * - Rest timer: one notification, fixed id 1001, at the end of the rest.
 * - Workout reminders: one weekly notification per chosen weekday,
 *   ids 2001–2007 (2001 + weekday, where 0 = Sunday … 6 = Saturday).
 *
 * `@capacitor/local-notifications` loads with a dynamic `import()` only on
 * native. On the web every function is a no-op (web push is out of scope).
 * Nothing here throws: failures are logged and the app carries on.
 *
 * Two plugin behaviours (v8.3) that this file guards against:
 * - `schedule()` asks for notification permission itself if it hasn't been
 *   granted. We only schedule once permission is granted, so the app never
 *   shows a prompt the person didn't trigger (and never asks twice).
 * - On Android 12+ notifications default to exact alarms, and `schedule()`
 *   opens the "Alarms & reminders" settings screen if that isn't allowed.
 *   We pass `isExactNotification: false` everywhere: inexact alarms need no
 *   special permission. `SCHEDULE_EXACT_ALARM` is removed from the merged
 *   Android manifest for the same reason.
 */

export const REST_END_NOTIFICATION_ID = 1001;
export const WORKOUT_REMINDER_BASE_ID = 2001;
/** Device storage key for "we have already asked for notification permission". */
export const NOTIFICATION_ASKED_KEY = 'fitwizard-notif-asked';

const NOTIFICATION_TITLE = 'FitWizard';
const ALL_REMINDER_IDS = Array.from({ length: 7 }, (_, weekday) => WORKOUT_REMINDER_BASE_ID + weekday);

type NotificationsModule = typeof import('@capacitor/local-notifications');

/**
 * Runs tasks one at a time, latest wins: a task that is still waiting when a
 * newer one is queued is skipped, and a running task can check `isLatest()`
 * before doing more work. Used so that an earlier "schedule" that is still
 * waiting on the plugin can't land after a later "cancel" (PR #89 review).
 */
export type LatestWinsQueue = (task: (isLatest: () => boolean) => Promise<void>) => Promise<void>;

export function createLatestWinsQueue(label: string): LatestWinsQueue {
  let tail: Promise<void> = Promise.resolve();
  let latestTicket = 0;
  return (task) => {
    const ticket = ++latestTicket;
    const isLatest = () => ticket === latestTicket;
    const run = tail.then(async () => {
      if (!isLatest()) return;
      try {
        await task(isLatest);
      } catch (error) {
        console.error(`[Notifications] ${label} failed:`, error);
      }
    });
    tail = run;
    return run;
  };
}

let restQueue = createLatestWinsQueue('Rest notification');
let reminderQueue = createLatestWinsQueue('Workout reminders');

let pluginPromise: Promise<NotificationsModule | null> | null = null;
let pendingPermissionCheck: Promise<boolean> | null = null;

function loadPlugin(): Promise<NotificationsModule | null> {
  if (!pluginPromise) {
    pluginPromise = import('@capacitor/local-notifications').catch((error: unknown) => {
      console.error('[Notifications] Plugin unavailable:', error);
      pluginPromise = null;
      return null;
    });
  }
  return pluginPromise;
}

/** Test helper: forget the cached plugin. */
export function resetLocalNotificationsForTests(): void {
  pluginPromise = null;
  pendingPermissionCheck = null;
  restQueue = createLatestWinsQueue('Rest notification');
  reminderQueue = createLatestWinsQueue('Workout reminders');
}

async function nativePlugin(): Promise<NotificationsModule['LocalNotifications'] | null> {
  if (!isNativeApp()) return null;
  const module = await loadPlugin();
  return module?.LocalNotifications ?? null;
}

/** Whether notifications may be shown, without prompting. False on the web. */
export async function hasNotificationPermission(): Promise<boolean> {
  const plugin = await nativePlugin();
  if (!plugin) return false;
  try {
    const status = await plugin.checkPermissions();
    return status.display === 'granted';
  } catch (error) {
    console.error('[Notifications] Could not check permission:', error);
    return false;
  }
}

/** Shows the system prompt if the OS still allows it. False on the web. */
export async function requestNotificationPermission(): Promise<boolean> {
  const plugin = await nativePlugin();
  if (!plugin) return false;
  try {
    const current = await plugin.checkPermissions();
    if (current.display === 'granted') return true;
    if (current.display === 'denied') return false;
    const result = await plugin.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('[Notifications] Could not request permission:', error);
    return false;
  }
}

async function hasAskedBefore(): Promise<boolean> {
  return (await appStorage.getItem(NOTIFICATION_ASKED_KEY)) !== null;
}

/**
 * Asks for permission at most once per install. The first call shows the
 * system prompt and records the answer under `fitwizard-notif-asked` in
 * device storage (ADR 11; not localStorage). Later calls never prompt: they
 * only report whether notifications are currently allowed, so a person who
 * declined is never asked again by the app. Always false on the web, where
 * nothing is recorded.
 */
export function ensureNotificationPermissionOnce(): Promise<boolean> {
  if (!isNativeApp()) return Promise.resolve(false);
  // One check at a time, so two rests started in quick succession can't both
  // read "not asked yet" and show two prompts.
  if (!pendingPermissionCheck) {
    pendingPermissionCheck = askOnce().finally(() => {
      pendingPermissionCheck = null;
    });
  }
  return pendingPermissionCheck;
}

async function askOnce(): Promise<boolean> {
  if (await hasAskedBefore()) return hasNotificationPermission();

  // Record before prompting, so a crash mid-prompt still counts as asked.
  await appStorage.setItem(NOTIFICATION_ASKED_KEY, JSON.stringify({ askedAt: new Date().toISOString() }));
  const granted = await requestNotificationPermission();
  await appStorage.setItem(
    NOTIFICATION_ASKED_KEY,
    JSON.stringify({ askedAt: new Date().toISOString(), granted }),
  );
  return granted;
}

async function cancelIds(ids: number[]): Promise<void> {
  const plugin = await nativePlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch (error) {
    console.error('[Notifications] Could not cancel:', error);
  }
}

export function scheduleRestEnd(at: Date, body: string): Promise<void> {
  if (!isNativeApp()) return Promise.resolve();
  return restQueue(async (isLatest) => {
    const plugin = await nativePlugin();
    if (!plugin) return;
    // Same id replaces any earlier rest notification (an adjusted timer).
    await cancelIds([REST_END_NOTIFICATION_ID]);
    if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) return;
    if (!(await hasNotificationPermission()) || !isLatest()) return;

    try {
      await plugin.schedule({
        notifications: [
          {
            id: REST_END_NOTIFICATION_ID,
            title: NOTIFICATION_TITLE,
            body,
            schedule: { at, allowWhileIdle: true },
            isExactNotification: false,
          },
        ],
      });
    } catch (error) {
      console.error('[Notifications] Could not schedule the rest notification:', error);
    }
  });
}

export function cancelRestEnd(): Promise<void> {
  if (!isNativeApp()) return Promise.resolve();
  return restQueue(() => cancelIds([REST_END_NOTIFICATION_ID]));
}

/** Valid weekdays (0 = Sunday … 6 = Saturday), sorted, without duplicates. */
export function normalizeWeekdays(days: number[]): number[] {
  return [...new Set(days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort(
    (a, b) => a - b,
  );
}

/**
 * Replaces all workout reminders with one weekly reminder per weekday in
 * `days` (0 = Sunday … 6 = Saturday) at `hour`:`minute` local time.
 * An empty `days` list just cancels them.
 */
export function scheduleWorkoutReminders(
  days: number[],
  hour: number,
  minute: number,
  body: string,
): Promise<void> {
  if (!isNativeApp()) return Promise.resolve();
  return reminderQueue(async (isLatest) => {
    const plugin = await nativePlugin();
    if (!plugin) return;

    await cancelIds(ALL_REMINDER_IDS);

    const weekdays = normalizeWeekdays(days);
    const validTime =
      Number.isInteger(hour) && hour >= 0 && hour <= 23 && Number.isInteger(minute) && minute >= 0 && minute <= 59;
    if (weekdays.length === 0 || !validTime) return;
    if (!(await hasNotificationPermission()) || !isLatest()) return;

    try {
      await plugin.schedule({
        notifications: weekdays.map((weekday) => ({
          id: WORKOUT_REMINDER_BASE_ID + weekday,
          title: NOTIFICATION_TITLE,
          body,
          // The plugin's Weekday enum is 1 = Sunday … 7 = Saturday.
          schedule: { on: { weekday: weekday + 1, hour, minute }, allowWhileIdle: true },
          isExactNotification: false,
        })),
      });
    } catch (error) {
      console.error('[Notifications] Could not schedule workout reminders:', error);
    }
  });
}

export function cancelWorkoutReminders(): Promise<void> {
  if (!isNativeApp()) return Promise.resolve();
  return reminderQueue(() => cancelIds(ALL_REMINDER_IDS));
}

export interface UseLocalNotificationsResult {
  requestPermission(): Promise<boolean>;
  scheduleRestEnd(at: Date, body: string): Promise<void>;
  cancelRestEnd(): Promise<void>;
  /** `days`: 0 = Sunday … 6 = Saturday. */
  scheduleWorkoutReminders(days: number[], hour: number, minute: number): Promise<void>;
  cancelWorkoutReminders(): Promise<void>;
}

export function useLocalNotifications(): UseLocalNotificationsResult {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      requestPermission: requestNotificationPermission,
      scheduleRestEnd,
      cancelRestEnd,
      scheduleWorkoutReminders: (days: number[], hour: number, minute: number) =>
        scheduleWorkoutReminders(
          days,
          hour,
          minute,
          t('notifications.reminder_body', 'Time to train. Your workout is ready.'),
        ),
      cancelWorkoutReminders,
    }),
    [t],
  );
}
