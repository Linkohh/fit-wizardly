import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronUp, ChevronDown } from 'lucide-react';
import type { SetLog, WeightUnit } from '@/types/fitness';
import { cn } from '@/lib/utils';

interface SetLoggerProps {
    setNumber: number;
    targetReps: string;
    targetRIR: number;
    previousSet?: SetLog;
    defaultWeightUnit?: WeightUnit;
    onComplete: (setLog: SetLog) => void;
    isActive?: boolean;
}

export function SetLogger({
    setNumber,
    targetReps,
    targetRIR,
    previousSet,
    defaultWeightUnit = 'lbs',
    onComplete,
    isActive = false,
}: SetLoggerProps) {
    const [weight, setWeight] = useState(previousSet?.weight ?? 0);
    const [reps, setReps] = useState(previousSet?.reps ?? 0);
    const [rir, setRIR] = useState(previousSet?.rir ?? targetRIR);
    const [completed, setCompleted] = useState(previousSet?.completed ?? false);

    // Parse target reps range
    const repRange = targetReps.includes('-')
        ? targetReps.split('-').map(Number)
        : [Number(targetReps), Number(targetReps)];

    useEffect(() => {
        if (previousSet) {
            setWeight(previousSet.weight);
            setReps(previousSet.reps);
            setRIR(previousSet.rir);
            setCompleted(previousSet.completed);
        }
    }, [previousSet]);

    const handleComplete = () => {
        const setLog: SetLog = {
            setNumber,
            weight,
            weightUnit: defaultWeightUnit,
            reps,
            rir,
            completed: true,
        };
        setCompleted(true);
        onComplete(setLog);
    };

    const adjustWeight = (delta: number) => {
        const increment = defaultWeightUnit === 'lbs' ? 2.5 : 1;
        setWeight(Math.max(0, weight + delta * increment));
    };

    const adjustReps = (delta: number) => {
        setReps(Math.max(0, reps + delta));
    };

    const getRIRColor = () => {
        if (rir <= 1) return 'text-red-500';
        if (rir <= 2) return 'text-orange-500';
        if (rir <= 3) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getRIRLabel = () => {
        if (rir === 0) return 'Failure';
        if (rir === 1) return 'Very Hard';
        if (rir === 2) return 'Hard';
        if (rir === 3) return 'Moderate';
        if (rir === 4) return 'Easy';
        return 'Very Easy';
    };

    return (
        <div
            className={cn(
                'p-4 rounded-xl border transition-all duration-300',
                isActive
                    ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/10'
                    : completed
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-card/50 border-border/50'
            )}
        >
            {/* Set Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Badge
                        variant={completed ? 'default' : 'outline'}
                        className={cn(
                            'text-sm font-semibold',
                            completed && 'bg-green-500 hover:bg-green-600'
                        )}
                    >
                        Set {setNumber}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Target: {targetReps} @ RIR {targetRIR}
                    </span>
                </div>
                {completed && (
                    <Check className="h-5 w-5 text-green-500" />
                )}
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Weight Input */}
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                        Weight ({defaultWeightUnit})
                    </label>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => adjustWeight(-1)}
                            disabled={completed}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(Number(e.target.value))}
                            className="h-10 text-center text-lg font-semibold"
                            disabled={completed}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => adjustWeight(1)}
                            disabled={completed}
                        >
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Reps Input */}
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                        Reps
                    </label>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => adjustReps(-1)}
                            disabled={completed}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Input
                            type="number"
                            value={reps}
                            onChange={(e) => setReps(Number(e.target.value))}
                            className={cn(
                                'h-10 text-center text-lg font-semibold',
                                reps >= repRange[0] && reps <= repRange[1]
                                    ? 'text-green-600 dark:text-green-400'
                                    : reps < repRange[0]
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-blue-600 dark:text-blue-400'
                            )}
                            disabled={completed}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => adjustReps(1)}
                            disabled={completed}
                        >
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* RIR Slider */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-muted-foreground">RIR (Reps in Reserve)</label>
                    <span className={cn('text-sm font-semibold', getRIRColor())}>
                        {rir} - {getRIRLabel()}
                    </span>
                </div>
                <Slider
                    value={[rir]}
                    onValueChange={(value) => setRIR(value[0])}
                    min={0}
                    max={5}
                    step={1}
                    disabled={completed}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Failure</span>
                    <span>Target: {targetRIR}</span>
                    <span>Easy</span>
                </div>
            </div>

            {/* Complete Button */}
            {!completed && (
                <Button
                    onClick={handleComplete}
                    className="w-full gradient-primary text-white font-semibold"
                    disabled={weight === 0 || reps === 0}
                >
                    <Check className="h-4 w-4 mr-2" />
                    Complete Set
                </Button>
            )}
        </div>
    );
}
