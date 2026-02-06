import { useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, Dumbbell, Flame, Heart, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useExerciseInteraction } from '@/hooks/useExerciseInteraction';
import { useHaptics } from '@/hooks/useHaptics';
import { getExerciseTheme } from '@/lib/exerciseTheme';
import { cn } from '@/lib/utils';
import { Exercise } from '@/types/fitness';

interface ExerciseCardProps {
    exercise: Exercise;
    onClick: (exercise: Exercise) => void;
    index?: number;
    variant?: 'library' | 'recommended';
}

const DIFFICULTY_STYLES: Record<string, string> = {
    Beginner: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    Intermediate: 'bg-amber-500/20 text-amber-100 border-amber-400/30',
    Advanced: 'bg-red-500/20 text-red-100 border-red-400/30',
    Elite: 'bg-violet-500/20 text-violet-100 border-violet-400/30',
    'All Levels': 'bg-sky-500/20 text-sky-100 border-sky-400/30',
};

function formatToken(value: string) {
    return value.replaceAll('_', ' ');
}

export function ExerciseCard({ exercise, onClick, index = 0, variant = 'library' }: ExerciseCardProps) {
    const prefersReducedMotion = useReducedMotion();
    const { isFavorite, toggleFavorite } = usePreferencesStore();
    const { isTrending, trackView } = useExerciseInteraction();
    const haptics = useHaptics();

    const favorite = isFavorite(exercise.id);
    const trending = isTrending(exercise.id);
    const [isHovered, setIsHovered] = useState(false);
    const isRecommended = variant === 'recommended';

    const theme = useMemo(() => getExerciseTheme(exercise), [exercise]);

    const primaryMuscle = exercise.primaryMuscles[0] ? formatToken(exercise.primaryMuscles[0]) : 'full body';
    const primaryEquipment = exercise.equipment[0] ? formatToken(exercise.equipment[0]) : 'none';
    const estimatedCalories = exercise.metabolic ? Math.round((exercise.metabolic.met * 75 * 10) / 200) : null;
    const difficultyStyle = DIFFICULTY_STYLES[exercise.difficulty || 'Intermediate'] || 'bg-slate-500/20 text-slate-200 border-slate-400/30';

    const handleClick = useCallback(() => {
        haptics.light();
        trackView(exercise.id);
        onClick(exercise);
    }, [exercise, onClick, haptics, trackView]);

    const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.favoriteToggle();
        toggleFavorite(exercise.id);
    }, [exercise.id, haptics, toggleFavorite]);

    return (
        <motion.article
            layout
            initial={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : 10,
            }}
            animate={{
                opacity: 1,
                y: 0,
                transition: {
                    duration: prefersReducedMotion ? 0 : 0.25,
                    delay: prefersReducedMotion ? 0 : index * 0.03,
                    ease: 'easeOut',
                },
            }}
            whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={handleClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            data-click-feedback="on"
            className={cn(
                'group cursor-pointer h-full',
                isRecommended && 'snap-start'
            )}
            role="article"
            aria-label={`View details for ${exercise.name}`}
        >
            <Card
                className={cn(
                    'relative h-full overflow-hidden border transition-all duration-300',
                    'bg-gradient-to-b from-black/70 via-black/60 to-black/50 backdrop-blur-md',
                    'hover:border-white/25',
                    isRecommended
                        ? 'min-h-[322px] w-[280px] sm:w-[312px] lg:w-[336px] xl:w-[348px] border-white/15 rounded-3xl'
                        : 'min-h-[296px] w-full border-white/10 rounded-2xl'
                )}
                style={{
                    borderColor: isHovered ? theme.border : undefined,
                    boxShadow: isHovered ? `0 0 20px ${theme.glow}` : undefined,
                }}
            >
                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                        `bg-gradient-to-br ${theme.gradient}`
                    )}
                />

                <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10">
                    {exercise.imageUrl ? (
                        <img
                            src={exercise.imageUrl}
                            alt={exercise.name}
                            loading="lazy"
                            className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-95"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                            <Activity className={cn('h-12 w-12 text-white/20', theme.icon)} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                        <Badge
                            variant="outline"
                            className="border-white/20 bg-black/35 text-[10px] uppercase tracking-[0.12em] text-white/80"
                        >
                            {exercise.category || 'strength'}
                        </Badge>
                        <button
                            onClick={handleFavoriteToggle}
                            className={cn(
                                'rounded-full border border-white/20 bg-black/35 p-1.5 text-white/70 transition hover:text-white',
                                favorite && 'text-rose-400 border-rose-300/40'
                            )}
                            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
                        </button>
                    </div>

                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                        <Badge
                            variant="outline"
                            className={cn('text-[10px] uppercase tracking-[0.12em]', difficultyStyle)}
                        >
                            {exercise.difficulty || 'Intermediate'}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                            {trending && (
                                <Badge
                                    variant="outline"
                                    className="border-orange-300/40 bg-orange-500/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-orange-100"
                                >
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                    Trending
                                </Badge>
                            )}
                            {isRecommended && (
                                <Badge
                                    variant="outline"
                                    className="border-primary/35 bg-primary/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-primary-foreground"
                                >
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    Recommended
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <CardContent className="relative z-10 space-y-2.5 p-4">
                    <div className="space-y-1">
                        <h3
                            className={cn(
                                'line-clamp-1 font-bold text-white transition-colors group-hover:text-primary',
                                isRecommended ? 'text-[1.10rem] leading-[1.2]' : 'text-[1.02rem] leading-[1.25]'
                            )}
                        >
                            {exercise.name}
                        </h3>
                        <p className="max-w-[16ch] truncate text-xs uppercase tracking-[0.12em] text-white/55">
                            {primaryMuscle}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/80">
                            <Dumbbell className="h-3.5 w-3.5 text-primary/90" />
                            <span className="max-w-[120px] truncate capitalize">{primaryEquipment}</span>
                        </div>
                        {estimatedCalories !== null && (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/25 bg-orange-500/15 px-2.5 py-1 text-orange-100">
                                <Flame className="h-3.5 w-3.5 text-orange-300" />
                                <span>~{estimatedCalories} cal</span>
                            </div>
                        )}
                        {!exercise.metabolic && (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/65">
                                <Activity className="h-3.5 w-3.5 text-white/50" />
                                <span>{exercise.cues.length} cues</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px] uppercase tracking-[0.12em] text-white/45">
                        <span>{formatToken(exercise.category || 'strength')}</span>
                        <span>Tap to open</span>
                    </div>
                </CardContent>
            </Card>
        </motion.article>
    );
}
