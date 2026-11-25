import i18n from '@/lib/i18n';
import { isNativeApp } from '@/lib/platform';
import { usePlanStore } from '@/stores/planStore';
import { cancelRestEnd, ensureNotificationPermissionOnce, scheduleRestEnd } from './useLocalNotifications';

/**
 * Keeps the rest notification (id 1001) in step with the active workout's
 * rest timer, at the workout-state level rather than in RestTimer, so it
 * also follows changes made while RestTimer isn't mounted (PR #89 review):
 * for example discarding an unfinished workout from WorkoutLogger's "resume
 * or discard" prompt, which renders without RestTimer.
 *
 * - A new rest end time: ask for permission the first time ever, then
 *   schedule (or reschedule, for an adjusted timer).
 * - No rest any more (skipped, finished, workout discarded or replaced):
 *   cancel.
 *
 * Started once per app run, native only, and never stopped. It starts from
 * the app-start hook (`useStatusBarTheme`, once the stores have loaded, which
 * also clears a notification left over from a discarded workout before a
 * restart) and from RestTimer, whichever comes first. Doesn't edit planStore;
 * it only subscribes to it.
 */

let unsubscribe: (() => void) | null = null;
let currentEndTime: number | null = null;

function readEndTime(): number | null {
  return usePlanStore.getState().activeWorkout?.restTimerEndTime ?? null;
}

async function applyEndTime(endTime: number | null): Promise<void> {
  if (!endTime) {
    await cancelRestEnd();
    return;
  }
  const granted = await ensureNotificationPermissionOnce();
  // A newer change (skip, adjust, discard) arrived while we were asking.
  if (!granted || currentEndTime !== endTime) return;
  await scheduleRestEnd(
    new Date(endTime),
    i18n.t('notifications.rest_end_body', 'Rest over. Time for your next set.'),
  );
}

export function startRestNotificationSync(): void {
  if (unsubscribe || !isNativeApp()) return;

  currentEndTime = readEndTime();
  void applyEndTime(currentEndTime);

  unsubscribe = usePlanStore.subscribe((state) => {
    const endTime = state.activeWorkout?.restTimerEndTime ?? null;
    if (endTime === currentEndTime) return;
    currentEndTime = endTime;
    void applyEndTime(endTime);
  });
}

/** Test helper. */
export function stopRestNotificationSyncForTests(): void {
  unsubscribe?.();
  unsubscribe = null;
  currentEndTime = null;
}
