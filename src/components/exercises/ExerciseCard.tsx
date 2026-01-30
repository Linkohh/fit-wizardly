import { Exercise } from '@/types/fitness';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef, useMemo, useState, useCallback, forwardRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Flame, Activity, Heart, TrendingUp } from 'lucide-react';
import QuickActions from './QuickActions';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useExerciseInteraction } from '@/hooks/useExerciseInteraction';
import { useHaptics } from '@/hooks/useHaptics';
import { getExerciseTheme, getExerciseCardStyles } from '@/lib/exerciseTheme';
import { cn } from '@/lib/utils';

interface ExerciseCardProps {
    exercise: Exercise;
    onClick: (exercise: Exercise) => void;
    index?: number; // For staggered animations
}

export const ExerciseCard = forwardRef<HTMLDivElement, ExerciseCardProps>(({ exercise, onClick, index = 0 }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, margin: '-50px' });
    const prefersReducedMotion = useReducedMotion();

    // Stores and hooks
    const { isFavorite, toggleFavorite } = usePreferencesStore();
    const { isTrending, trackView } = useExerciseInteraction();
    const haptics = useHaptics();

    const favorite = isFavorite(exercise.id);
    const trending = isTrending(exercise.id);

    // Hover state for adaptive glow
    const [isHovered, setIsHovered] = useState(false);

    // Get theme colors based on exercise category/type
    const theme = useMemo(() => getExerciseTheme(exercise), [exercise]);
    const cardStyles = useMemo(() => getExerciseCardStyles(exercise), [exercise]);

    // Determine difficulty color
    const difficultyColor = useMemo(() => ({
        'Beginner': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'Intermediate': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'Advanced': 'bg-red-500/20 text-red-300 border-red-500/30',
        'Elite': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'All Levels': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    }[exercise.difficulty || 'Intermediate'] || 'bg-slate-500/20 text-slate-300'), [exercise.difficulty]);

    // Handle card click
    const handleClick = useCallback(() => {
        haptics.light();
        trackView(exercise.id);
        onClick(exercise);
    }, [exercise, onClick, haptics, trackView]);

    // Handle favorite toggle
    const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.favoriteToggle();
        toggleFavorite(exercise.id);
    }, [exercise.id, haptics, toggleFavorite]);

    // Animation variants
    const cardVariants = {
        hidden: {
            opacity: 0,
            y: prefersReducedMotion ? 0 : 20,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                delay: prefersReducedMotion ? 0 : index * 0.05,
                ease: 'easeOut' as const,
            },
        },
        hover: {
            y: prefersReducedMotion ? 0 : -5,
            transition: { duration: 0.2 },
        },
        exit: {
            opacity: 0,
            scale: 0.95,
        },
    };

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
            <Card
                className={cn(
                    'h-full bg-black/40 backdrop-blur-md border-white/5 transition-all duration-300 overflow-hidden relative',
                    'hover:border-opacity-50'
                )}
                style={isHovered ? cardStyles.hover : cardStyles.default}
            >
                {/* Adaptive gradient glow effect on hover */}
                <div
                    className={cn(
                        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                        `bg-gradient-to-br ${theme.gradient}`
                    )}
                />

                <CardHeader className="p-4 pb-2 relative z-10">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">
                                {exercise.name}
                            </h3>
                            <p className="text-xs text-muted-foreground capitalize">
                                {exercise.category} • {exercise.primaryMuscles[0]?.replace('_', ' ')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {trending && (
                                <Badge
                                    variant="outline"
                                    className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[9px] px-1.5"
                                >
                                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                    Hot
                                </Badge>
                            )}
                            <Badge
                                variant="outline"
                                className={cn('text-[10px] uppercase tracking-wider', difficultyColor)}
                            >
                                {exercise.difficulty || 'Inter'}
                            </Badge>
                        </div>
                    </div>
                    {/* Favorite button */}
                    <motion.button
                        onClick={handleFavoriteToggle}
                        className={cn(
                            'absolute top-4 right-4 z-20 transition-colors',
                            favorite ? 'text-red-500' : 'text-white/50 hover:text-red-500'
                        )}
                        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Heart
                            className={cn('w-5 h-5', favorite && 'fill-red-500')}
                        />
                    </motion.button>
                </CardHeader>

                <CardContent className="p-4 pt-2 relative z-10 space-y-3">
                    {/* Visual Preview Placeholder */}
                    <div
                        className={cn(
                            'w-full h-32 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center overflow-hidden transition-colors',
                            'group-hover:border-opacity-20'
                        )}
                        style={{
                            borderColor: isHovered ? theme.border : undefined,
                        }}
                    >
                        {exercise.imageUrl ? (
                            <img
                                src={exercise.imageUrl}
                                alt={exercise.name}
                                loading="lazy"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        ) : (
                            <Activity
                                className={cn(
                                    'w-8 h-8 text-white/10 group-hover:text-primary/40 transition-colors',
                                    theme.icon
                                )}
                            />
                        )}
                        <QuickActions
                            exerciseId={exercise.id}
                            exerciseName={exercise.name}
                            isVisible={isHovered}
                            onAddToWorkout={() => { }}
                            onCompare={() => { }}
                        />
                    </div>

                    {/* Metrics / Info */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" />
                            <span className="capitalize text-nowrap truncate max-w-[80px]">
                                {exercise.equipment[0]?.replace('_', ' ') || 'None'}
                            </span>
                        </div>
                        {exercise.metabolic && (
                            <div className="flex items-center gap-1" title="Metabolic Equivalent">
                                <Flame className="w-3 h-3 text-orange-500/70" />
                                <span>~{(exercise.metabolic.met * 75 * 10 / 200).toFixed(0)} cal</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
});
ExerciseCard.displayName = 'ExerciseCard';
