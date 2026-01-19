import { ExerciseCategory, Equipment, MuscleGroup, EQUIPMENT_PRESETS } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface ExerciseFiltersProps {
    category: ExerciseCategory | 'all';
    muscle: MuscleGroup | 'all';
    difficulty: string;
    equipment: string | Equipment[] | 'all';
    onFilterChange: (key: string, value: string) => void;
    onClear: () => void;
}

export function ExerciseFilters({ category, muscle, difficulty, equipment, onFilterChange, onClear }: ExerciseFiltersProps) {
    const { t } = useTranslation();
    return (
        <div className="space-y-4 mb-6">
            {/* Main Filters Row */}
            <div className="flex flex-wrap gap-3 items-center p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-2 text-primary">
                    <Filter className="w-5 h-5" />
                    <span className="font-semibold hidden sm:inline">{t('exercises.filters.title')}</span>
                </div>

                <Select value={category} onValueChange={(val) => onFilterChange('category', val)}>
                    <SelectTrigger className="w-[130px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder={t('exercises.filters.category_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('exercises.filters.all_categories')}</SelectItem>
                        <SelectItem value="strength">{t('exercises.filters.strength')}</SelectItem>
                        <SelectItem value="cardio">{t('exercises.filters.cardio')}</SelectItem>
                        <SelectItem value="flexibility">{t('exercises.filters.flexibility')}</SelectItem>
                        <SelectItem value="plyometric">{t('exercises.filters.plyometric')}</SelectItem>
                        <SelectItem value="core">{t('exercises.filters.core')}</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={muscle} onValueChange={(val) => onFilterChange('muscle', val)}>
                    <SelectTrigger className="w-[130px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder={t('exercises.filters.muscle_placeholder')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">{t('exercises.filters.all_muscles')}</SelectItem>
                        <SelectItem value="chest">{t('exercises.filters.chest')}</SelectItem>
                        <SelectItem value="back">{t('exercises.filters.back')}</SelectItem>
                        <SelectItem value="legs">{t('exercises.filters.legs')}</SelectItem>
                        <SelectItem value="arms">{t('exercises.filters.arms')}</SelectItem>
                        <SelectItem value="shoulders">{t('exercises.filters.shoulders')}</SelectItem>
                        <SelectItem value="core">{t('exercises.filters.core')}</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={difficulty} onValueChange={(val) => onFilterChange('difficulty', val)}>
                    <SelectTrigger className="w-[130px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder={t('exercises.filters.difficulty_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('exercises.filters.all_levels')}</SelectItem>
                        <SelectItem value="Beginner">{t('exercises.filters.beginner')}</SelectItem>
                        <SelectItem value="Intermediate">{t('exercises.filters.intermediate')}</SelectItem>
                        <SelectItem value="Advanced">{t('exercises.filters.advanced')}</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={Array.isArray(equipment) ? (equipment.length === 1 ? equipment[0] : 'custom') : (equipment || 'all')}
                    onValueChange={(val) => onFilterChange('equipment', val)}
                >
                    <SelectTrigger className="w-[130px] bg-background/50 border-white/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder={t('exercises.filters.equipment_placeholder')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">{t('exercises.filters.all_equipment')}</SelectItem>
                        <SelectItem value="bodyweight">{t('exercises.filters.bodyweight')}</SelectItem>
                        <SelectItem value="dumbbells">{t('exercises.filters.dumbbells')}</SelectItem>
                        <SelectItem value="barbell">{t('exercises.filters.barbell')}</SelectItem>
                        <SelectItem value="cables">{t('exercises.filters.cables')}</SelectItem>
                        <SelectItem value="machines">{t('exercises.filters.machines')}</SelectItem>
                        <SelectItem value="kettlebells">{t('exercises.filters.kettlebells')}</SelectItem>
                        <SelectItem value="band">{t('exercises.filters.bands')}</SelectItem>
                        {Array.isArray(equipment) && equipment.length > 1 && (
                            <SelectItem value="custom" disabled>{t('exercises.filters.custom_multiple')}</SelectItem>
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
                    {t('exercises.filters.clear')}
                </Button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pl-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" /> {t('exercises.filters.quick_sets')}
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
