import { Check, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MuscleData, MuscleGroup } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface MuscleListProps {
    muscles: MuscleData[];
    selectedMuscles: MuscleGroup[];
    onToggle: (muscleId: MuscleGroup) => void;
    hoveredMuscle?: MuscleGroup | null;
    onHover?: (muscleId: MuscleGroup | null) => void;
}

function MuscleListComponent({ muscles, selectedMuscles, onToggle, hoveredMuscle, onHover }: MuscleListProps) {
    return (
        <ScrollArea className="h-[380px] w-full pr-2">
            <div className="flex flex-col gap-2" role="group" aria-label="Muscle selection list">
                {muscles.map((muscle) => {
                    const isSelected = selectedMuscles.includes(muscle.id);
                    const isHovered = hoveredMuscle === muscle.id;

                    return (
                        <button
                            key={muscle.id}
                            onClick={() => onToggle(muscle.id)}
                            onMouseEnter={() => onHover?.(muscle.id)}
                            onMouseLeave={() => onHover?.(null)}
                            onFocus={() => onHover?.(muscle.id)}
                            onBlur={() => onHover?.(null)}
                            className={cn(
                                "group relative w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 border",
                                "min-h-[48px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                                isSelected
                                    ? "bg-primary/15 border-primary/50 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                                    : isHovered
                                        ? "bg-accent/10 border-accent/40"
                                        : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-accent/5"
                            )}
                            aria-pressed={isSelected}
                        >
                            <div className="flex items-center gap-3">
                                {/* Selection Indicator Checkbox */}
                                <div className={cn(
                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                                    isSelected
                                        ? "bg-primary border-primary"
                                        : isHovered
                                            ? "border-accent bg-accent/10"
                                            : "border-muted-foreground/40 group-hover:border-primary/60"
                                )}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3]" />}
                                </div>

                                {/* Muscle Name */}
                                <span className={cn(
                                    "font-medium text-sm transition-colors",
                                    isSelected
                                        ? "text-primary"
                                        : isHovered
                                            ? "text-accent-foreground"
                                            : "text-foreground"
                                )}>
                                    {muscle.name}
                                </span>
                            </div>

                            {/* Status Indicators */}
                            <div className="flex items-center gap-2">
                                {isHovered && !isSelected && (
                                    <span className="text-xs text-accent italic animate-in fade-in-0 slide-in-from-right-2">
                                        Click to select
                                    </span>
                                )}
                                {isSelected && (
                                    <div className="flex items-center gap-1 text-xs font-medium text-primary">
                                        <Sparkles className="w-3 h-3" />
                                        <span className="hidden sm:inline">Selected</span>
                                    </div>
                                )}
                            </div>

                            {/* Left Border Indicator for Selected */}
                            {isSelected && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </ScrollArea>
    );
}

export const MuscleList = memo(MuscleListComponent);
