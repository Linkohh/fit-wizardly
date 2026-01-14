/**
 * Quick Action Buttons for Exercise Cards
 *
 * Hover-reveal action bar with micro-animations.
 * Actions: Add to Workout, Favorite, Add to Collection, Compare
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, FolderPlus, GitCompare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHaptics } from '@/hooks/useHaptics';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuickActionsProps {
    exerciseId: string;
    exerciseName: string;
    isVisible: boolean;
    onAddToWorkout?: () => void;
    onCompare?: () => void;
    className?: string;
}

export function QuickActions({
    exerciseId,
    exerciseName,
    isVisible,
    onAddToWorkout,
    onCompare,
    className,
}: QuickActionsProps) {
    const haptics = useHaptics();
    const { isFavorite, toggleFavorite, collections, createCollection, addToCollection } =
        usePreferencesStore();

    const [showCollectionMenu, setShowCollectionMenu] = useState(false);
    const [addedToWorkout, setAddedToWorkout] = useState(false);

    const favorite = isFavorite(exerciseId);
    const collectionList = Object.values(collections);

    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.favoriteToggle();
        toggleFavorite(exerciseId);
        toast.success(favorite ? 'Removed from favorites' : 'Added to favorites');
    };

    const handleAddToWorkout = (e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.addToWorkout();
        setAddedToWorkout(true);
        onAddToWorkout?.();
        toast.success(`${exerciseName} added to workout`);

        // Reset after animation
        setTimeout(() => setAddedToWorkout(false), 2000);
    };

    const handleAddToCollection = (e: React.MouseEvent, collectionId: string) => {
        e.stopPropagation();
        haptics.selection();
        addToCollection(collectionId, exerciseId);
        setShowCollectionMenu(false);
        toast.success('Added to collection');
    };

    const handleCreateCollection = (e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.selection();
        const id = createCollection('New Collection');
        addToCollection(id, exerciseId);
        setShowCollectionMenu(false);
        toast.success('Created new collection');
    };

    const handleCompare = (e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.selection();
        onCompare?.();
        toast.info('Compare mode coming soon');
    };

    const actionVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 10 },
        visible: (i: number) => ({
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                type: 'spring' as const,
                stiffness: 400,
                damping: 25,
            },
        }),
        exit: { opacity: 0, scale: 0.8, y: 10 },
        tap: { scale: 0.9 },
    };

    const actions = [
        {
            icon: addedToWorkout ? Check : Plus,
            label: addedToWorkout ? 'Added!' : 'Add to Workout',
            onClick: handleAddToWorkout,
            className: addedToWorkout
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-primary/20 text-primary border-primary/30',
        },
        {
            icon: Heart,
            label: favorite ? 'Unfavorite' : 'Favorite',
            onClick: handleFavorite,
            className: favorite
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-white/10 text-white/70 border-white/20',
            iconClassName: favorite ? 'fill-red-400' : '',
        },
        {
            icon: FolderPlus,
            label: 'Add to Collection',
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                setShowCollectionMenu(!showCollectionMenu);
            },
            className: 'bg-white/10 text-white/70 border-white/20',
        },
        {
            icon: GitCompare,
            label: 'Compare',
            onClick: handleCompare,
            className: 'bg-white/10 text-white/70 border-white/20',
        },
    ];

    return (
        <TooltipProvider delayDuration={300}>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn(
                            'absolute bottom-2 left-2 right-2 z-30',
                            'flex items-center justify-center gap-2',
                            className
                        )}
                    >
                        {/* Glassmorphic background */}
                        <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            exit={{ opacity: 0, scaleX: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-lg border border-white/10"
                        />

                        {/* Action buttons */}
                        <div className="relative flex items-center gap-1.5 p-1.5">
                            {actions.map((action, i) => (
                                <Tooltip key={action.label}>
                                    <TooltipTrigger asChild>
                                        <motion.button
                                            custom={i}
                                            variants={actionVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            whileTap="tap"
                                            onClick={action.onClick}
                                            className={cn(
                                                'p-2 rounded-md border transition-colors',
                                                'hover:bg-white/10',
                                                action.className
                                            )}
                                        >
                                            <action.icon
                                                className={cn('w-4 h-4', action.iconClassName)}
                                            />
                                        </motion.button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        {action.label}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>

                        {/* Collection dropdown */}
                        <AnimatePresence>
                            {showCollectionMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[180px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg p-2 shadow-xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                                        Add to Collection
                                    </div>
                                    {collectionList.length > 0 ? (
                                        <div className="space-y-1">
                                            {collectionList.map((collection) => (
                                                <button
                                                    key={collection.id}
                                                    onClick={(e) =>
                                                        handleAddToCollection(e, collection.id)
                                                    }
                                                    className="w-full text-left px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 rounded transition-colors flex items-center gap-2"
                                                >
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                collection.color || '#8B5CF6',
                                                        }}
                                                    />
                                                    {collection.name}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                    <button
                                        onClick={handleCreateCollection}
                                        className="w-full text-left px-2 py-1.5 text-sm text-primary hover:bg-primary/10 rounded transition-colors flex items-center gap-2 mt-1 border-t border-white/5 pt-2"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Create New Collection
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </TooltipProvider>
    );
}

export default QuickActions;
