import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReadinessStore } from '@/stores/readinessStore';
import { RecoveryCheckInSheet } from './RecoveryCheckInSheet';
import type { ReadinessEntry } from '@/types/readiness';

interface ScoreBand {
  labelKey: string;
  fallback: string;
  color: string;
}

function getScoreBand(score: number): ScoreBand {
  if (score < 2.5) {
    return { labelKey: 'recovery.band_rest', fallback: 'Rest Day', color: '#ef4444' };
  }
  if (score < 3.5) {
    return { labelKey: 'recovery.band_moderate', fallback: 'Train Light', color: '#f59e0b' };
  }
  return { labelKey: 'recovery.band_ready', fallback: 'Ready', color: '#22c55e' };
}

interface LoggedViewProps {
  entry: ReadinessEntry;
}

function LoggedView({ entry }: LoggedViewProps) {
  const { t } = useTranslation();
  const band = getScoreBand(entry.overallScore);
  const displayScore = Math.round(entry.overallScore * 20);

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ backgroundColor: band.color }}
        aria-label={`Readiness score: ${displayScore}`}
      >
        {displayScore}
      </div>
      <div>
        <p className="text-sm font-semibold">{t(band.labelKey, band.fallback)}</p>
        <p className="text-xs text-muted-foreground">
          {t('recovery.title', "Today's Readiness")}
        </p>
      </div>
    </div>
  );
}

export function ReadinessCard() {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { hasLoggedToday, getTodayLog } = useReadinessStore();

  const logged = hasLoggedToday();
  const todayLog = getTodayLog();

  return (
    <>
      <Card variant="glass" className="rounded-3xl p-4">
        {logged && todayLog ? (
          <LoggedView entry={todayLog} />
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                {t('recovery.title', "Today's Readiness")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('recovery.how_feeling', 'How are you feeling?')}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => setSheetOpen(true)}
            >
              {t('recovery.check_in', 'Check In')}
            </Button>
          </div>
        )}
      </Card>

      <RecoveryCheckInSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
