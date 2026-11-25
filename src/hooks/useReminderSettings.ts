import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { appStorage } from '@/lib/storage/appStorage';

/**
 * Workout reminder settings (roadmap 2.4), kept in device storage under
 * `fitwizard-reminders` (ADR 11: never localStorage). These are device
 * settings, not training data, so they don't sync and aren't erased with
 * user data: the reminders themselves are scheduled on this device.
 */

export const REMINDER_SETTINGS_KEY = 'fitwizard-reminders';

const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  /** 0 = Sunday … 6 = Saturday. */
  days: z.array(z.number().int().min(0).max(6)).max(7),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;

const DEFAULT_HOUR = 18;
const DEFAULT_MINUTE = 0;

/** Training days spread across the week for a plan with `daysPerWeek` sessions. */
const DEFAULT_DAYS_BY_COUNT: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** Default reminder days for a plan: Mon/Wed/Fri when there's no plan. */
export function defaultReminderDays(daysPerWeek: number | null | undefined): number[] {
  const count = Number.isFinite(daysPerWeek) ? Math.round(daysPerWeek as number) : 3;
  return DEFAULT_DAYS_BY_COUNT[Math.min(7, Math.max(1, count))];
}

export function defaultReminderSettings(daysPerWeek?: number | null): ReminderSettings {
  return { enabled: false, days: defaultReminderDays(daysPerWeek), hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
}

/** Saved settings, or null if nothing valid is saved. Never throws. */
export async function readReminderSettings(): Promise<ReminderSettings | null> {
  try {
    const raw = await appStorage.getItem(REMINDER_SETTINGS_KEY);
    if (raw === null || typeof raw !== 'string') return null;
    const parsed = reminderSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function writeReminderSettings(settings: ReminderSettings): Promise<void> {
  await appStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}

export interface UseReminderSettingsResult {
  /** Null until the saved settings have loaded. */
  settings: ReminderSettings | null;
  save(next: ReminderSettings): Promise<void>;
}

/**
 * Loads the saved reminder settings, falling back to defaults built from the
 * plan's training days (`daysPerWeek`) when nothing is saved yet.
 */
export function useReminderSettings(daysPerWeek?: number | null): UseReminderSettingsResult {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    void readReminderSettings().then((saved) => {
      if (cancelled) return;
      setSettings((current) => current ?? saved ?? defaultReminderSettings(daysPerWeek));
    });
    return () => {
      cancelled = true;
    };
  }, [daysPerWeek]);

  const save = useCallback(async (next: ReminderSettings) => {
    setSettings(next);
    await writeReminderSettings(next);
  }, []);

  return { settings, save };
}
