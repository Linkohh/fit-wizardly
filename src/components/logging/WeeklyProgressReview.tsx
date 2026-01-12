import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    Calendar,
    Flame,
    Target,
    ChevronLeft,
    ChevronRight,
    Trophy,
    AlertCircle,
} from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import type { WeeklySummary, MuscleGroup } from '@/types/fitness';
import { cn } from '@/lib/utils';

interface WeeklyProgressReviewProps {
    planId: string;
}

export function WeeklyProgressReview({ planId }: WeeklyProgressReviewProps) {
    const [selectedWeek, setSelectedWeek] = useState(1);
    const { getWeeklySummary, currentPlan, preferredWeightUnit } = usePlanStore();

    const summary = getWeeklySummary(planId, selectedWeek);

    const formatVolume = (volume: number) => {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k`;
        }
        return volume.toFixed(0);
    };

    const getMuscleLabel = (id: MuscleGroup) => {
        const labels: Record<MuscleGroup, string> = {
            chest: 'Chest',
            front_deltoid: 'Front Delts',
            side_deltoid: 'Side Delts',
            rear_deltoid: 'Rear Delts',
            biceps: 'Biceps',
            triceps: 'Triceps',
            forearms: 'Forearms',
            abs: 'Abs',
            obliques: 'Obliques',
            quads: 'Quads',
            hip_flexors: 'Hip Flexors',
            adductors: 'Adductors',
            upper_back: 'Upper Back',
            lats: 'Lats',
            lower_back: 'Lower Back',
            glutes: 'Glutes',
            hamstrings: 'Hamstrings',
            calves: 'Calves',
            traps: 'Traps',
            neck: 'Neck',
        };
        return labels[id] || id;
    };

    if (!summary) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No data for Week {selectedWeek}</h3>
                    <p className="text-sm text-muted-foreground">
                        Complete workouts to see your weekly progress here.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const rirDiff = summary.avgRIR - summary.targetRIR;
    const rirStatus = Math.abs(rirDiff) <= 0.5 ? 'on-target' : rirDiff > 0 ? 'too-easy' : 'too-hard';

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full gradient-primary">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Week {selectedWeek} Summary</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {summary.startDate.toLocaleDateString()} - {summary.endDate.toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Week Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                            disabled={selectedWeek === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium w-12 text-center">
                            Week {selectedWeek}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedWeek(Math.min(4, selectedWeek + 1))}
                            disabled={selectedWeek === 4}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 space-y-6">
                {/* Completion Rate */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Workout Completion</span>
                        <span className="text-sm text-muted-foreground">
                            {summary.workoutsCompleted}/{summary.workoutsPlanned} workouts
                        </span>
                    </div>
                    <Progress
                        value={summary.completionRate}
                        className="h-3"
                    />
                    {summary.completionRate === 100 && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Perfect week! All planned workouts completed.
                        </p>
                    )}
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                        <p className="text-lg font-bold">{formatVolume(summary.totalVolume)}</p>
                        <p className="text-xs text-muted-foreground">{preferredWeightUnit} Volume</p>
                    </div>

                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <Target className="h-5 w-5 mx-auto text-primary mb-1" />
                        <p className={cn(
                            'text-lg font-bold',
                            rirStatus === 'on-target' && 'text-green-600',
                            rirStatus === 'too-easy' && 'text-blue-600',
                            rirStatus === 'too-hard' && 'text-orange-600',
                        )}>
                            {summary.avgRIR.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">Avg RIR (Target: {summary.targetRIR})</p>
                    </div>

                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <Trophy className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                        <p className="text-lg font-bold">{summary.personalRecords.length}</p>
                        <p className="text-xs text-muted-foreground">PRs This Week</p>
                    </div>
                </div>

                {/* RIR Status Message */}
                <div className={cn(
                    'p-3 rounded-lg flex items-start gap-2',
                    rirStatus === 'on-target' && 'bg-green-500/10 text-green-700 dark:text-green-400',
                    rirStatus === 'too-easy' && 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
                    rirStatus === 'too-hard' && 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
                )}>
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                        {rirStatus === 'on-target' && (
                            <>
                                <p className="font-medium">Perfect execution!</p>
                                <p className="opacity-80">You're hitting your target RIR consistently.</p>
                            </>
                        )}
                        {rirStatus === 'too-easy' && (
                            <>
                                <p className="font-medium">Room to push harder</p>
                                <p className="opacity-80">Consider increasing weight next week.</p>
                            </>
                        )}
                        {rirStatus === 'too-hard' && (
                            <>
                                <p className="font-medium">Pushing close to limits</p>
                                <p className="opacity-80">Great intensity, but ensure proper recovery.</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Muscle Group Breakdown */}
                {summary.muscleGroupBreakdown.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-3">Volume by Muscle Group</h4>
                        <div className="space-y-2">
                            {summary.muscleGroupBreakdown
                                .sort((a, b) => b.sets - a.sets)
                                .slice(0, 6)
                                .map((muscle) => (
                                    <div key={muscle.muscleGroup} className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-20 truncate">
                                            {getMuscleLabel(muscle.muscleGroup)}
                                        </span>
                                        <Progress
                                            value={Math.min(100, (muscle.sets / 20) * 100)}
                                            className="flex-1 h-2"
                                        />
                                        <span className="text-xs font-medium w-12 text-right">
                                            {muscle.sets} sets
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* Personal Records */}
                {summary.personalRecords.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            Personal Records
                        </h4>
                        <div className="space-y-2">
                            {summary.personalRecords.map((pr) => (
                                <div
                                    key={pr.id}
                                    className="flex items-center justify-between p-2 bg-yellow-500/10 rounded-lg"
                                >
                                    <span className="text-sm font-medium">{pr.exerciseName}</span>
                                    <Badge variant="secondary" className="bg-yellow-500/20">
                                        {pr.newValue} {pr.type === 'weight' ? preferredWeightUnit : ''}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
