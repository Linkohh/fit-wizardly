/**
 * Exercise Card Skeleton
 *
 * Premium loading skeleton that matches the ExerciseCard layout.
 * Features purple shimmer animation for brand consistency.
 */

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ExerciseCardSkeletonProps {
    index?: number; // For staggered animation
    className?: string;
}

// Shimmer animation component
function Shimmer({ className }: { className?: string }) {
    return (
        <div className={cn('relative overflow-hidden rounded', className)}>
            {/* Base gray */}
            <div className="absolute inset-0 bg-white/5" />
            {/* Shimmer gradient */}
            <motion.div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                animate={{
                    translateX: ['−100%', '100%'],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
        </div>
    );
}

export function ExerciseCardSkeleton({ index = 0, className }: ExerciseCardSkeletonProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.3,
                delay: index * 0.05, // Staggered entrance
            }}
            className={cn('h-full', className)}
        >
            <Card className="h-full bg-black/40 backdrop-blur-md border-white/5 overflow-hidden relative">
                {/* Subtle background pulse */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                <CardHeader className="p-4 pb-2 relative z-10">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 space-y-2">
                            {/* Title skeleton */}
                            <Shimmer className="h-5 w-3/4" />
                            {/* Subtitle skeleton */}
                            <Shimmer className="h-3 w-1/2" />
                        </div>
                        {/* Badge skeleton */}
                        <Shimmer className="h-5 w-16 rounded-full" />
                    </div>
                    {/* Favorite button skeleton */}
                    <div className="absolute top-4 right-4 z-20">
                        <Shimmer className="h-5 w-5 rounded-full" />
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 relative z-10 space-y-3">
                    {/* Image placeholder skeleton */}
                    <Shimmer className="w-full h-32 rounded-lg" />

                    {/* Metrics skeleton */}
                    <div className="flex items-center gap-3">
                        <Shimmer className="h-4 w-20" />
                        <Shimmer className="h-4 w-16" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

/**
 * Grid of skeleton cards for loading state
 */
interface ExerciseSkeletonGridProps {
    count?: number;
    className?: string;
}

export function ExerciseSkeletonGrid({ count = 8, className }: ExerciseSkeletonGridProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
                className
            )}
        >
            {Array.from({ length: count }).map((_, i) => (
                <ExerciseCardSkeleton key={i} index={i} />
            ))}
        </div>
    );
}

export default ExerciseCardSkeleton;
