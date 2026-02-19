import { useMemo } from 'react';
import { ArrowRight, Dumbbell } from 'lucide-react';
import { Exercise } from '@/types/fitness';
import { getRelatedExercises } from '@/lib/smart-recommendations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getExerciseTheme } from '@/lib/exerciseTheme';
import { useExerciseDatabase } from '@/lib/exerciseRepository';

interface RelatedExercisesProps {
    currentExercise: Exercise;
    onSelect: (exercise: Exercise) => void;
}

export function RelatedExercises({ currentExercise, onSelect }: RelatedExercisesProps) {
    const { exercises } = useExerciseDatabase();
    const related = useMemo(
        () => getRelatedExercises(currentExercise, exercises, 4),
        [currentExercise, exercises]
    );

    if (related.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((exercise) => {
                    const theme = getExerciseTheme(exercise);
                    return (
                        <div
                            key={exercise.id}
                            data-click-feedback="on"
                            className="group relative flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer overflow-hidden"
                            onClick={() => onSelect(exercise)}
                        >
                            {/* Hover Glow */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                                `bg-gradient-to-r ${theme.gradient}`
                            )} />

                            {/* Image Placeholder */}
                            <div className="relative w-16 h-16 shrink-0 rounded-md bg-black/40 overflow-hidden border border-white/5 flex items-center justify-center">
                                {exercise.imageUrl ? (
                                    <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <Dumbbell className={cn("w-6 h-6 opacity-40", theme.icon)} />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 z-10">
                                <h4 className="font-semibold text-sm text-white truncate group-hover:text-primary transition-colors">
                                    {exercise.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-white/10 text-muted-foreground">
                                        {exercise.equipment?.[0]?.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground capitalize">
                                        {exercise.difficulty}
                                    </span>
                                </div>
                            </div>

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
