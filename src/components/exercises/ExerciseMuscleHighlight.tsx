import React, { useState, useMemo } from 'react';
import { MuscleGroup } from '@/types/fitness';
import { MuscleCanvas } from '@/features/mcl/components/MuscleSelector/svg/MuscleCanvas';
import { MuscleHighlight, ViewType } from '@/features/mcl/types';
import { getMclIdsForLegacyGroup } from '@/lib/muscleMapping';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ExerciseMuscleHighlightProps {
    primaryMuscles: MuscleGroup[];
    secondaryMuscles?: MuscleGroup[];
    className?: string;
}

export const ExerciseMuscleHighlight: React.FC<ExerciseMuscleHighlightProps> = ({
    primaryMuscles = [],
    secondaryMuscles = [],
    className,
}) => {
    // Determine default view based on muscle locations
    const [view, setView] = useState<ViewType>(() => {
        const backGroups: MuscleGroup[] = [
            'glutes',
            'hamstrings',
            'calves',
            'triceps',
            'rear_deltoid',
            'lats',
            'upper_back',
            'lower_back',
            'traps',
            'neck'
        ];

        // Count how many primary/secondary muscles are on the back
        const allMuscles = [...primaryMuscles, ...secondaryMuscles];
        const backCount = allMuscles.filter(m => backGroups.includes(m)).length;
        const frontCount = allMuscles.length - backCount;

        return backCount > frontCount ? 'back' : 'front';
    });

    // Convert legacy muscle groups to MCL highlights
    const highlights = useMemo(() => {
        const list: MuscleHighlight[] = [];

        // Primary muscles (high intensity)
        primaryMuscles.forEach(group => {
            const ids = getMclIdsForLegacyGroup(group);
            ids.forEach(id => {
                list.push({
                    muscleId: id,
                    type: 'focus',
                    intensity: 100,
                });
            });
        });

        // Secondary muscles (medium intensity)
        secondaryMuscles.forEach(group => {
            const ids = getMclIdsForLegacyGroup(group);
            ids.forEach(id => {
                // Avoid duplicates if a muscle is somehow both primary and secondary
                if (!list.find(h => h.muscleId === id)) {
                    list.push({
                        muscleId: id,
                        type: 'focus', // You might want a different type or just lower intensity
                        intensity: 50,
                    });
                }
            });
        });

        return list;
    }, [primaryMuscles, secondaryMuscles]);

    return (
        <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-900/50 ${className}`}>
            {/* Container for the MuscleCanvas */}
            <div className="h-full w-full max-w-[300px] p-4">
                <MuscleCanvas
                    view={view}
                    selectedMuscles={[]} // No selection, just highlights
                    hoveredMuscle={null}
                    highlightedMuscles={highlights}
                    onMuscleHover={() => { }}
                    onMuscleClick={() => { }}
                    colorByGroup={true}
                    accentColor="#3b82f6" // blue-500
                    animateHighlights={true}
                    customViewBox="0 0 200 440" // Full body view
                />
            </div>

            {/* View Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                onClick={() => setView(v => v === 'front' ? 'back' : 'front')}
            >
                <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Legend / Info (Optional) */}
            <div className="absolute bottom-4 left-4 flex gap-3 text-xs text-white/70">
                <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    <span>Primary</span>
                </div>
                {secondaryMuscles.length > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500/60"></span>
                        <span>Secondary</span>
                    </div>
                )}
            </div>
        </div>
    );
};
