import { Exercise } from '@/types/fitness';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef, useMemo, useState, useCallback, forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Flame, Heart, TrendingUp, ChevronRight } from 'lucide-react';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useExerciseInteraction } from '@/hooks/useExerciseInteraction';
import { useHaptics } from '@/hooks/useHaptics';
import { getExerciseTheme, getExerciseCardStyles } from '@/lib/exerciseTheme';
import { cn } from '@/lib/utils';

interface ExerciseCardProps {
    exercise: Exercise;
    onClick: (exercise: Exercise) => void;
    index?: number;
}

export const ExerciseCard = forwardRef<HTMLDivElement, ExerciseCardProps>(({ exercise, onClick, index = 0 }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, margin: '-50px' });
    const prefersReducedMotion = useReducedMotion();

    const { isFavorite, toggleFavorite } = usePreferencesStore();
    const { isTrending, trackView } = useExerciseInteraction();
    const haptics = useHaptics();

    const favorite = isFavorite(exercise.id);
    const trending = isTrending(exercise.id);

    const [isHovered, setIsHovered] = useState(false);

    const theme = useMemo(() => getExerciseTheme(exercise), [exercise]);
    const cardStyles = useMemo(() => getExerciseCardStyles(exercise), [exercise]);

    const difficultyConfig = useMemo(() => ({
        'Beginner': { class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
        'Intermediate': { class: 'bg-amber-500/15 text-amber-400 border-amber-500/25', dot: 'bg-amber-400' },
        'Advanced': { class: 'bg-red-500/15 text-red-400 border-red-500/25', dot: 'bg-red-400' },
        'Elite': { class: 'bg-purple-500/15 text-purple-400 border-purple-500/25', dot: 'bg-purple-400' },
        'All Levels': { class: 'bg-blue-500/15 text-blue-400 border-blue-500/25', dot: 'bg-blue-400' },
    }[exercise.difficulty || 'Intermediate'] || { class: 'bg-slate-500/15 text-slate-400', dot: 'bg-slate-400' }), [exercise.difficulty]);

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

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: prefersReducedMotion ? 0 : 16,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.35,
                delay: prefersReducedMotion ? 0 : index * 0.04,
                ease: 'easeOut' as const,
            },
        },
        hover: {
            y: prefersReducedMotion ? 0 : -3,
            transition: { duration: 0.2 },
        },
        exit: {
            opacity: 0,
            scale: 0.97,
        },
    };

    const primaryMuscle = exercise.primaryMuscles[0]?.replace('_', ' ');
    const equipmentLabel = exercise.equipment[0]?.replace('_', ' ') || 'Bodyweight';

    return (
        <motion.div
            ref={cardRef}
            layout
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            exit="exit"
            whileHover="hover"
            onClick={handleClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="group cursor-pointer h-full"
            role="article"
            aria-label={`View details for ${exercise.name}`}
        >
            <div
                className={cn(
                    'h-full rounded-xl bg-black/40 backdrop-blur-md border border-white/[0.06] transition-all duration-300 overflow-hidden relative',
                    'hover:border-white/[0.12]'
                )}
                style={isHovered ? cardStyles.hover : cardStyles.default}
            >
                {/* Top accent line */}
                <div
                    className="h-[2px] w-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(90deg, ${theme.glow}, ${theme.border}, transparent)` }}
                />

                {/* Subtle gradient overlay on hover */}
                <div
                    className={cn(
                        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
                        `bg-gradient-to-br ${theme.gradient}`
                    )}
                />

                {/* Card Content */}
                <div className="relative z-10 p-4 space-y-3">
                    {/* Header: Name + Difficulty */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[15px] text-white/95 group-hover:text-white transition-colors leading-tight line-clamp-1">
                                {exercise.name}
                            </h3>
                            <p className="text-[11px] text-white/40 mt-0.5 capitalize tracking-wide">
                                {exercise.category}
                                {primaryMuscle && <> &middot; {primaryMuscle}</>}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {trending && (
                                <Badge
                                    variant="outline"
                                    className="bg-orange-500/15 text-orange-400 border-orange-500/25 text-[9px] px-1.5 py-0"
                                >
                                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                    Hot
                                </Badge>
                            )}
                            <Badge
                                variant="outline"
                                className={cn('text-[9px] uppercase tracking-wider px-1.5 py-0 font-medium', difficultyConfig.class)}
                            >
                                {exercise.difficulty || 'Intermediate'}
                            </Badge>
                        </div>
                    </div>

                    {/* Metadata row */}
                    <div className="flex items-center gap-3 text-[11px] text-white/45">
                        <div className="flex items-center gap-1.5">
                            <Dumbbell className="w-3 h-3 shrink-0" />
                            <span className="capitalize truncate">{equipmentLabel}</span>
                        </div>
                        {exercise.metabolic && (
                            <div className="flex items-center gap-1" title="Estimated calorie burn">
                                <Flame className="w-3 h-3 text-orange-500/60 shrink-0" />
                                <span>~{(exercise.metabolic.met * 75 * 10 / 200).toFixed(0)} cal</span>
                            </div>
                        )}
                    </div>

                    {/* Muscle tags */}
                    <div className="flex flex-wrap gap-1">
                        {exercise.primaryMuscles.slice(0, 3).map((m) => (
                            <span
                                key={m}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/55 capitalize border border-white/[0.04]"
                            >
                                {m.replace('_', ' ')}
                            </span>
                        ))}
                        {exercise.primaryMuscles.length > 3 && (
                            <span className="text-[10px] px-2 py-0.5 text-white/30">
                                +{exercise.primaryMuscles.length - 3}
                            </span>
                        )}
                    </div>

                    {/* Footer: Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                        <motion.button
                            onClick={handleFavoriteToggle}
                            className={cn(
                                'p-1.5 rounded-md transition-colors',
                                favorite ? 'text-red-500' : 'text-white/25 hover:text-red-400'
                            )}
                            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                            whileTap={{ scale: 0.85 }}
                        >
                            <Heart
                                className={cn('w-4 h-4', favorite && 'fill-red-500')}
                            />
                        </motion.button>
                        <div className="flex items-center gap-1 text-[11px] text-white/30 group-hover:text-white/50 transition-colors">
                            <span>Details</span>
                            <ChevronRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
ExerciseCard.displayName = 'ExerciseCard';
