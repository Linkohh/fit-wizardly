import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Trophy, Flame, Zap } from 'lucide-react';
import { Exercise, MuscleGroup as LegacyMuscleGroup } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getExerciseOfTheDay } from '@/lib/smart-recommendations';
import { MuscleSelector, MuscleHighlight, ViewType, Muscle, MuscleGroup as MclMuscleGroup, getMuscleGroupColor, getMuscleGroupName } from '@/features/mcl';
import { getMclIdsForLegacyGroup } from '@/lib/muscleMapping';
import { cn } from '@/lib/utils';
import { getExerciseTheme, getThemeForCategory } from '@/lib/exerciseTheme';
import { format } from 'date-fns';
import { MiniViewToggle } from './MiniViewToggle';
import { useThemeStore } from '@/stores/themeStore';
import { useExerciseDatabase } from '@/lib/exerciseRepository';

interface ExerciseOfTheDayProps {
    onSelect: (exercise: Exercise) => void;
}

interface AnatomyFocusState {
    origin: string;
    scale: number;
}

const BASE_ANATOMY_FOCUS: AnatomyFocusState = {
    origin: '50% 52%',
    scale: 1.16,
};

const GROUP_FOCUS_PROFILE: Record<MclMuscleGroup, { y: number; scale: number }> = {
    chest: { y: 31, scale: 1.34 },
    back: { y: 32, scale: 1.34 },
    shoulders: { y: 26, scale: 1.4 },
    arms: { y: 40, scale: 1.33 },
    core: { y: 50, scale: 1.3 },
    glutes: { y: 61, scale: 1.28 },
    legs: { y: 73, scale: 1.34 },
    calves: { y: 83, scale: 1.38 },
};

function getDirectionalX(muscleId: string): number {
    if (muscleId.includes('left')) return 36;
    if (muscleId.includes('right')) return 64;
    return 50;
}

function resolveAnatomyFocus(view: ViewType, muscle: Muscle | null): AnatomyFocusState {
    if (!muscle) return BASE_ANATOMY_FOCUS;

    const profile = GROUP_FOCUS_PROFILE[muscle.group];
    const directionalX = getDirectionalX(muscle.id);
    const viewOffsetY = view === 'back' ? 1 : 0;

    return {
        origin: `${directionalX}% ${profile.y + viewOffsetY}%`,
        scale: profile.scale,
    };
}

