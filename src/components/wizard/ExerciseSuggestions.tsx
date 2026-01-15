import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Sparkles, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { suggestExercises } from '@/lib/suggestExercises';
import type { MuscleGroup, Equipment, Exercise } from '@/types/fitness';
import { cn } from '@/lib/utils';

interface ExerciseSuggestionsProps {
    muscles: MuscleGroup[];
    equipment: Equipment[];
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    className?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 25,
        },
    },
};

export function ExerciseSuggestions({
    muscles,
    equipment,
    experienceLevel = 'intermediate',
    className,
}: ExerciseSuggestionsProps) {
    const { t } = useTranslation();

    const suggestions = useMemo(() => {
        if (muscles.length === 0 || equipment.length === 0) {
            return [];
        }
        return suggestExercises({
            muscles,
            equipment,
            experienceLevel,
            limit: 4,
        });
    }, [muscles, equipment, experienceLevel]);

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn('overflow-hidden', className)}
        >
            <Card className="glass-premium border-primary/20">
                <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                            {t('wizard.suggestions.title', 'Suggested Exercises')}
                        </span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                            {suggestions.length} {t('wizard.suggestions.matches', 'matches')}
                        </Badge>
                    </div>

                    {/* Exercise list */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-2"
                    >
                        <AnimatePresence mode="popLayout">
                            {suggestions.map((exercise) => (
                                <ExerciseCard key={exercise.id} exercise={exercise} />
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Footer hint */}
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        {t('wizard.suggestions.hint', 'These will be included in your personalized plan')}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
    // Check if compound based on movement patterns
    const compoundPatterns = ['squat', 'hinge', 'horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull'];
    const isCompound = exercise.patterns?.some(p => compoundPatterns.includes(p));

    return (
        <motion.div
            variants={itemVariants}
            layout
            className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
        >
            {/* Icon */}
            <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="h-4 w-4 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {exercise.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {exercise.primaryMuscles.slice(0, 2).join(', ')}
                </p>
            </div>

            {/* Badge */}
            <Badge
                variant="outline"
                className={cn(
                    'text-xs shrink-0',
                    isCompound && 'border-primary/50 text-primary'
                )}
            >
                {isCompound ? 'Compound' : 'Isolation'}
            </Badge>
        </motion.div>
    );
}
