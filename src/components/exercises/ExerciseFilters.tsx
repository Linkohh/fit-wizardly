import { ExerciseCategory, Equipment, MuscleGroup } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface ExerciseFiltersProps {
    category: ExerciseCategory | 'all';
    muscle: MuscleGroup | 'all';
    difficulty: string;
    onFilterChange: (key: string, value: string) => void;
    onClear: () => void;
}

export function ExerciseFilters({ category, muscle, difficulty, onFilterChange, onClear }: ExerciseFiltersProps) {
    return (
        <div className="flex flex-wrap gap-3 items-center mb-6 p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 text-primary">
                <Filter className="w-5 h-5" />
                <span className="font-semibold hidden sm:inline">Filters</span>
            </div>

            <Select value={category} onValueChange={(val) => onFilterChange('category', val)}>
                <SelectTrigger className="w-[140px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
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
                <SelectTrigger className="w-[140px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
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
                    {/* Detailed mapping could be added here if we want specific muscles */}
                </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={(val) => onFilterChange('difficulty', val)}>
                <SelectTrigger className="w-[140px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
            </Select>

            <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="ml-auto text-muted-foreground hover:text-white"
                aria-label="Clear filters"
            >
                <X className="w-4 h-4 mr-1" />
                Clear
            </Button>
        </div>
    );
}
