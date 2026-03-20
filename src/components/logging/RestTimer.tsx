import { useEffect, useState } from 'react';
import { usePlanStore } from '@/stores/planStore';
import { Button } from '@/components/ui/button';
import { Plus, Minus, SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';

export function RestTimer() {
  const { t } = useTranslation();
  const { activeWorkout, cancelRestTimer, adjustRestTimer } = usePlanStore();
  const { emit } = useInteractionFeedback();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!activeWorkout?.restTimerEndTime) {
      setIsVisible(false);
      return;
    }

    const checkTimer = () => {
      const now = Date.now();
      const remaining = Math.ceil((activeWorkout.restTimerEndTime! - now) / 1000);

      if (remaining <= 0) {
        setIsVisible(false);
        void emit('success');
        cancelRestTimer();
        return;
      }

      setTimeLeft(remaining);
      setIsVisible(true);
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.restTimerEndTime, cancelRestTimer, emit]);

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/80 backdrop-blur-xl border-t border-primary/20 shadow-[0_-8px_32px_hsl(270_50%_5%/0.5)] animate-in slide-in-from-bottom-full duration-300 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="container max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t('workout.rest_timer', 'Rest')}
          </span>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full ring-1 ring-primary/30 blur-sm animate-[pulse-glow_2s_ease-in-out_infinite] pointer-events-none" />
            <span className={`text-3xl font-bold tabular-nums font-mono font-display text-primary${timeLeft < 10 ? ' gradient-text' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustRestTimer(-10)}
            className="h-10 w-10 border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-colors"
            data-click-feedback="off"
            data-interaction-feedback="explicit"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustRestTimer(30)}
            className="h-10 w-10 border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-colors"
            data-click-feedback="off"
            data-interaction-feedback="explicit"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cancelRestTimer()}
            className="ml-2 text-muted-foreground hover:text-foreground border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-colors"
            data-click-feedback="off"
            data-interaction-feedback="explicit"
          >
            <span className="sr-only">Skip</span>
            <SkipForward className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">Skip</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
