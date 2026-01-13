import { Exercise } from '@/types/fitness';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Flame, Activity, Heart } from 'lucide-react';
import { useFavoritesStore } from '@/stores/favorites-store';

interface ExerciseCardProps {
    exercise: Exercise;
    onClick: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const favorite = isFavorite(exercise.id);

    // Determine difficulty color
    const difficultyColor = {
        'Beginner': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'Intermediate': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'Advanced': 'bg-red-500/20 text-red-300 border-red-500/30',
        'Elite': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'All Levels': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    }[exercise.difficulty || 'Intermediate'] || 'bg-slate-500/20 text-slate-300';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            onClick={() => onClick(exercise)}
            className="group cursor-pointer h-full"
            role="article"
            aria-label={`View details for ${exercise.name}`}
        >
            <Card className="h-full bg-black/40 backdrop-blur-md border-white/5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300 overflow-hidden relative">
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-500" />

                <CardHeader className="p-4 pb-2 relative z-10">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">{exercise.name}</h3>
                            <p className="text-xs text-muted-foreground capitalize">{exercise.category} • {exercise.primaryMuscles[0]?.replace('_', ' ')}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider ${difficultyColor}`}>
                            {exercise.difficulty || 'Inter'}
                        </Badge>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(exercise.id); }}
                        className="absolute top-4 right-4 z-20 text-white/50 hover:text-red-500 transition-colors"
                        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Heart className={`w-5 h-5 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                </CardHeader>

                <CardContent className="p-4 pt-2 relative z-10 space-y-3">
                    {/* Visual Preview Placeholder (or actual image if we had valid URLs) */}
                    <div className="w-full h-32 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center overflow-hidden group-hover:border-primary/20 transition-colors">
                        {exercise.imageUrl ? (
                            <img src={exercise.imageUrl} alt={exercise.name} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <Activity className="w-8 h-8 text-white/10 group-hover:text-primary/40 transition-colors" />
                        )}
                    </div>

                    {/* Metrics / Info */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" />
                            <span className="capitalize text-nowrap truncate max-w-[80px]">{exercise.equipment[0]?.replace('_', ' ') || 'None'}</span>
                        </div>
                        {exercise.metabolic && (
                            <div className="flex items-center gap-1" title="Metabolic Equivalent">
                                <Flame className="w-3 h-3 text-orange-500/70" />
                                <span>~{(exercise.metabolic.met * 75 * 10 / 200).toFixed(0)} cal</span> {/* Mock calc: 75kg * 10min... just flavor text approx */}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
