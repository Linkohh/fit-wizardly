import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft,
    Timer,
    Dumbbell,
    ChevronRight,
    ChevronLeft,
    X,
    Trophy,
    Flame,
    SkipForward,
} from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import { SetLogger } from './SetLogger';
import { WorkoutSummary } from './WorkoutSummary';
import { RestTimer } from './RestTimer';
import { WarmUpSets } from './WarmUpSets';
import { SupersetIndicator, getSupersetLabel } from './SupersetIndicator';
import type { PerceivedDifficulty, SetLog } from '@/types/fitness';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useHaptics } from '@/hooks/useHaptics';
import { NotificationType } from '@capacitor/haptics';
import { useReadinessStore } from '@/stores/readinessStore';
import { ReadinessCheck } from './ReadinessCheck';
import type { ReadinessEntry } from '@/types/readiness';

export function WorkoutLogger() {
    const { t } = useTranslation();
    const { planId, dayIndex } = useParams();
    const navigate = useNavigate();
    const haptics = useHaptics();
    const { getTodayLog } = useReadinessStore();

    const {
        getPlanById,
        activeWorkout,
        startWorkout,
        cancelWorkout,
        logSet,
        skipExercise,
        completeWorkout,
        preferredWeightUnit,
        getLastPerformance,
        startRestTimer,
    } = usePlanStore();

    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [completedLog, setCompletedLog] = useState<ReturnType<typeof completeWorkout>>(null);
    const [notes, setNotes] = useState('');
    const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
    const [showReadinessCheck, setShowReadinessCheck] = useState(false);
    const [readinessResolved, setReadinessResolved] = useState(false);
    const [readinessEntry, setReadinessEntry] = useState<ReadinessEntry | null>(null);

    const plan = planId ? getPlanById(planId) : null;
    const dayIndexNum = parseInt(dayIndex ?? '0', 10);

    // Use the extracted timer hook
    const { formattedTime } = useWorkoutTimer({
        startTime: activeWorkout?.startedAt ?? null,
        isActive: !!activeWorkout,
    });

    // Start workout on mount only after readiness check is resolved.
    useEffect(() => {
        if (!planId || activeWorkout) {
            return;
        }

        if (!readinessResolved) {
            const todayEntry = getTodayLog();
            if (todayEntry) {
                setReadinessEntry(todayEntry);
                setReadinessResolved(true);
            } else {
                setShowReadinessCheck(true);
            }
            return;
        }

        if (planId && !activeWorkout) {
            startWorkout(planId, dayIndexNum);
        }
    }, [planId, dayIndexNum, activeWorkout, startWorkout, getTodayLog, readinessResolved]);

    const handleReadinessComplete = (entry: ReadinessEntry) => {
        setReadinessEntry(entry);
        setShowReadinessCheck(false);
        setReadinessResolved(true);
    };

    const handleReadinessSkip = () => {
        setShowReadinessCheck(false);
        setReadinessResolved(true);
    };

    if (!plan) {
        return (
            <div className="container max-w-2xl mx-auto px-4 py-8">
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative bg-background border border-border p-4 rounded-full flex items-center justify-center h-full w-full">
                                <Dumbbell className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">{t('workout.loading')}</h2>
                        <p className="text-muted-foreground">{t('workout.preparing')}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!activeWorkout) {
        if (showReadinessCheck) {
            return (
                <ReadinessCheck
                    onComplete={handleReadinessComplete}
                    onSkip={handleReadinessSkip}
                />
            );
        }

        return (
            <div className="container max-w-2xl mx-auto px-4 py-8">
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative bg-background border border-border p-4 rounded-full flex items-center justify-center h-full w-full">
                                <Dumbbell className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">{t('workout.loading')}</h2>
                        <p className="text-muted-foreground">{t('workout.preparing')}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const workoutDay = plan.workoutDays[dayIndexNum];
    const currentExercise = activeWorkout.exercises[currentExerciseIndex];
    const prescription = workoutDay.exercises[currentExerciseIndex];

    const totalExercises = activeWorkout.exercises.length;
    const completedExercises = activeWorkout.exercises.filter(
        e => e.skipped || e.sets.every(s => s.completed)
    ).length;

    const handleSetComplete = (setLog: SetLog) => {
        logSet(currentExerciseIndex, setLog);

        // Superset Auto-Navigation Logic
        if (prescription.supersetGroup) {
            // Find all indices in this superset group
            const groupIndices = workoutDay.exercises
                .map((e, i) => e.supersetGroup === prescription.supersetGroup ? i : -1)
                .filter(i => i !== -1);

            if (groupIndices.length > 1) {
                // Determine next exercise in the loop (A -> B -> A)
                const currentGroupIndex = groupIndices.indexOf(currentExerciseIndex);
                const nextGroupIndex = (currentGroupIndex + 1) % groupIndices.length;
                const targetExerciseIndex = groupIndices[nextGroupIndex];

                // Only jump if the target has incomplete sets
                // (Prevents jumping to a fully completed exercise if sets are mismatched)
                const targetExercise = activeWorkout.exercises[targetExerciseIndex];
                const hasIncompleteSets = targetExercise.sets.some(s => !s.completed);

                if (hasIncompleteSets) {
                    setCurrentExerciseIndex(targetExerciseIndex);

                    // If moving forward in the superset (A -> B), we typically assume minimal rest.
                    // If looping back (B -> A), we might want the rest timer from B.
                    // For now, let's respect the rest timer of the *just completed* exercise 
                    // only if we are looping back (completing a full round).
                    if (nextGroupIndex > currentGroupIndex) {
                        return; // Skip rest timer for A -> B transition
                    }
                }
            }
        }

        // Start rest timer if needed
        // Logic: specific rest timer logic for non-superset or end-of-round
        const isLastSet = currentExerciseIndex === totalExercises - 1 &&
            currentExercise.sets.every((s, i) => i === setLog.setNumber - 1 || s.completed);

        // Don't start timer if it's the very last set of the workout
        if (!isLastSet) {
            startRestTimer(prescription.restSeconds);
        }
    };

    const handleSkipExercise = () => {
        haptics.impact('medium');
        skipExercise(currentExerciseIndex, 'User skipped');
        if (currentExerciseIndex < totalExercises - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
        }
    };

    const handleNextExercise = () => {
        haptics.impact('light');
        if (currentExerciseIndex < totalExercises - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
        }
    };

    const handlePrevExercise = () => {
        haptics.impact('light');
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(currentExerciseIndex - 1);
        }
    };



    const handleFinishWorkout = (difficulty?: PerceivedDifficulty) => {
        if (!difficulty) {
            haptics.impact('medium');
            setShowDifficultyDialog(true);
            return;
        }
        haptics.notification(NotificationType.Success); // Success type
        const log = completeWorkout(difficulty, notes);
        setCompletedLog(log);
        setShowSummary(true);
        setShowDifficultyDialog(false);
    };

    const handleCancel = () => {
        cancelWorkout();
        navigate('/plan');
    };

    const allSetsCompleted = currentExercise?.sets.every(s => s.completed) || currentExercise?.skipped;
    const isLastExercise = currentExerciseIndex === totalExercises - 1;
    const allExercisesCompleted = completedExercises === totalExercises;
    const lastPerformance = getLastPerformance(currentExercise.exerciseId);

    if (showSummary && completedLog) {
        return (
            <WorkoutSummary
                log={completedLog}
                plan={plan}
                onClose={() => navigate('/plan')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
                <div className="container max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCancelDialog(true)}
                            className="shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">{t('workout.cancel')}</span>
                        </Button>

                        <div className="flex items-center gap-2 text-base sm:text-lg font-mono">
                            <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <span className="font-semibold">{formattedTime}</span>
                        </div>

                        <Badge variant="outline" className="font-semibold shrink-0">
                            {completedExercises}/{totalExercises}
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="bg-background/95 border-b border-border/50">
                <div className="container max-w-2xl mx-auto px-4 py-2">
                    <Progress
                        value={(completedExercises / totalExercises) * 100}
                        className="h-2"
                    />
                </div>
            </div>

            {/* Main Content */}
            {/* Main Content */}
            <main className="container max-w-2xl mx-auto px-4 py-6 pb-32">
                {/* Workout Title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1">{workoutDay.name}</h1>
                    <p className="text-muted-foreground">
                        Week {plan.rirProgression[0]?.week ?? 1} • Target RIR: {prescription.rir}
                    </p>
                    {readinessEntry && readinessEntry.overallScore < 2.5 && (
                        <div className="mt-3 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-sm text-orange-200">
                            Consider a lighter session today — reduce volume by 20%.
                        </div>
                    )}
                </div>

                {/* Warm-Up Sets (only for first compound exercise) */}
                {currentExerciseIndex === 0 && lastPerformance && (
                    <WarmUpSets
                        workingWeight={Math.max(...lastPerformance.sets.map(s => s.weight || 0))}
                        weightUnit={preferredWeightUnit}
                        exerciseName={prescription.exercise.name}
                    />
                )}

                {/* Exercise Card */}
                {/* Exercise Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevExercise}
                        disabled={currentExerciseIndex === 0}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <div className="text-center">
                        <h2 className="text-xl font-bold">{prescription.exercise.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {currentExerciseIndex + 1} of {totalExercises}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextExercise}
                        disabled={currentExerciseIndex === totalExercises - 1}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>

                {/* Set Logger */}
                <div className="space-y-4">
                    {currentExercise.sets.map((set, idx) => (
                        <SetLogger
                            key={idx}
                            setNumber={set.setNumber}
                            targetReps={prescription.reps}
                            targetRIR={prescription.rir}
                            previousSet={
                                idx > 0 ? currentExercise.sets[idx - 1] : undefined
                            }
                            lastPerformance={lastPerformance?.sets[idx]}
                            defaultWeightUnit={preferredWeightUnit}
                            onComplete={handleSetComplete}
                            isActive={!set.completed && currentExercise.sets.slice(0, idx).every(s => s.completed)}
                        />
                    ))}
                </div>

                {/* Buttons */}
                <div className="mt-8 flex justify-center gap-4">
                    <Button variant="outline" onClick={handleSkipExercise}>
                        <SkipForward className="mr-2 h-4 w-4" />
                        {t('workout.skip_exercise', 'Skip Exercise')}
                    </Button>
                </div>

                {/* Notes */}
                <div className="mt-6">
                    <label className="text-sm font-medium mb-2 block">{t('workout.notes')}</label>
                    <Textarea
                        placeholder={t('workout.notes_placeholder')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="resize-none"
                        rows={3}
                    />
                </div>

                {/* Cancel Dialog */}
                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('workout.cancel_dialog_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('workout.cancel_dialog_desc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('workout.cancel_dialog_continue')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                                {t('workout.cancel_dialog_confirm')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Difficulty Rating Dialog */}
                <AlertDialog open={showDifficultyDialog} onOpenChange={setShowDifficultyDialog}>
                    <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('workout.difficulty_title', 'How was the workout?')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('workout.difficulty_desc', 'Rate the overall perceived difficulty.')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-2 py-4">
                            {[
                                { value: 'too_easy', label: 'Too Easy', color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600' },
                                { value: 'just_right', label: 'Just Right', color: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600' },
                                { value: 'challenging', label: 'Challenging', color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600' },
                                { value: 'too_hard', label: 'Too Hard', color: 'bg-red-500/10 hover:bg-red-500/20 text-red-600' },
                            ].map((option) => (
                                <Button
                                    key={option.value}
                                    variant="ghost"
                                    className={cn("w-full justify-between h-12", option.color)}
                                    onClick={() => handleFinishWorkout(option.value as PerceivedDifficulty)}
                                >
                                    <span>{option.label}</span>
                                </Button>
                            ))}
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </main>

            {/* Rest Timer Overlay */}
            <RestTimer />
        </div >
    );
}

export default WorkoutLogger;
