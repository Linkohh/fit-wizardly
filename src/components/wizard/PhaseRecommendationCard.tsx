import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PHASE_INFO } from '@/lib/wizardConstants';

interface PhaseRecommendationCardProps {
  phaseKey: string;
}

export function PhaseRecommendationCard({ phaseKey }: PhaseRecommendationCardProps) {
  const currentPhase = PHASE_INFO[phaseKey as keyof typeof PHASE_INFO] || PHASE_INFO.stabilization_endurance;

  return (
    <section className={cn(
      'rounded-[1.75rem] border p-6 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.55)]',
      currentPhase.border,
      currentPhase.bg,
    )}>
      <div className="flex items-start gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background/60', currentPhase.color)}>
          <Target className="h-5 w-5" />
        </div>

        <div className="min-w-0 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Recommended program
          </p>
          <div>
            <h3 className={cn('text-xl font-semibold tracking-tight', currentPhase.color)}>
              {currentPhase.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {currentPhase.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
