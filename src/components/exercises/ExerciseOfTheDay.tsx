import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Trophy, Flame } from 'lucide-react';
import { Exercise, MuscleGroup } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getExerciseOfTheDay } from '@/lib/smart-recommendations';
import { MuscleSelector, MuscleHighlight } from '@/features/mcl';
import { getMclIdsForLegacyGroup } from '@/lib/muscleMapping';
import { EXERCISE_DATABASE } from '@/data/exercises';
import { cn } from '@/lib/utils';
import { getExerciseTheme, getThemeForCategory } from '@/lib/exerciseTheme';
import { format } from 'date-fns';

interface ExerciseOfTheDayProps {
    onSelect: (exercise: Exercise) => void;
}

export function ExerciseOfTheDay({ onSelect }: ExerciseOfTheDayProps) {
    const exercise = useMemo(() => getExerciseOfTheDay(EXERCISE_DATABASE), []);
    const theme = useMemo(() => {
        if (!exercise) return getThemeForCategory('default');
        return getExerciseTheme(exercise);
    }, [exercise]);

    // Map muscles to MCL highlights
    const highlights = useMemo(() => {
        if (!exercise) return [];
        const items: MuscleHighlight[] = [];

        // Primary muscles - high intensity focus
        exercise.primaryMuscles.forEach(group => {
            getMclIdsForLegacyGroup(group).forEach(id => {
                items.push({ muscleId: id, type: 'focus', intensity: 100 });
            });
        });

        // Secondary muscles - lower intensity
        exercise.secondaryMuscles.forEach(group => {
            getMclIdsForLegacyGroup(group).forEach(id => {
                items.push({ muscleId: id, type: 'focus', intensity: 50 });
            });
        });

        return items;
    }, [exercise]);

    // Simple heuristic for default view
    const defaultView = useMemo(() => {
        if (!exercise) return 'front';
        const backGroups: MuscleGroup[] = ['lats', 'traps', 'glutes', 'hamstrings', 'lower_back', 'calves', 'triceps', 'rear_deltoid', 'upper_back'];
        const hasBackMuscle = exercise.primaryMuscles.some(m => backGroups.includes(m));
        return hasBackMuscle ? 'back' : 'front';
    }, [exercise]);

    if (!exercise) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10 w-full"
        >
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500">
                    <Trophy className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Exercise of the Day
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-xs font-medium text-muted-foreground/60">
                    {format(new Date(), 'EEEE, MMM do')}
                </span>
            </div>

            <Card className="relative overflow-hidden border-0 bg-transparent group cursor-pointer" onClick={() => onSelect(exercise)}>
                {/* Background with glassmorphism and gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl" />

                {/* Adaptive Glow */}
                <div className={cn(
                    "absolute inset-0 opacity-20 transition-opacity duration-700 group-hover:opacity-40",
                    `bg-gradient-to-r ${theme.gradient}`
                )} />

                <CardContent className="relative p-0 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-0">
                    {/* Content Section */}
                    <div className="p-6 md:p-8 flex flex-col justify-center relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70 backdrop-blur-md">
                                    {exercise.category}
                                </Badge>
                                <Badge variant="outline" className={cn(
                                    "bg-white/5 border-white/10 backdrop-blur-md",
                                    exercise.difficulty === 'Beginner' ? 'text-emerald-400' :
                                        exercise.difficulty === 'Intermediate' ? 'text-yellow-400' : 'text-red-400'
                                )}>
                                    {exercise.difficulty}
                                </Badge>
                                {exercise.metabolic && (
                                    <div className="flex items-center gap-1 text-xs text-orange-400/80 font-medium ml-1">
                                        <Flame className="w-3 h-3" />
                                        <span>High Burn</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                                    {exercise.name}
                                </h3>
                                <p className="text-muted-foreground line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg">
                                    {exercise.description || exercise.steps?.[0] || 'Master this fundamental movement to build strength and stability.'}
                                </p>
                            </div>

                            <div className="pt-2 flex items-center gap-4">
                                <Button className={cn(
                                    "rounded-full px-6 shadow-lg shadow-black/20 transition-transform group-hover:scale-105",
                                    `bg-gradient-to-r ${theme.gradient} text-white border-0`
                                )}>
                                    Start Training <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Visual Section */}
                    <div className="relative h-48 md:h-auto min-h-[220px] overflow-hidden bg-black/20 flex items-center justify-center">
                        {/* Muscle Diagram Background */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full max-w-[240px] opacity-60 md:opacity-80 md:scale-110 md:translate-x-4 transition-transform duration-700 group-hover:scale-125 h-[120%]">
                            <MuscleSelector
                                defaultView={defaultView}
                                highlightedMuscles={highlights}
                                showSideView={false}
                                showSearch={false}
                                showLegend={false}
                                showInfoPanel={false}
                                showSelectionSidebar={false}
                                showPresets={false}
                                theme="dark"
                                width="100%"
                                height="100%"
                                className="bg-transparent"
                            />
                        </div>

                        {/* Image overlay if available, fading in */}
                        {exercise.imageUrl && (
                            <div className="absolute inset-0 mix-blend-overlay opacity-30 group-hover:opacity-10 transition-opacity duration-500">
                                <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover grayscale" />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/50 md:to-transparent" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
