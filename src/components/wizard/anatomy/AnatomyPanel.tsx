import { useState, useCallback } from 'react';
import { RotateCcw, Layers, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MuscleDiagram } from './MuscleDiagram';
import { MuscleList } from './MuscleList';
import { SelectedMusclesChips } from './SelectedMusclesChips';
import { useWizardStore } from '@/stores/wizardStore';
import { MUSCLE_DATA } from '@/types/fitness';
import type { MuscleGroup } from '@/types/fitness';

export function AnatomyPanel() {
    const { selections, toggleMuscle, setTargetMuscles } = useWizardStore();
    const [view, setView] = useState<'front' | 'back'>('front');
    const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);

    // Filter muscles for the list based on current view
    const currentMuscles = MUSCLE_DATA
        .filter(m => m.view === view)
        .sort((a, b) => a.displayOrder - b.displayOrder);

    // Performance measurement wrapper with dev logging
    const handleToggle = useCallback((muscleId: MuscleGroup) => {
        if (import.meta.env.DEV) {
            const start = performance.now();
            toggleMuscle(muscleId);
            requestAnimationFrame(() => {
                const end = performance.now();
                const duration = end - start;
                console.log(`[Anatomy] Selection toggle: ${muscleId} in ${duration.toFixed(2)}ms`);
                if (duration > 300) {
                    console.warn(`[Performance] Selection exceeded 300ms threshold!`);
                }
            });
        } else {
            toggleMuscle(muscleId);
        }
    }, [toggleMuscle]);

    const handleClear = useCallback(() => setTargetMuscles([]), [setTargetMuscles]);

    const toggleView = useCallback(() => setView(v => v === 'front' ? 'back' : 'front'), []);

    const handleHover = useCallback((muscleId: MuscleGroup | null) => {
        setHoveredMuscle(muscleId);
    }, []);

    return (
        <div className="w-full space-y-6">
            {/* Selected Muscles Chips */}
            <SelectedMusclesChips
                selectedMuscles={selections.targetMuscles}
                onRemove={handleToggle}
                onClearAll={handleClear}
            />

            {/* View Toggle Header */}
            <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 p-1 bg-muted/30 rounded-xl border border-border/50 backdrop-blur-sm">
                    <Button
                        variant={view === 'front' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('front')}
                        className="gap-2 min-w-[100px] transition-all"
                    >
                        <Eye className="w-4 h-4" />
                        Front
                    </Button>
                    <Button
                        variant={view === 'back' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('back')}
                        className="gap-2 min-w-[100px] transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Back
                    </Button>
                </div>
            </div>

            {/* Main Grid - Diagram + List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Visual Diagram */}
                <div className="flex justify-center">
                    <div className="w-full max-w-sm">
                        <MuscleDiagram
                            view={view}
                            selectedMuscles={selections.targetMuscles}
                            onToggle={handleToggle}
                            hoveredMuscle={hoveredMuscle}
                            onHover={handleHover}
                        />
                    </div>
                </div>

                {/* Selection List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">
                            {view === 'front' ? 'Front' : 'Back'} Muscles
                        </span>
                        {hoveredMuscle && (
                            <span className="ml-auto text-xs text-primary font-medium animate-in fade-in-0">
                                Previewing: {hoveredMuscle.replace('_', ' ')}
                            </span>
                        )}
                    </div>
                    <MuscleList
                        muscles={currentMuscles}
                        selectedMuscles={selections.targetMuscles}
                        onToggle={handleToggle}
                        hoveredMuscle={hoveredMuscle}
                        onHover={handleHover}
                    />
                </div>
            </div>
        </div>
    );
}
