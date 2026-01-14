import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PHASE_INFO } from '@/lib/wizardConstants';

interface PhaseRecommendationCardProps {
  phaseKey: string;
}

export function PhaseRecommendationCard({ phaseKey }: PhaseRecommendationCardProps) {
  const currentPhase = PHASE_INFO[phaseKey as keyof typeof PHASE_INFO] || PHASE_INFO.stabilization_endurance;

  return (
    <div className="mt-8 pt-6 border-t animate-in slide-in-from-bottom-4 fade-in duration-500">
      <Card className={cn("border-l-4 shadow-md overflow-hidden", currentPhase.border, currentPhase.bg)}>
        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className={cn("p-3 rounded-full shrink-0 bg-background/50", currentPhase.color)}>
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">Recommended Program</span>
            </div>
            <h3 className={cn("text-lg font-bold", currentPhase.color)}>{currentPhase.title}</h3>
            <p className="text-sm text-muted-foreground max-w-xl">{currentPhase.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
