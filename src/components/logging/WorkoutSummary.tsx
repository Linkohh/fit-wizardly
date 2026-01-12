import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Trophy,
    Timer,
    Flame,
    TrendingUp,
    CheckCircle2,
    Medal,
    Share2,
    Home,
} from 'lucide-react';
import type { WorkoutLog, Plan } from '@/types/fitness';
import { usePlanStore } from '@/stores/planStore';
import { cn } from '@/lib/utils';

interface WorkoutSummaryProps {
    log: WorkoutLog;
    plan: Plan;
    onClose: () => void;
}

export function WorkoutSummary({ log, plan, onClose }: WorkoutSummaryProps) {
    const { personalRecords, preferredWeightUnit } = usePlanStore();

    // Get PRs from this workout
    const workoutPRs = personalRecords.filter(pr => pr.workoutLogId === log.id);

    // Calculate stats
    const completedSets = log.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
        0
    );
    const totalSets = log.exercises.reduce(
        (acc, ex) => acc + ex.sets.length,
        0
    );
    const skippedExercises = log.exercises.filter(ex => ex.skipped).length;

    // Calculate average RIR
    let totalRIR = 0;
    let rirCount = 0;
    for (const ex of log.exercises) {
        for (const set of ex.sets) {
            if (set.completed) {
                totalRIR += set.rir;
                rirCount++;
            }
        }
    }
    const avgRIR = rirCount > 0 ? totalRIR / rirCount : 0;

    // Get target RIR from plan
    const targetRIR = plan.rirProgression[0]?.targetRIR ?? 2;

    const formatVolume = (volume: number) => {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k`;
        }
        return volume.toFixed(0);
    };

    const getDifficultyEmoji = () => {
        switch (log.perceivedDifficulty) {
            case 'too_easy': return '😎';
            case 'just_right': return '💪';
            case 'challenging': return '🔥';
            case 'too_hard': return '😤';
            default: return '💪';
        }
    };

    const getDifficultyLabel = () => {
        switch (log.perceivedDifficulty) {
            case 'too_easy': return 'Too Easy';
            case 'just_right': return 'Just Right';
            case 'challenging': return 'Challenging';
            case 'too_hard': return 'Too Hard';
            default: return 'Completed';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
            {/* Celebration Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-pink-500/20 blur-3xl" />
                <div className="relative container max-w-2xl mx-auto px-4 py-12 text-center">
                    <div className="animate-bounce-slow">
                        <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Workout Complete! 🎉</h1>
                    <p className="text-lg text-muted-foreground">{log.dayName}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Primary Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="text-center">
                        <CardContent className="p-4">
                            <Timer className="h-6 w-6 mx-auto text-primary mb-2" />
                            <p className="text-2xl font-bold">{log.duration}</p>
                            <p className="text-xs text-muted-foreground">Minutes</p>
                        </CardContent>
                    </Card>

                    <Card className="text-center">
                        <CardContent className="p-4">
                            <Flame className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                            <p className="text-2xl font-bold">{formatVolume(log.totalVolume)}</p>
                            <p className="text-xs text-muted-foreground">{preferredWeightUnit} Volume</p>
                        </CardContent>
                    </Card>

                    <Card className="text-center">
                        <CardContent className="p-4">
                            <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                            <p className="text-2xl font-bold">{completedSets}/{totalSets}</p>
                            <p className="text-xs text-muted-foreground">Sets</p>
                        </CardContent>
                    </Card>
                </div>

                {/* RIR Performance */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            RIR Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Average RIR</span>
                            <span className={cn(
                                'font-semibold',
                                Math.abs(avgRIR - targetRIR) <= 0.5
                                    ? 'text-green-500'
                                    : avgRIR < targetRIR
                                        ? 'text-orange-500'
                                        : 'text-blue-500'
                            )}>
                                {avgRIR.toFixed(1)} (Target: {targetRIR})
                            </span>
                        </div>
                        <Progress
                            value={(avgRIR / 5) * 100}
                            className="h-3"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {Math.abs(avgRIR - targetRIR) <= 0.5
                                ? '✅ Perfect execution! You hit your target RIR.'
                                : avgRIR < targetRIR
                                    ? '💪 You pushed hard! Consider this for next week.'
                                    : '🎯 Room to push harder next time!'}
                        </p>
                    </CardContent>
                </Card>

                {/* Personal Records */}
                {workoutPRs.length > 0 && (
                    <Card className="border-yellow-500/50 bg-yellow-500/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Medal className="h-5 w-5 text-yellow-500" />
                                Personal Records! 🏆
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {workoutPRs.map((pr) => (
                                    <div
                                        key={pr.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10"
                                    >
                                        <div>
                                            <p className="font-semibold">{pr.exerciseName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {pr.type === 'weight' ? 'Weight PR' : 'Volume PR'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                                {pr.newValue} {pr.type === 'weight' ? preferredWeightUnit : ''}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                +{(pr.newValue - pr.previousValue).toFixed(1)} from {pr.previousValue}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Difficulty */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{getDifficultyEmoji()}</span>
                                <div>
                                    <p className="font-semibold">How it felt</p>
                                    <p className="text-sm text-muted-foreground">{getDifficultyLabel()}</p>
                                </div>
                            </div>
                            {skippedExercises > 0 && (
                                <Badge variant="secondary">
                                    {skippedExercises} skipped
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                {log.notes && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{log.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            // TODO: Implement share functionality
                            console.log('Share workout');
                        }}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    <Button
                        className="flex-1 gradient-primary text-white font-semibold"
                        onClick={onClose}
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Done
                    </Button>
                </div>
            </main>

            {/* Confetti animation placeholder */}
            <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
        </div>
    );
}
