import { useState, useEffect } from 'react';
import { PlateCalculatorDialog } from '@/components/tools/PlateCalculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronUp, ChevronDown } from 'lucide-react';
import type { SetLog, WeightUnit } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { calculateOneRepMax } from '@/lib/progressionEngine';

interface SetLoggerProps {
    setNumber: number;
    targetReps: string;
    targetRIR: number;
    previousSet?: SetLog;
    lastPerformance?: SetLog;
    defaultWeightUnit?: WeightUnit;
    onComplete: (setLog: SetLog) => void;
    isActive?: boolean;
}

export function SetLogger({
    setNumber,
    targetReps,
    targetRIR,
    previousSet,
    lastPerformance,
    defaultWeightUnit = 'lbs',
    onComplete,
    isActive = false,
}: SetLoggerProps) {
    const [weight, setWeight] = useState(previousSet?.weight ?? lastPerformance?.weight ?? 0);
    const [reps, setReps] = useState(previousSet?.reps ?? lastPerformance?.reps ?? 0);
    const [rir, setRIR] = useState(previousSet?.rir ?? targetRIR);
    const [effortMode, setEffortMode] = useState<'rir' | 'rpe'>(previousSet?.effortMode ?? 'rir');
    const [rpe, setRPE] = useState<number>(previousSet?.rpe ?? Math.max(6, Math.min(10, 10 - targetRIR)));
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
            setEffortMode(previousSet.effortMode ?? 'rir');
            setRPE(previousSet.rpe ?? Math.max(6, Math.min(10, 10 - previousSet.rir)));
            setCompleted(previousSet.completed);
        }
    }, [previousSet]);

    const handleComplete = () => {
        const derivedRIR = effortMode === 'rpe'
            ? Math.max(0, Math.min(5, Math.round((10 - rpe) * 2) / 2))
            : rir;

        const setLog: SetLog = {
            setNumber,
            weight,
            weightUnit: defaultWeightUnit,
            reps,
            rir: derivedRIR,
            rpe: effortMode === 'rpe' ? rpe : undefined,
            effortMode,
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
        const displayRIR = effortMode === 'rpe'
            ? Math.max(0, Math.min(5, Math.round((10 - rpe) * 2) / 2))
            : rir;
        if (displayRIR <= 1) return 'text-red-500';
        if (displayRIR <= 2) return 'text-orange-500';
        if (displayRIR <= 3) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getRIRLabel = () => {
        const displayRIR = effortMode === 'rpe'
            ? Math.max(0, Math.min(5, Math.round((10 - rpe) * 2) / 2))
            : rir;
        if (displayRIR === 0) return 'Failure';
        if (displayRIR === 1) return 'Very Hard';
        if (displayRIR === 2) return 'Hard';
        if (displayRIR === 3) return 'Moderate';
        if (displayRIR === 4) return 'Easy';
        return 'Very Easy';
    };

    const estimatedOneRepMax =
        completed && weight > 0 && reps > 0 ? Math.round(calculateOneRepMax(weight, reps)) : null;

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
                <div className="flex flex-col gap-1">
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
                    {lastPerformance && (
                        <span className="text-xs text-muted-foreground/80 pl-1">
                            Last: {lastPerformance.weight} {lastPerformance.weightUnit} × {lastPerformance.reps}
                        </span>
                    )}
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
                            className="h-12 w-12 shrink-0"
                            onClick={() => adjustWeight(-1)}
                            disabled={completed}
                        >
                            <ChevronDown className="h-6 w-6" />
                        </Button>
                        <div className="relative">
                            <Input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="h-12 w-20 text-center text-xl font-semibold px-0 z-10"
                                disabled={completed}
                            />
                            {/* Calculator Integration */}
                            {!completed && weight >= 45 && (
                                <div className="absolute -top-3 -right-3 z-20">
                                    <PlateCalculatorDialog initialWeight={weight} weightUnit={defaultWeightUnit} />
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0"
                            onClick={() => adjustWeight(1)}
                            disabled={completed}
                        >
                            <ChevronUp className="h-6 w-6" />
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
                            className="h-12 w-12 shrink-0"
                            onClick={() => adjustReps(-1)}
                            disabled={completed}
                        >
                            <ChevronDown className="h-6 w-6" />
                        </Button>
                        <Input
                            type="number"
                            value={reps}
                            onChange={(e) => setReps(Number(e.target.value))}
                            className={cn(
                                'h-12 text-center text-xl font-semibold px-0',
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
                            className="h-12 w-12 shrink-0"
                            onClick={() => adjustReps(1)}
                            disabled={completed}
                        >
                            <ChevronUp className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Effort Mode */}
            <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Effort Mode</label>
                    <div className="flex rounded-md border border-border/60 p-1">
                        <Button
                            type="button"
                            size="sm"
                            variant={effortMode === 'rir' ? 'default' : 'ghost'}
                            className="h-7 px-3 text-xs"
                            onClick={() => setEffortMode('rir')}
                            disabled={completed}
                        >
                            RIR
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={effortMode === 'rpe' ? 'default' : 'ghost'}
                            className="h-7 px-3 text-xs"
                            onClick={() => setEffortMode('rpe')}
                            disabled={completed}
                        >
                            RPE
                        </Button>
                    </div>
                </div>
            </div>

            {/* RIR / RPE Slider */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-muted-foreground">
                        {effortMode === 'rir' ? 'RIR (Reps in Reserve)' : 'RPE (Rate of Perceived Exertion)'}
                    </label>
                    <span className={cn('text-sm font-semibold', getRIRColor())}>
                        {effortMode === 'rir' ? `${rir}` : `${rpe.toFixed(1)} RPE`} - {getRIRLabel()}
                    </span>
                </div>
                <Slider
                    value={[effortMode === 'rir' ? rir : rpe]}
                    onValueChange={(value) => {
                        if (effortMode === 'rir') {
                            setRIR(value[0]);
                            return;
                        }
                        setRPE(value[0]);
                    }}
                    min={effortMode === 'rir' ? 0 : 6}
                    max={effortMode === 'rir' ? 5 : 10}
                    step={effortMode === 'rir' ? 1 : 0.5}
                    disabled={completed}
                    className="w-full"
                    aria-label={`Effort: ${effortMode === 'rir' ? rir : rpe} - ${getRIRLabel()}`}
                    aria-valuetext={getRIRLabel()}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    {effortMode === 'rir' ? (
                        <>
                            <span>Failure</span>
                            <span>Target: {targetRIR}</span>
                            <span>Easy</span>
                        </>
                    ) : (
                        <>
                            <span>6.0</span>
                            <span>High Effort</span>
                            <span>10.0</span>
                        </>
                    )}
                </div>
            </div>

            {estimatedOneRepMax !== null && (
                <div className="mb-3">
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                        Est. 1RM: {estimatedOneRepMax} {defaultWeightUnit}
                    </Badge>
                </div>
            )}

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
