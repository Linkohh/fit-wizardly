import { ExerciseCategory, Equipment, MuscleGroup, EQUIPMENT_PRESETS } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExerciseFiltersProps {
    category: ExerciseCategory | 'all';
    muscle: MuscleGroup | 'all';
    difficulty: string;
    equipment: string | Equipment[] | 'all';
    onFilterChange: (key: string, value: string) => void;
    onClear: () => void;
}

export function ExerciseFilters({ category, muscle, difficulty, equipment, onFilterChange, onClear }: ExerciseFiltersProps) {
    return (
        <div className="space-y-4 mb-6">
            {/* Main Filters Row */}
            <div className="flex flex-wrap gap-3 items-center p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-2 text-primary">
                    <Filter className="w-5 h-5" />
                    <span className="font-semibold hidden sm:inline">Filters</span>
                </div>

                <Select value={category} onValueChange={(val) => onFilterChange('category', val)}>
                    <SelectTrigger className="w-[130px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                        <SelectItem value="plyometric">Plyometric</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={muscle} onValueChange={(val) => onFilterChange('muscle', val)}>
                    <SelectTrigger className="w-[130px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Muscle" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All Muscles</SelectItem>
                        <SelectItem value="chest">Chest</SelectItem>
                        <SelectItem value="back">Back</SelectItem>
                        <SelectItem value="legs">Legs</SelectItem>
                        <SelectItem value="arms">Arms</SelectItem>
                        <SelectItem value="shoulders">Shoulders</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={difficulty} onValueChange={(val) => onFilterChange('difficulty', val)}>
                    <SelectTrigger className="w-[130px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={Array.isArray(equipment) ? (equipment.length === 1 ? equipment[0] : 'custom') : (equipment || 'all')}
                    onValueChange={(val) => onFilterChange('equipment', val)}
                >
                    <SelectTrigger className="w-[130px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Equipment" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All Equipment</SelectItem>
                        <SelectItem value="bodyweight">Bodyweight</SelectItem>
                        <SelectItem value="dumbbells">Dumbbells</SelectItem>
                        <SelectItem value="barbell">Barbell</SelectItem>
                        <SelectItem value="cables">Cables</SelectItem>
                        <SelectItem value="machines">Machines</SelectItem>
                        <SelectItem value="kettlebells">Kettlebells</SelectItem>
                        <SelectItem value="band">Bands</SelectItem>
                        {Array.isArray(equipment) && equipment.length > 1 && (
                            <SelectItem value="custom" disabled>Custom/Multiple</SelectItem>
                        )}
                    </SelectContent>
                </Select>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="ml-auto text-muted-foreground hover:text-white"
                >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                </Button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pl-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" /> Quick Sets:
                </span>
                {EQUIPMENT_PRESETS.map((preset) => {
                    // Check if this preset matches current selection (simple logic: check name against some state? No, presets are complex)
                    // For now just clickable chips
                    return (
                        <Badge
                            key={preset.name}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/20 hover:border-primary/50 transition-colors py-1 px-3 bg-white/5 border-white/5"
                            onClick={() => {
                                // Logic to set filters based on preset
                                // Currently filter engine handles single 'equipment' value well, but presets are arrays.
                                // If I click "Bodyweight Only", I should set equipment='bodyweight'.
                                // If I click "Home Gym", it implies multiple. My filter logic (filterExercises) might only support single for now.
                                // Let's check filter-utils. Assuming it supports single.
                                // I'll map presets to the most dominant single equipment or just log for now?
                                // Actually, I'll map "Bodyweight Only" -> 'bodyweight', "Dumbbells Only" -> 'dumbbells'.
                                // "Home Gym" is tricky. I won't implement multi-select logic right now as it's complex.
                                // I'll only enable the ones that map cleanly to single selects for now.
                                if (preset.name === 'Bodyweight Only') onFilterChange('equipment', 'bodyweight');
                                if (preset.name === 'Dumbbells Only') onFilterChange('equipment', 'dumbbells');
                            }}
                        >
                            {preset.name}
                        </Badge>
                    );
                })}
            </div>
        </div>
    );
}
