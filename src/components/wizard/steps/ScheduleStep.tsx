import { Calendar, Clock, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '@/stores/wizardStore';
import { useWizardForm, scheduleStepSchema } from '@/hooks/useWizardForm';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS_OPTIONS = [2, 3, 4, 5, 6] as const;
const DURATION_OPTIONS = [30, 45, 60, 75, 90] as const;

export function ScheduleStep() {
  const { selections, setDaysPerWeek, setSessionDuration } = useWizardStore();

  // React Hook Form integration
  const { watch, setValue, trigger } = useWizardForm({
    schema: scheduleStepSchema,
    defaultValues: {
      daysPerWeek: selections.daysPerWeek,
      sessionDuration: selections.sessionDuration,
    },
    onSync: (values) => {
      if (values.daysPerWeek !== undefined) setDaysPerWeek(values.daysPerWeek);
      if (values.sessionDuration !== undefined) setSessionDuration(values.sessionDuration);
    },
  });

  const watchedDays = watch('daysPerWeek');
  const watchedDuration = watch('sessionDuration');

  // Determine split type based on days
  const getSplitType = (days: number): string => {
    if (days <= 3) return 'Full Body';
    if (days === 4) return 'Upper/Lower';
    return 'Push/Pull/Legs';
  };

  const handleDaysChange = (days: number) => {
    setValue('daysPerWeek', days);
    trigger('daysPerWeek');
  };

  const handleDurationChange = (duration: number) => {
    setValue('sessionDuration', duration);
    trigger('sessionDuration');
  };

  const handleReset = () => {
    setValue('daysPerWeek', 3);
    setValue('sessionDuration', 60);
    trigger();
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Set your schedule</h2>
        <p className="text-muted-foreground mt-1">How often and how long can you train?</p>
      </div>

      <AnimatePresence>
        {(watchedDays !== 3 || watchedDuration !== 60) && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="touch-target border-primary/50 text-primary hover:bg-primary/10"
            >
              Reset to Recommended
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Days per week */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-lg bg-primary/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calendar className="h-5 w-5 text-primary" />
            </motion.div>
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
              <motion.button
                key={days}
                onClick={() => handleDaysChange(days)}
                className={cn(
                  "h-14 w-14 rounded-xl text-lg font-bold transition-colors duration-200 touch-target relative",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  watchedDays === days
                    ? "gradient-primary text-primary-foreground shadow-lg"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                role="radio"
                aria-checked={watchedDays === days}
                aria-label={`${days} days per week`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: watchedDays === days ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {days}
                <AnimatePresence>
                  {watchedDays === days && (
                    <motion.div
                      className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          <motion.div
            className="text-center p-3 rounded-lg bg-muted/50"
            key={watchedDays}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-muted-foreground">
              Recommended split: <span className="font-semibold text-primary">{getSplitType(watchedDays)}</span>
            </p>
          </motion.div>
        </CardContent>
      </Card>

      {/* Session duration */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-lg bg-accent/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Clock className="h-5 w-5 text-accent" />
            </motion.div>
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
                <motion.button
                  key={duration}
                  onClick={() => handleDurationChange(duration)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 touch-target relative",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                    watchedDuration === duration
                      ? "gradient-accent text-accent-foreground shadow-lg"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                  role="radio"
                  aria-checked={watchedDuration === duration}
                  aria-label={`${duration} minutes per session`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {duration} min
                  <AnimatePresence>
                    {watchedDuration === duration && (
                      <motion.div
                        className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full p-0.5"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div
            className="text-center p-3 rounded-lg bg-muted/50"
            key={`${watchedDays}-${watchedDuration}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-muted-foreground">
              Weekly training time: <motion.span
                className="font-semibold text-accent"
                key={watchedDays * watchedDuration}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {(watchedDays * watchedDuration / 60).toFixed(1)} hours
              </motion.span>
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
