import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { RIRProgression } from '@/types/fitness';

interface PeriodizationTimelineProps {
    progression: RIRProgression[];
    currentWeek: number;
}

function getIntensityClass(index: number, total: number) {
    if (total <= 1) return 'bg-primary/70 text-primary-foreground';
    const ratio = index / (total - 1);
    if (ratio < 0.34) return 'bg-primary/55 text-primary-foreground';
    if (ratio < 0.67) return 'bg-primary/75 text-primary-foreground';
    return 'bg-primary text-primary-foreground';
}

export function PeriodizationTimeline({ progression, currentWeek }: PeriodizationTimelineProps) {
    const { t } = useTranslation();

    const normalized = useMemo(() => {
        if (progression.length > 0) return progression;
        return Array.from({ length: 4 }, (_, i) => ({
            week: i + 1,
            targetRIR: 2,
            isDeload: false,
        }));
    }, [progression]);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                {normalized.map((item, index) => {
                    const isCurrent = item.week === currentWeek;
                    return (
                        <div
                            key={item.week}
                            className={cn(
                                'relative rounded-lg border p-3 transition-all',
                                item.isDeload
                                    ? 'border-primary/25 bg-primary/15 text-foreground'
                                    : getIntensityClass(index, normalized.length),
                                isCurrent && 'ring-2 ring-primary animate-pulse'
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide">
                                    {t('plan.progression.week_label', { week: item.week })}
                                </span>
                                {item.isDeload && (
                                    <span className="rounded-full border border-primary/25 bg-background/50 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                        {t('plan.progression.deload')}
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-sm font-semibold">
                                {t('plan.progression.rir_label', { count: item.targetRIR })}
                            </p>
                            {item.isDeload && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('plan.progression.recovery', 'Recovery')}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
