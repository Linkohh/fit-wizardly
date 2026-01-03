import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MuscleGroup } from '@/types/fitness';
import { MUSCLE_DATA } from '@/types/fitness';
import { cn } from '@/lib/utils';

interface SelectedMusclesChipsProps {
    selectedMuscles: MuscleGroup[];
    onRemove: (muscleId: MuscleGroup) => void;
    onClearAll: () => void;
}

export function SelectedMusclesChips({ selectedMuscles, onRemove, onClearAll }: SelectedMusclesChipsProps) {
    if (selectedMuscles.length === 0) {
        return (
            <div className="flex items-center justify-center py-4 px-6 bg-muted/20 rounded-xl border border-dashed border-border/50">
                <p className="text-sm text-muted-foreground italic">
                    Click on the diagram or list to select muscles
                </p>
            </div>
        );
    }

    const getMuscleLabel = (id: MuscleGroup): string => {
        const muscle = MUSCLE_DATA.find(m => m.id === id);
        return muscle?.name || id.replace('_', ' ');
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                    {selectedMuscles.length} muscle{selectedMuscles.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearAll}
                    className="touch-target border-destructive/50 text-destructive hover:bg-destructive/10 h-7 text-xs px-2"
                >
                    Clear selections
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {selectedMuscles.map((muscleId) => (
                    <Badge
                        key={muscleId}
                        variant="secondary"
                        className={cn(
                            "group relative pl-3 pr-7 py-1.5 text-sm font-medium",
                            "bg-primary/10 hover:bg-primary/20 border-primary/30",
                            "text-primary transition-all duration-200",
                            "animate-in fade-in-0 zoom-in-95"
                        )}
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            {getMuscleLabel(muscleId)}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(muscleId);
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full opacity-60 hover:opacity-100 hover:bg-destructive/20 transition-all"
                            aria-label={`Remove ${getMuscleLabel(muscleId)}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    );
}
