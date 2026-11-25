import { useState, useEffect, useId } from 'react';
import { PlateCalculatorDialog } from '@/components/tools/PlateCalculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LabelledSlider } from '@/components/a11y/LabelledSlider';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronUp, ChevronDown } from 'lucide-react';
import type { SetLog, WeightUnit } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { calculateOneRepMax } from '@/lib/progressionEngine';
import { useKeyboard } from '@/hooks/useKeyboard';

interface SetLoggerProps {
    setNumber: number;
    targetReps: string;
    targetRIR: number;
    /** The set before this one; used to prefill weight, reps and effort. */
    previousSet?: SetLog;
    /** This set's own saved log, if any. A completed log shows the set as done (e.g. after a reload). */
    loggedSet?: SetLog;
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
    loggedSet,
    lastPerformance,
    defaultWeightUnit = 'lbs',
    onComplete,
    isActive = false,
}: SetLoggerProps) {
    // Native keyboard (contract #10): scrolls the focused field into view; does nothing on the web.
    const keyboard = useKeyboard();
    const savedLog = loggedSet?.completed ? loggedSet : undefined;
    const seed = savedLog ?? previousSet;
    const [weight, setWeight] = useState(seed?.weight ?? lastPerformance?.weight ?? 0);
    const [reps, setReps] = useState(seed?.reps ?? lastPerformance?.reps ?? 0);
    const [rir, setRIR] = useState(seed?.rir ?? targetRIR);
    const [effortMode, setEffortMode] = useState<'rir' | 'rpe'>(seed?.effortMode ?? 'rir');
    const [rpe, setRPE] = useState<number>(seed?.rpe ?? Math.max(6, Math.min(10, 10 - (seed?.rir ?? targetRIR))));
    // previousSet is the set before this one (a prefill hint), never this set's own log,
    // so its `completed` flag must not carry over. Copying it locked every second set.
    const [completed, setCompleted] = useState(Boolean(savedLog));
    const fieldId = useId();
    const weightInputId = `${fieldId}-weight`;
    const repsInputId = `${fieldId}-reps`;

    // Parse target reps range
    const repRange = targetReps.includes('-')
        ? targetReps.split('-').map(Number)
        : [Number(targetReps), Number(targetReps)];

    // Follow this set's saved log when the caller provides one (it changes when the logger
    // moves to another exercise and reuses this component).
    useEffect(() => {
        if (!loggedSet) return;
        if (loggedSet.completed) {
            setWeight(loggedSet.weight);
            setReps(loggedSet.reps);
            setRIR(loggedSet.rir);
            setEffortMode(loggedSet.effortMode ?? 'rir');
            setRPE(loggedSet.rpe ?? Math.max(6, Math.min(10, 10 - loggedSet.rir)));
            setCompleted(true);
        } else {
            setCompleted(false);
        }
    }, [loggedSet]);

    // Prefill from the previous set until this set is logged; a logged set keeps its own values.
    useEffect(() => {
        // A saved log wins; both effects run in the same commit when the row is reused.
        if (previousSet && !completed && !loggedSet?.completed) {
            setWeight(previousSet.weight);
            setReps(previousSet.reps);
            setRIR(previousSet.rir);
            setEffortMode(previousSet.effortMode ?? 'rir');
            setRPE(previousSet.rpe ?? Math.max(6, Math.min(10, 10 - previousSet.rir)));
        }
    }, [previousSet, completed, loggedSet]);

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
        // -700 shades in light theme for WCAG AA contrast; the label text carries the meaning too.
        if (displayRIR <= 1) return 'text-red-700 dark:text-red-400';
        if (displayRIR <= 2) return 'text-orange-700 dark:text-orange-400';
        if (displayRIR <= 3) return 'text-amber-700 dark:text-yellow-400';
        return 'text-green-700 dark:text-green-400';
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
            role="group"
            aria-label={`Set ${setNumber}`}
            // Room below "Complete Set" so the open keyboard can't cover it.
            style={keyboard.isOpen ? { paddingBottom: keyboard.height } : undefined}
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
                    <Check className="h-5 w-5 text-green-500" role="img" aria-label="Set completed" />
                )}
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Weight Input */}
                <div>
                    <label htmlFor={weightInputId} className="text-xs text-muted-foreground mb-1 block">
                        Weight ({defaultWeightUnit})
                    </label>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0"
                            onClick={() => adjustWeight(-1)}
                            disabled={completed}
                            aria-label="Decrease weight"
                        >
                            <ChevronDown className="h-6 w-6" />
                        </Button>
                        <div className="relative">
                            <Input
                                id={weightInputId}
                                type="number"
                                inputMode="decimal"
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
                            aria-label="Increase weight"
                        >
                            <ChevronUp className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                {/* Reps Input */}
                <div>
                    <label htmlFor={repsInputId} className="text-xs text-muted-foreground mb-1 block">
                        Reps
                    </label>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0"
                            onClick={() => adjustReps(-1)}
                            disabled={completed}
                            aria-label="Decrease reps"
                        >
                            <ChevronDown className="h-6 w-6" />
                        </Button>
                        <Input
                            id={repsInputId}
                            type="number"
                            inputMode="numeric"
                            value={reps}
                            onChange={(e) => setReps(Number(e.target.value))}
                            className={cn(
                                'h-12 text-center text-xl font-semibold px-0',
                                reps >= repRange[0] && reps <= repRange[1]
                                    ? 'text-green-700 dark:text-green-400'
                                    : reps < repRange[0]
                                        ? 'text-amber-700 dark:text-yellow-400'
                                        : 'text-blue-700 dark:text-blue-400'
                            )}
                            disabled={completed}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 shrink-0"
                            onClick={() => adjustReps(1)}
                            disabled={completed}
                            aria-label="Increase reps"
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
                            aria-pressed={effortMode === 'rir'}
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
                            aria-pressed={effortMode === 'rpe'}
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
                <LabelledSlider
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
                    thumbLabel={effortMode === 'rir' ? 'Reps in reserve' : 'Rate of perceived exertion'}
                    thumbValueText={`${effortMode === 'rir' ? rir : rpe.toFixed(1)} - ${getRIRLabel()}`}
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
