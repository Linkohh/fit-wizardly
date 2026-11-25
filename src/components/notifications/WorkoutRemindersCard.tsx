import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { isNativeApp } from '@/lib/platform';
import { usePlanStore } from '@/stores/planStore';
import {
  createLatestWinsQueue,
  ensureNotificationPermissionOnce,
  useLocalNotifications,
} from '@/hooks/useLocalNotifications';
import { useReminderSettings, type ReminderSettings } from '@/hooks/useReminderSettings';

/** Monday first, as most of our launch locales expect. 0 = Sunday … 6 = Saturday. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function weekdayLabels(locale: string): Record<number, { short: string; long: string }> {
  // 2024-01-07 was a Sunday, so 2024-01-(7 + n) is weekday n.
  const labels: Record<number, { short: string; long: string }> = {};
  for (let weekday = 0; weekday < 7; weekday += 1) {
    const date = new Date(2024, 0, 7 + weekday);
    let short: string;
    let long: string;
    try {
      short = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
      long = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
    } catch {
      short = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date);
      long = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(date);
    }
    labels[weekday] = { short, long };
  }
  return labels;
}

const pad = (value: number) => value.toString().padStart(2, '0');

/**
 * Profile → Workout reminders (Lane H, roadmap 2.4). Native only: on the web
 * this renders nothing, because web push is out of scope.
 */
export function WorkoutRemindersCard() {
  if (!isNativeApp()) return null;
  return <WorkoutRemindersSettings />;
}

/** The settings themselves. Exported for tests. */
export function WorkoutRemindersSettings() {
  const { t, i18n } = useTranslation();
  const daysPerWeek = usePlanStore(
    (state) => state.currentPlan?.selections.daysPerWeek ?? state.currentPlan?.workoutDays.length ?? null,
  );
  const { settings, update, persist } = useReminderSettings(daysPerWeek);
  const { scheduleWorkoutReminders, cancelWorkoutReminders } = useLocalNotifications();
  const [isBusy, setIsBusy] = useState(false);
  const labels = useMemo(() => weekdayLabels(i18n.language || 'en'), [i18n.language]);
  // One change at a time, latest wins: a day or time edit that is still
  // saving or scheduling can't land after a later "off" (PR #89 review).
  const applyQueue = useRef(createLatestWinsQueue('Reminder settings')).current;

  if (!settings) return null;

  const apply = (next: ReminderSettings) => {
    update(next);
    return applyQueue(async () => {
      await persist(next);
      if (next.enabled && next.days.length > 0) {
        await scheduleWorkoutReminders(next.days, next.hour, next.minute);
      } else {
        await cancelWorkoutReminders();
      }
    });
  };

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      await apply({ ...settings, enabled: false });
      return;
    }
    setIsBusy(true);
    try {
      const granted = await ensureNotificationPermissionOnce();
      if (!granted) {
        toast.error(
          t(
            'notifications.permission_denied',
            "Notifications are off for FitWizard. Turn them on in your phone's Settings.",
          ),
        );
        return;
      }
      await apply({ ...settings, enabled: true });
    } finally {
      setIsBusy(false);
    }
  };

  const toggleDay = (weekday: number) => {
    const days = settings.days.includes(weekday)
      ? settings.days.filter((day) => day !== weekday)
      : [...settings.days, weekday].sort((a, b) => a - b);
    void apply({ ...settings, days });
  };

  const handleTimeChange = (value: string) => {
    const match = /^(\d{2}):(\d{2})/.exec(value);
    if (!match) return;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) return;
    void apply({ ...settings, hour, minute });
  };

  return (
    <Card className="border-border/50 shadow-sm relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-transparent" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Bell className="h-5 w-5 text-primary" />
          {t('notifications.reminders_title', 'Workout reminders')}
        </CardTitle>
        <CardDescription>
          {t('notifications.reminders_description', 'A reminder on your training days, at the time you choose.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="workout-reminders" className="text-base">
            {t('notifications.reminders_toggle', 'Remind me on training days')}
          </Label>
          <Switch
            id="workout-reminders"
            checked={settings.enabled}
            disabled={isBusy}
            onCheckedChange={(checked) => void handleToggle(checked)}
          />
        </div>

        {settings.enabled && (
          <>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('notifications.reminders_days', 'Days')}</legend>
              <div className="flex flex-wrap gap-2">
                {WEEK_ORDER.map((weekday) => {
                  const selected = settings.days.includes(weekday);
                  return (
                    <button
                      key={weekday}
                      type="button"
                      aria-pressed={selected}
                      aria-label={labels[weekday].long}
                      onClick={() => toggleDay(weekday)}
                      className={cn(
                        'min-h-11 min-w-11 rounded-full border px-3 text-sm font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted',
                      )}
                    >
                      {labels[weekday].short}
                    </button>
                  );
                })}
              </div>
              {settings.days.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('notifications.reminders_no_days', 'Pick at least one day to get reminders.')}
                </p>
              )}
            </fieldset>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="workout-reminder-time" className="text-base">
                {t('notifications.reminders_time', 'Time')}
              </Label>
              <input
                id="workout-reminder-time"
                type="time"
                value={`${pad(settings.hour)}:${pad(settings.minute)}`}
                onChange={(event) => handleTimeChange(event.target.value)}
                className="min-h-11 rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
