import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Flame, Check } from 'lucide-react';
import type { WeightUnit } from '@/types/fitness';

interface WarmUpSetsProps {
    workingWeight: number;
    weightUnit: WeightUnit;
    exerciseName: string;
}

/**
 * Smart warm-up set calculator.
 * Shows progressive ramp-up sets: 50% x 10, 70% x 5, 90% x 2
 */
export function WarmUpSets({ workingWeight, weightUnit, exerciseName }: WarmUpSetsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [completedSets, setCompletedSets] = useState<number[]>([]);

    // Calculate warm-up weights
    const warmUpSets = [
        { percent: 50, reps: 10, weight: Math.round(workingWeight * 0.5 / 5) * 5 },
        { percent: 70, reps: 5, weight: Math.round(workingWeight * 0.7 / 5) * 5 },
        { percent: 90, reps: 2, weight: Math.round(workingWeight * 0.9 / 5) * 5 },
    ];

    const toggleSet = (index: number) => {
        setCompletedSets(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const allCompleted = completedSets.length === warmUpSets.length;

    if (workingWeight <= 0) return null;

    return (
        <div className="mb-4 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/5 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-orange-500/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        allCompleted ? "bg-green-500/20" : "bg-orange-500/20"
                    )}>
                        <Flame className={cn("w-5 h-5", allCompleted ? "text-green-500" : "text-orange-500")} />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-sm">Warm-Up Sets</div>
                        <div className="text-xs text-muted-foreground">
                            {allCompleted ? 'All done!' : `For ${exerciseName}`}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {allCompleted && (
                        <span className="text-xs text-green-500 font-medium">✓ Ready</span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Warm-up set list */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                    {warmUpSets.map((set, index) => (
                        <button
                            key={index}
                            onClick={() => toggleSet(index)}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                                completedSets.includes(index)
                                    ? "bg-green-500/10 border-green-500/30"
                                    : "bg-background/50 border-border/50 hover:border-orange-500/30"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                    completedSets.includes(index)
                                        ? "bg-green-500 text-white"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {completedSets.includes(index) ? <Check className="w-4 h-4" /> : `W${index + 1}`}
                                </div>
                                <div className="text-left">
                                    <div className="font-medium text-sm">
                                        {set.weight} {weightUnit} × {set.reps} reps
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {set.percent}% of working weight
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                    <p className="text-xs text-muted-foreground text-center pt-2">
                        Tap each set when complete
                    </p>
                </div>
            )}
        </div>
    );
}