export function ExerciseOfTheDay({ onSelect }: ExerciseOfTheDayProps) {
    const themeMode = useThemeStore((state) => state.mode);
    const { exercises } = useExerciseDatabase();
    const exercise = useMemo(() => {
        if (exercises.length === 0) return null;
        return getExerciseOfTheDay(exercises);
    }, [exercises]);
    const theme = useMemo(() => {
        if (!exercise) return getThemeForCategory('default');
        return getExerciseTheme(exercise);
    }, [exercise]);
    const reduceMotion = useReducedMotion();

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
    const defaultView = useMemo((): ViewType => {
        if (!exercise) return 'front';

        const frontGroups: LegacyMuscleGroup[] = ['chest', 'abs', 'obliques', 'quads', 'biceps', 'front_deltoid', 'forearms'];
        const backGroups: LegacyMuscleGroup[] = ['lats', 'traps', 'glutes', 'hamstrings', 'lower_back', 'calves', 'rear_deltoid', 'upper_back'];

        // Check primary muscles
        const hasFrontMuscle = exercise.primaryMuscles.some(m => frontGroups.includes(m));
        const hasBackMuscle = exercise.primaryMuscles.some(m => backGroups.includes(m));

        if (hasFrontMuscle && !hasBackMuscle) return 'front';
        if (!hasFrontMuscle && hasBackMuscle) return 'back';

        // If mixed, prioritize Front for chest/abs/quads
        if (hasFrontMuscle && hasBackMuscle) {
            if (exercise.primaryMuscles.includes('chest') ||
                exercise.primaryMuscles.includes('abs') ||
                exercise.primaryMuscles.includes('quads')) return 'front';
            return 'back';
        }

        // Default relative to id logic or fallback
        return 'front';
    }, [exercise]);

    // View state for anatomy toggle (initialized with smart default)
    const [currentView, setCurrentView] = useState<ViewType>(defaultView);
    const [hoveredMuscle, setHoveredMuscle] = useState<Muscle | null>(null);

    // Calculate total muscle count for badge
    const muscleCount = highlights.length;
    const anatomyFocus = useMemo(
        () => resolveAnatomyFocus(currentView, hoveredMuscle),
        [currentView, hoveredMuscle]
    );

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
                    <div className="relative min-h-[240px] overflow-hidden px-4 py-5 md:min-h-[420px]">
                        {/* Themed Glow Halo */}
                        <div
                            className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                            style={{
                                background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${theme.glow} 0%, transparent 70%)`
                            }}
                        />

                        {/* Muscles Engaged Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                            className="absolute top-4 right-4 z-20"
                        >
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                                "bg-black/40 backdrop-blur-md border border-white/10",
                                "shadow-lg"
                            )}
                            style={{
                                boxShadow: `0 0 20px ${theme.glow}, 0 4px 12px rgba(0,0,0,0.3)`
                            }}
                            >
                                <Zap className="w-3 h-3 text-purple-400" />
                                <span className="text-white/90">{muscleCount} muscles</span>
                            </div>
                        </motion.div>

                        {/* Muscle Diagram */}
                        <div
                            className="absolute inset-x-4 top-2 bottom-14 md:bottom-18 z-10 flex items-end justify-center"
                            onMouseLeave={() => setHoveredMuscle(null)}
                        >
                            <div className="relative h-full w-full max-w-[370px]">
                                <motion.div
                                    className="h-full w-full will-change-transform"
                                    style={{ transformOrigin: anatomyFocus.origin }}
                                    animate={{ scale: anatomyFocus.scale }}
                                    transition={
                                        reduceMotion
                                            ? { duration: 0 }
                                            : { type: 'spring', stiffness: 250, damping: 28, mass: 0.55 }
                                    }
                                >
                                    <MuscleSelector
                                        defaultView={currentView}
                                        highlightedMuscles={highlights}
                                        animateHighlights={true}
                                        hoverIntensity="strong"
                                        showHeader={false}
                                        showSideView={false}
                                        showSearch={false}
                                        showLegend={false}
                                        showTooltip={false}
                                        showInfoPanel={false}
                                        showSelectionSidebar={false}
                                        showPresets={false}
                                        theme={themeMode}
                                        width="100%"
                                        height="100%"
                                        onMuscleHover={(muscle) => {
                                            setHoveredMuscle(muscle);
                                        }}
                                        className="bg-transparent"
                                    />
                                </motion.div>
                            </div>
                        </div>

                        {/* Fixed hover indicator (non-intrusive) */}
                        <AnimatePresence>
                            {hoveredMuscle && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.16, ease: 'easeOut' }}
                                    className="pointer-events-none absolute left-4 top-4 z-20 max-w-[min(70%,280px)] rounded-2xl border border-white/20 bg-black/55 px-3 py-2.5 backdrop-blur-md shadow-xl shadow-black/35"
                                >
                                    <div className="mb-0.5 flex items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: getMuscleGroupColor(hoveredMuscle.group) }}
                                        />
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/65">
                                            {getMuscleGroupName(hoveredMuscle.group)}
                                        </span>
                                    </div>
                                    <p className="truncate text-[15px] font-semibold leading-tight text-white">
                                        {hoveredMuscle.name}
                                    </p>
                                    <p className="truncate text-xs italic leading-tight text-white/65">
                                        {hoveredMuscle.scientificName}
                                    </p>
                                    <p className="mt-0.5 text-[11px] font-medium text-white/45">
                                        Click for details
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Image overlay if available, fading in */}
                        {exercise.imageUrl && (
                            <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20 group-hover:opacity-10 transition-opacity duration-500">
                                <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover grayscale" />
                            </div>
                        )}

                        {/* Mini View Toggle */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                            <MiniViewToggle
                                currentView={currentView}
                                onViewChange={setCurrentView}
                            />
                        </div>

                        {/* Gradient fade to content */}
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/60 md:to-background/40 pointer-events-none" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
