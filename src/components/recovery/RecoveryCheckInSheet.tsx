import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useReadinessStore } from '@/stores/readinessStore';
import type { ReadinessRating } from '@/types/readiness';

interface RecoveryCheckInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MetricSelectorProps {
  label: string;
  emojis: string[];
  value: ReadinessRating;
  onChange: (value: ReadinessRating) => void;
}

function MetricSelector({ label, emojis, value, onChange }: MetricSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex gap-2">
        {emojis.map((emoji, index) => {
          const rating = (index + 1) as ReadinessRating;
          const isSelected = value === rating;
          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`flex-1 py-2.5 rounded-xl text-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'bg-primary/20 ring-2 ring-primary scale-110'
                  : 'bg-muted/40 hover:bg-muted/70 hover:scale-105'
              }`}
              aria-label={`${label} ${rating}`}
              aria-pressed={isSelected}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RecoveryCheckInSheet({ open, onOpenChange }: RecoveryCheckInSheetProps) {
  const { t } = useTranslation();
  const { logReadiness } = useReadinessStore();

  const [sleepQuality, setSleepQuality] = useState<ReadinessRating>(3);
  const [muscleSoreness, setMuscleSoreness] = useState<ReadinessRating>(3);
  const [energyLevel, setEnergyLevel] = useState<ReadinessRating>(3);
  const [stressLevel, setStressLevel] = useState<ReadinessRating>(3);

  const handleLog = () => {
    logReadiness({ sleepQuality, muscleSoreness, energyLevel, stressLevel });
    // Reset to neutral for next time
    setSleepQuality(3);
    setMuscleSoreness(3);
    setEnergyLevel(3);
    setStressLevel(3);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display text-xl">
            {t('recovery.title', "Today's Readiness")}
          </SheetTitle>
          <SheetDescription>
            {t('recovery.how_feeling', 'How are you feeling?')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-4">
          <MetricSelector
            label={t('recovery.sleep_quality', 'Sleep Quality')}
            emojis={['😴', '😕', '😐', '😊', '⭐']}
            value={sleepQuality}
            onChange={setSleepQuality}
          />
          <MetricSelector
            label={t('recovery.muscle_soreness', 'Muscle Soreness')}
            emojis={['💪', '😊', '😐', '😬', '🛑']}
            value={muscleSoreness}
            onChange={setMuscleSoreness}
          />
          <MetricSelector
            label={t('recovery.energy_level', 'Energy Level')}
            emojis={['🪫', '😪', '😐', '😊', '⚡']}
            value={energyLevel}
            onChange={setEnergyLevel}
          />
          <MetricSelector
            label={t('recovery.stress_level', 'Stress Level')}
            emojis={['😌', '😊', '😐', '😟', '😰']}
            value={stressLevel}
            onChange={setStressLevel}
          />
        </div>

        <SheetFooter className="pt-2">
          <Button
            className="w-full"
            onClick={handleLog}
          >
            {t('recovery.log_readiness', 'Log Readiness')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
