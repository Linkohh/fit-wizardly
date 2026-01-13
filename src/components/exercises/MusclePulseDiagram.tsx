import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MuscleGroup } from '@/types/fitness';
import {
    FRONT_MUSCLE_PATHS,
    BACK_MUSCLE_PATHS,
    ANATOMY_SILHOUETTE_PATH,
    ANATOMY_TORSO_PATH,
    ANATOMY_LIMBS_PATHS,
} from '@/data/anatomyPaths';

interface MusclePulseDiagramProps {
    primaryMuscles: MuscleGroup[];
    secondaryMuscles?: MuscleGroup[];
    view?: 'front' | 'back' | 'auto';
    className?: string;
    intensity?: 'low' | 'medium' | 'high';
}

export function MusclePulseDiagram({
    primaryMuscles,
    secondaryMuscles = [],
    view = 'auto',
    className,
    intensity = 'high',
}: MusclePulseDiagramProps) {
    // Determine view automatically if set to auto
    const activeView = useMemo(() => {
        if (view !== 'auto') return view;

        const frontCount = primaryMuscles.filter((m) => m in FRONT_MUSCLE_PATHS).length;
        const backCount = primaryMuscles.filter((m) => m in BACK_MUSCLE_PATHS).length;

        return frontCount >= backCount ? 'front' : 'back';
    }, [view, primaryMuscles]);

    const paths = activeView === 'front' ? FRONT_MUSCLE_PATHS : BACK_MUSCLE_PATHS;

    // Animation variants
    const pulseVariant = {
        initial: { opacity: 0.6, scale: 1 },
        animate: {
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.02, 1],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const,
            },
        },
    };

    const secondaryVariant = {
        initial: { opacity: 0.4 },
        animate: { opacity: 0.4 }, // Static for secondary
    };

    return (
        <div className={cn('relative aspect-[1/2] w-full max-w-[200px]', className)}>
            <svg
                viewBox="0 0 200 420"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full"
            >
                <defs>
                    <filter id="primaryGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feFlood floodColor="hsl(270, 90%, 60%)" floodOpacity="0.8" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="secondaryGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feFlood floodColor="hsl(180, 70%, 50%)" floodOpacity="0.5" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Body Silhouette Base */}
                <path
                    d={ANATOMY_SILHOUETTE_PATH}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/20"
                />

                {/* Detail Lines (Torso, Limbs) */}
                <g className="stroke-muted-foreground/10" strokeWidth="0.5" fill="none">
                    <path d={ANATOMY_TORSO_PATH} />
                    {Object.values(ANATOMY_LIMBS_PATHS).map((d, i) => (
                        <path key={i} d={d} />
                    ))}
                </g>

                {/* Muscle Highlights */}
                {Object.entries(paths).map(([muscleId, pathData]) => {
                    const isPrimary = primaryMuscles.includes(muscleId as MuscleGroup);
                    const isSecondary = secondaryMuscles.includes(muscleId as MuscleGroup);

                    if (!isPrimary && !isSecondary) return null;

                    return (
                        <motion.path
                            key={muscleId}
                            d={pathData.display}
                            variants={isPrimary ? pulseVariant : secondaryVariant}
                            initial="initial"
                            animate="animate"
                            className={cn(
                                'transition-colors duration-300',
                                isPrimary
                                    ? 'fill-primary stroke-primary-foreground stroke-1'
                                    : 'fill-sky-500/40 stroke-sky-300/50 stroke-[0.5]'
                            )}
                            filter={isPrimary ? 'url(#primaryGlow)' : 'url(#secondaryGlow)'}
                        />
                    );
                })}
            </svg>

            {/* View Indicator Badge */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/5">
                    {activeView}
                </span>
            </div>
        </div>
    );
}
