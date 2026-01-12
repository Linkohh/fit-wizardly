import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Check,
    X,
    Trophy,
    Flame,
} from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import { SetLogger } from './SetLogger';
import { WorkoutSummary } from './WorkoutSummary';
import type { PerceivedDifficulty, SetLog } from '@/types/fitness';
import { cn } from '@/lib/utils';
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

export function WorkoutLogger() {
    const { planId, dayIndex } = useParams();
    const navigate = useNavigate();

    const {
        getPlanById,
        activeWorkout,
        startWorkout,
        cancelWorkout,
        logSet,
        skipExercise,
        completeWorkout,
        preferredWeightUnit,
    } = usePlanStore();

    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [completedLog, setCompletedLog] = useState<ReturnType<typeof completeWorkout>>(null);
    const [notes, setNotes] = useState('');

    const plan = planId ? getPlanById(planId) : null;
    const dayIndexNum = parseInt(dayIndex ?? '0', 10);

    // Start workout on mount
    useEffect(() => {
        if (planId && !activeWorkout) {
            startWorkout(planId, dayIndexNum);
        }
    }, [planId, dayIndexNum, activeWorkout, startWorkout]);

    // Timer
    useEffect(() => {
        if (!activeWorkout) return;

        const interval = setInterval(() => {
            const start = new Date(activeWorkout.startedAt).getTime();
            const now = Date.now();
            setElapsedTime(Math.floor((now - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [activeWorkout]);

    if (!plan || !activeWorkout) {
        return (
            <div className="container max-w-2xl mx-auto px-4 py-8">
                <Card>
                    <CardContent className="p-8 text-center">
                        <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Loading workout...</h2>
                        <p className="text-muted-foreground">Getting your workout ready</p>
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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSetComplete = (setLog: SetLog) => {
        logSet(currentExerciseIndex, setLog);
    };

    const handleSkipExercise = () => {
        skipExercise(currentExerciseIndex, 'User skipped');
        if (currentExerciseIndex < totalExercises - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
        }
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < totalExercises - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
        }
    };

    const handlePrevExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(currentExerciseIndex - 1);
        }
    };

    const handleFinishWorkout = (difficulty: PerceivedDifficulty) => {
        const log = completeWorkout(difficulty, notes);
        setCompletedLog(log);
        setShowSummary(true);
    };

    const handleCancel = () => {
        cancelWorkout();
        navigate('/plan');
    };

    const allSetsCompleted = currentExercise?.sets.every(s => s.completed) || currentExercise?.skipped;
    const isLastExercise = currentExerciseIndex === totalExercises - 1;
    const allExercisesCompleted = completedExercises === totalExercises;

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
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCancelDialog(true)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>

                        <div className="flex items-center gap-2 text-lg font-mono">
                            <Timer className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{formatTime(elapsedTime)}</span>
                        </div>

                        <Badge variant="outline" className="font-semibold">
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
            <main className="container max-w-2xl mx-auto px-4 py-6">
                {/* Workout Title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1">{workoutDay.name}</h1>
                    <p className="text-muted-foreground">
                        Week {plan.rirProgression[0]?.week ?? 1} • Target RIR: {prescription.rir}
                    </p>
                </div>

                {/* Exercise Card */}
                <Card className="mb-6 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <Badge variant="secondary" className="mb-2">
                                    Exercise {currentExerciseIndex + 1} of {totalExercises}
                                </Badge>
                                <CardTitle className="text-xl">
                                    {prescription.exercise.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {prescription.sets} sets × {prescription.reps} reps • Rest {prescription.restSeconds}s
                                </p>
                            </div>
                            {currentExercise.skipped ? (
                                <Badge className="bg-yellow-500">Skipped</Badge>
                            ) : allSetsCompleted ? (
                                <Badge className="bg-green-500">Complete</Badge>
                            ) : null}
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                        {currentExercise.skipped ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <X className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
                                <p>Exercise skipped</p>
                            </div>
                        ) : (
                            currentExercise.sets.map((set, idx) => (
                                <SetLogger
                                    key={idx}
                                    setNumber={idx + 1}
                                    targetReps={prescription.reps}
                                    targetRIR={prescription.rir}
                                    previousSet={set.completed ? set : undefined}
                                    defaultWeightUnit={preferredWeightUnit}
                                    onComplete={handleSetComplete}
                                    isActive={!set.completed && currentExercise.sets.slice(0, idx).every(s => s.completed)}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <Button
                        variant="outline"
                        onClick={handlePrevExercise}
                        disabled={currentExerciseIndex === 0}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    {!currentExercise.skipped && !allSetsCompleted && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSkipExercise}
                            className="text-muted-foreground"
                        >
                            Skip Exercise
                        </Button>
                    )}

                    {isLastExercise && allExercisesCompleted ? (
                        <Button
                            className="gradient-primary text-white font-semibold"
                            onClick={() => handleFinishWorkout('just_right')}
                        >
                            <Trophy className="h-4 w-4 mr-2" />
                            Finish Workout
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNextExercise}
                            disabled={isLastExercise}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>

                {/* Quick Finish (if all done) */}
                {allExercisesCompleted && !isLastExercise && (
                    <Card className="bg-green-500/10 border-green-500/30">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Flame className="h-8 w-8 text-green-500" />
                                <div className="flex-1">
                                    <p className="font-semibold">All exercises complete!</p>
                                    <p className="text-sm text-muted-foreground">Ready to finish your workout</p>
                                </div>
                                <Button
                                    className="gradient-primary text-white"
                                    onClick={() => handleFinishWorkout('just_right')}
                                >
                                    Finish
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notes */}
                <div className="mt-6">
                    <label className="text-sm font-medium mb-2 block">Workout Notes</label>
                    <Textarea
                        placeholder="How did the workout feel? Any issues?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="resize-none"
                        rows={3}
                    />
                </div>
            </main>

            {/* Cancel Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Workout?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your progress will be lost. Are you sure you want to cancel this workout?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Workout</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                            Cancel Workout
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default WorkoutLogger;
