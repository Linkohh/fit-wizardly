import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EXERCISE_DATABASE } from '@/data/exercises';
import type { Exercise, ExercisePrescription } from '@/types/fitness';
import { Search, ArrowRight, Check } from 'lucide-react';

interface ExerciseSwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentExercise: ExercisePrescription;
    onSwap: (newExercise: Exercise) => void;
    allowedEquipment?: string[];
}

export function ExerciseSwapModal({
    isOpen,
    onClose,
    currentExercise,
    onSwap,
    allowedEquipment,
}: ExerciseSwapModalProps) {
    const [search, setSearch] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    // Filter exercises by same movement pattern and available equipment
    const filteredExercises = useMemo(() => {
        const currentPatterns = currentExercise.exercise.patterns;
        const currentPrimaryMuscles = currentExercise.exercise.primaryMuscles;

        return EXERCISE_DATABASE.filter((ex) => {
            // Exclude current exercise
            if (ex.id === currentExercise.exercise.id) return false;

            // Filter by equipment if specified
            if (allowedEquipment && allowedEquipment.length > 0) {
                const hasAllowedEquipment = ex.equipment.some((eq) =>
                    allowedEquipment.includes(eq)
                );
                if (!hasAllowedEquipment) return false;
            }

            // Prioritize same pattern or same primary muscles
            const samePattern = ex.patterns.some((p) => currentPatterns.includes(p));
            const sameMuscle = ex.primaryMuscles.some((m) => currentPrimaryMuscles.includes(m));
            if (!samePattern && !sameMuscle) return false;

            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                return (
                    ex.name.toLowerCase().includes(searchLower) ||
                    ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchLower))
                );
            }

            return true;
        }).slice(0, 20); // Limit results for performance
    }, [currentExercise, allowedEquipment, search]);

    const handleConfirm = () => {
        if (selectedExercise) {
            onSwap(selectedExercise);
            setSelectedExercise(null);
            setSearch('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Swap Exercise
                    </DialogTitle>
                    <DialogDescription>
                        Replace <span className="font-medium text-foreground">{currentExercise.exercise.name}</span> with an alternative exercise
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search exercises..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Exercise List */}
                    <ScrollArea className="h-64 pr-4">
                        <div className="space-y-2">
                            {filteredExercises.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No matching exercises found
                                </p>
                            ) : (
                                filteredExercises.map((ex) => (
                                    <button
                                        key={ex.id}
                                        onClick={() => setSelectedExercise(ex)}
                                        className={`w-full p-3 rounded-lg border text-left transition-all ${selectedExercise?.id === ex.id
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{ex.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {ex.primaryMuscles.map((m) => m.replace(/_/g, ' ')).join(', ')}
                                                </p>
                                            </div>
                                            {selectedExercise?.id === ex.id && (
                                                <Check className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {ex.equipment.slice(0, 3).map((eq) => (
                                                <Badge key={eq} variant="outline" className="text-xs">
                                                    {eq.replace(/_/g, ' ')}
                                                </Badge>
                                            ))}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        onClick={handleConfirm}
                        disabled={!selectedExercise}
                        className="gap-2"
                    >
                        <ArrowRight className="h-4 w-4" />
                        Swap Exercise
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
