import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useWizardStore } from '@/stores/wizardStore';
import { cn } from '@/lib/utils';

const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const DURATION_OPTIONS = [30, 45, 60, 75, 90];

export function ScheduleStep() {
  const { selections, setDaysPerWeek, setSessionDuration } = useWizardStore();

  // Determine split type based on days
  const getSplitType = (days: number): string => {
    if (days <= 3) return 'Full Body';
    if (days === 4) return 'Upper/Lower';
    return 'Push/Pull/Legs';
  };

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Set your schedule</h2>
        <p className="text-muted-foreground mt-1">How often and how long can you train?</p>
      </div>

      {/* Days per week */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Training Days per Week</h3>
              <p className="text-sm text-muted-foreground">Select between 2-6 days</p>
            </div>
          </div>

          <div 
            className="flex justify-center gap-2"
            role="radiogroup"
            aria-label="Days per week"
          >
            {DAYS_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setDaysPerWeek(days)}
                className={cn(
                  "h-14 w-14 rounded-xl text-lg font-bold transition-all duration-200 touch-target",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  selections.daysPerWeek === days
                    ? "gradient-primary text-primary-foreground shadow-lg scale-110"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                role="radio"
                aria-checked={selections.daysPerWeek === days}
                aria-label={`${days} days per week`}
              >
                {days}
              </button>
            ))}
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Recommended split: <span className="font-semibold text-primary">{getSplitType(selections.daysPerWeek)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session duration */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Session Duration</h3>
              <p className="text-sm text-muted-foreground">How long is each workout?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div 
              className="flex justify-center gap-2 flex-wrap"
              role="radiogroup"
              aria-label="Session duration"
            >
              {DURATION_OPTIONS.map((duration) => (
                <button
                  key={duration}
                  onClick={() => setSessionDuration(duration)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 touch-target",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                    selections.sessionDuration === duration
                      ? "gradient-accent text-accent-foreground shadow-lg"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                  role="radio"
                  aria-checked={selections.sessionDuration === duration}
                  aria-label={`${duration} minutes per session`}
                >
                  {duration} min
                </button>
              ))}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Weekly training time: <span className="font-semibold text-accent">
                {(selections.daysPerWeek * selections.sessionDuration / 60).toFixed(1)} hours
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
