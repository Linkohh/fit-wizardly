import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlayCircle, AlertTriangle, Lightbulb, ArrowLeftRight } from 'lucide-react';
import type { Plan, ExercisePrescription, Constraint } from '@/types/fitness';
import { MUSCLE_DATA } from '@/types/fitness';
import { useTranslation } from 'react-i18next';

interface WorkoutDayCardProps {
    day: Plan['workoutDays'][0];
    planId: string;
    onSwap: (target: { dayIndex: number; exerciseIndex: number; exercise: ExercisePrescription }) => void;
}

const getMuscleLabel = (id: string) => MUSCLE_DATA.find(m => m.id === id)?.name || id;

export function WorkoutDayCard({ day, planId, onSwap }: WorkoutDayCardProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Card className="hover:shadow-lg transition-shadow hover:border-primary/30">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent rounded-t-lg">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-primary">{day.name}</CardTitle>
                    <Button
                        variant="gradient"
                        size="sm"
                        className="gap-2"
                        onClick={() => navigate(`/workout/${planId}/${day.dayIndex}`)}
                    >
                        <PlayCircle className="h-4 w-4" />
                        {t('plan.workout_day.start_workout')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {(day.warmUp?.length || day.coolDown?.length) && (
                    <div className="mb-4 space-y-3">
                        {day.warmUp?.length ? (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t('plan.workout_day.warm_up', 'Warm-up')}
                                </p>
                                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                    {day.warmUp.map((item: string, index: number) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                        {day.coolDown?.length ? (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t('plan.workout_day.cool_down', 'Cool-down')}
                                </p>
                                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                    {day.coolDown.map((item: string, index: number) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                )}
                <div className="divide-y">
                    <div className="space-y-4">
                        {(() => {
                            // 1. Group exercises into logical chunks (Supersets or Single exercises)
                            const groupedExercises: { exercises: typeof day.exercises; isSuperset: boolean }[] = [];
                            let currentGroup: typeof day.exercises = [];

                            day.exercises.forEach((ex, i) => {
                                const prevEx = currentGroup[currentGroup.length - 1];
                                const isSameGroup = prevEx?.supersetGroup && ex.supersetGroup && prevEx.supersetGroup === ex.supersetGroup;

                                if (currentGroup.length === 0 || isSameGroup) {
                                    currentGroup.push(ex);
                                } else {
                                    groupedExercises.push({
                                        exercises: currentGroup,
                                        isSuperset: !!currentGroup[0].supersetGroup && currentGroup.length > 1
                                    });
                                    currentGroup = [ex];
                                }
                            });
                            // Push remaining
                            if (currentGroup.length > 0) {
                                groupedExercises.push({
                                    exercises: currentGroup,
                                    isSuperset: !!currentGroup[0].supersetGroup && currentGroup.length > 1
                                });
                            }

                            // 2. Render groups
                            return groupedExercises.map((group, groupIndex) => (
                                <div
                                    key={groupIndex}
                                    className={group.isSuperset ? "relative pl-6 border-l-4 border-l-primary/30 py-2 my-2 bg-gradient-to-r from-primary/5 to-transparent rounded-r-lg" : ""}
                                >
                                    {group.isSuperset && (
                                        <div className="absolute left-[-14px] top-1/2 -translate-y-1/2 bg-background border-2 border-primary/30 text-primary rounded-full p-1 z-10">
                                            <ArrowLeftRight className="h-4 w-4 rotate-90" />
                                        </div>
                                    )}
                                    {group.isSuperset && (
                                        <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 pl-2">
                                            Superset {group.exercises[0].supersetGroup}
                                        </div>
                                    )}

                                    <div className={group.isSuperset ? "space-y-4" : ""}>
                                        {group.exercises.map((ex, i) => {
                                            // Find original index for actions
                                            const originalIndex = day.exercises.findIndex(e => e === ex); // Identity check usually fine for mapped objs

                                            const hasCues = ex.exercise.cues && ex.exercise.cues.length > 0;
                                            const hasContraindications = ex.exercise.contraindications && ex.exercise.contraindications.length > 0;

                                            return (
                                                <Collapsible key={i} className="py-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-start gap-2">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium">{ex.exercise.name}</p>

                                                                    {/* Contraindication warning badge */}
                                                                    {hasContraindications && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger>
                                                                                    <Badge variant="outline" className="text-warning border-warning/50 gap-1 px-1.5">
                                                                                        <AlertTriangle className="h-3 w-3" />
                                                                                    </Badge>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="max-w-xs">
                                                                                    <p className="font-medium text-warning">{t('plan.workout_day.safety_note')}</p>
                                                                                    <p className="text-sm">
                                                                                        {t('plan.workout_day.not_suitable_for')}: {ex.exercise.contraindications.map((c: Constraint) =>
                                                                                            c.replace(/_/g, ' ')
                                                                                        ).join(', ')}
                                                                                    </p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {ex.exercise.primaryMuscles.map(getMuscleLabel).join(', ')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{t('plan.workout_day.sets', { count: ex.sets })}</Badge>
                                                            <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20">{t('plan.workout_day.reps', { range: ex.reps })}</Badge>
                                                            <Badge variant="outline">{t('plan.workout_day.rir', { count: ex.rir })}</Badge>
                                                            <Badge variant="outline">{t('plan.workout_day.rest', { seconds: ex.restSeconds })}</Badge>

                                                            {/* Expand cues button */}
                                                            {hasCues && (
                                                                <CollapsibleTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-muted-foreground hover:text-foreground">
                                                                        <Lightbulb className="h-3.5 w-3.5" />
                                                                        <span className="text-xs">{t('plan.workout_day.tips')}</span>
                                                                    </Button>
                                                                </CollapsibleTrigger>
                                                            )}

                                                            {/* Swap exercise button */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                                                                onClick={() => onSwap({ dayIndex: day.dayIndex, exerciseIndex: originalIndex, exercise: ex })}
                                                            >
                                                                <ArrowLeftRight className="h-3.5 w-3.5" />
                                                                <span className="text-xs">{t('plan.workout_day.swap')}</span>
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Collapsible coaching cues */}
                                                    <CollapsibleContent className="mt-2 space-y-2">
                                                        <div className="pl-0 sm:pl-4 py-2 px-3 bg-muted/30 rounded-lg border-l-2 border-primary/30">
                                                            <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                                                                <Lightbulb className="h-3 w-3" />
                                                                {t('plan.workout_day.coaching_cues')}
                                                            </p>
                                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                                {ex.exercise.cues?.map((cue: string, cueIndex: number) => (
                                                                    <li key={cueIndex} className="flex items-start gap-2">
                                                                        <span className="text-primary">•</span>
                                                                        <span>{cue}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Rationale for exercise selection */}
                                                        {ex.rationale && (
                                                            <div className="pl-0 sm:pl-4 py-2 px-3 bg-accent/10 rounded-lg border-l-2 border-accent/50">
                                                                <p className="text-xs font-medium text-accent-foreground/80 mb-1">
                                                                    {t('plan.workout_day.why_exercise')}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">{ex.rationale}</p>
                                                            </div>
                                                        )}
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
