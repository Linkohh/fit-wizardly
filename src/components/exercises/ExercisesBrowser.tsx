import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useWizardStore } from '@/stores/wizardStore';
import { useCustomExerciseStore } from '@/stores/customExerciseStore';
import { useExerciseDatabase } from '@/lib/exerciseRepository';
import {
    createExerciseCatalogIndex,
    filterExercisesFromIndex,
} from '@/lib/exerciseCatalogIndex';
import { getRecommendedExercisesFromCatalog } from '@/lib/exercise-utils';
import { Exercise, Equipment, MuscleGroup, ExerciseCategory, EQUIPMENT_OPTIONS, MUSCLE_DATA } from '@/types/fitness';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ExerciseOfTheDay } from './ExerciseOfTheDay';
import { CommunityPulse } from '@/components/community/CommunityPulse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StateCard } from '@/components/ui/state-card';

const ITEMS_PER_PAGE = 24;

type DifficultyFilter = 'Beginner' | 'Intermediate' | 'Advanced' | 'all';

interface ExerciseFilterOptions {
    category: ExerciseCategory | 'all';
    muscle: MuscleGroup | 'all';
    difficulty: DifficultyFilter;
    equipment: Equipment | 'all';
    search: string;
}

const isEquipmentFilter = (value: string): value is Equipment | 'all' =>
    value === 'all' || EQUIPMENT_OPTIONS.some((option) => option.id === value);

export function ExercisesBrowser() {
    const [filters, setFilters] = useState<ExerciseFilterOptions>({
        category: 'all',
        muscle: 'all',
        difficulty: 'all',
        equipment: 'all',
        search: '',
    });
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [page, setPage] = useState(1);
    const [showCustomExerciseForm, setShowCustomExerciseForm] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customPrimaryMuscle, setCustomPrimaryMuscle] = useState<MuscleGroup>('chest');
    const [customEquipment, setCustomEquipment] = useState<Equipment>('bodyweight');
    const [customCues, setCustomCues] = useState('');
    const [customDescription, setCustomDescription] = useState('');

    const { selections } = useWizardStore();
    const { customExercises, addCustomExercise } = useCustomExerciseStore();
    const { exercises: loadedExercises, isLoading } = useExerciseDatabase();
    const railRef = useRef<HTMLDivElement>(null);
    const deferredSearch = useDeferredValue(filters.search);

    const hasWizardData = selections.targetMuscles.length > 0 || selections.equipment.length > 0;
    const exerciseDatabase = useMemo<Exercise[]>(
        () => [...customExercises, ...loadedExercises],
        [customExercises, loadedExercises]
    );
    const indexedDatabase = useMemo(
        () => createExerciseCatalogIndex(exerciseDatabase),
        [exerciseDatabase]
    );
    const effectiveFilters = useMemo(
        () => ({ ...filters, search: deferredSearch }),
        [deferredSearch, filters]
    );

    const recommendedExercises = useMemo(() => {
        if (!hasWizardData) return [];
        return getRecommendedExercisesFromCatalog(indexedDatabase, {
            goal: selections.goal,
            experienceLevel: selections.experienceLevel,
            equipment: selections.equipment,
            targetMuscles: selections.targetMuscles,
        });
    }, [hasWizardData, indexedDatabase, selections]);

    const recommendedForRail = useMemo(() => recommendedExercises.slice(0, 10), [recommendedExercises]);

    const filteredExercises = useMemo(() => {
        return filterExercisesFromIndex(indexedDatabase, effectiveFilters);
    }, [effectiveFilters, indexedDatabase]);

    const displayedExercises = useMemo(() => {
        return filteredExercises.slice(0, page * ITEMS_PER_PAGE);
    }, [filteredExercises, page]);

    const isFiltering =
        filters.category !== 'all' ||
        filters.muscle !== 'all' ||
        filters.difficulty !== 'all' ||
        filters.equipment !== 'all' ||
        filters.search.trim() !== '';

    const hasMore = displayedExercises.length < filteredExercises.length;

    const handleFilterChange = (key: string, value: string) => {
        setFilters((previous) => {
            switch (key) {
                case 'category':
                    return { ...previous, category: value as ExerciseCategory | 'all' };
                case 'muscle':
                    return { ...previous, muscle: value as MuscleGroup | 'all' };
                case 'difficulty':
                    return { ...previous, difficulty: value as DifficultyFilter };
                case 'equipment':
                    return { ...previous, equipment: isEquipmentFilter(value) ? value : 'all' };
                case 'search':
                    return { ...previous, search: value };
                default:
                    return previous;
            }
        });
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            category: 'all',
            muscle: 'all',
            difficulty: 'all',
            equipment: 'all',
            search: '',
        });
        setPage(1);
    };

    const handleCreateCustomExercise = () => {
        const name = customName.trim();
        if (!name) {
            toast.error('Exercise name is required');
            return;
        }

        const cues = customCues
            .split(',')
            .map((cue) => cue.trim())
            .filter(Boolean);

        const created = addCustomExercise({
            name,
            primaryMuscles: [customPrimaryMuscle],
            equipment: [customEquipment],
            cues: cues.length > 0 ? cues : ['Custom cue'],
            description: customDescription.trim() || undefined,
        });

        toast.success('Custom exercise created');
        setSelectedExercise(created);
        setShowCustomExerciseForm(false);
        setCustomName('');
        setCustomCues('');
        setCustomDescription('');
    };

    const scrollRail = useCallback((direction: 'left' | 'right') => {
        const rail = railRef.current;
        if (!rail) return;

        const firstCard = rail.querySelector('.snap-start') as HTMLElement | null;
        const computed = window.getComputedStyle(rail);
        const gap = Number.parseFloat(computed.gap || computed.columnGap || '16') || 16;
        const cardWidth = firstCard?.offsetWidth || 336;
        const delta = cardWidth + gap;

        rail.scrollBy({
            left: direction === 'right' ? delta : -delta,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className="container-full py-8 animate-in fade-in duration-500">
            <div className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                        Exercise Library
                    </h1>
                    <CommunityPulse />
                </div>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Explore our exercise library. Filter by muscle, category, or difficulty to build your perfect workout.
                </p>

                <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search exercises (e.g., 'Bench Press', 'Chest')..."
                        className="pl-9 bg-black/20 border-white/10 focus:border-primary/50 transition-all font-medium"
                        value={filters.search}
                        onChange={(event) => handleFilterChange('search', event.target.value)}
                    />
                </div>
            </div>

            <Card className="mb-6 border-white/10 bg-black/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">Custom Exercises</CardTitle>
                        <Button
                            variant={showCustomExerciseForm ? 'outline' : 'default'}
                            size="sm"
                            className="gap-2"
                            onClick={() => setShowCustomExerciseForm((value) => !value)}
                        >
                            <Plus className="h-4 w-4" />
                            {showCustomExerciseForm ? 'Close' : 'Create'}
                        </Button>
                    </div>
                </CardHeader>
                {showCustomExerciseForm && (
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="custom-exercise-name">Name</Label>
                                <Input
                                    id="custom-exercise-name"
                                    placeholder="e.g. Cable Bayesian Curl"
                                    value={customName}
                                    onChange={(event) => setCustomName(event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Primary Muscle</Label>
                                <Select
                                    value={customPrimaryMuscle}
                                    onValueChange={(value) => setCustomPrimaryMuscle(value as MuscleGroup)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select primary muscle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MUSCLE_DATA.map((muscle) => (
                                            <SelectItem key={muscle.id} value={muscle.id}>
                                                {muscle.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Equipment</Label>
                                <Select
                                    value={customEquipment}
                                    onValueChange={(value) => setCustomEquipment(value as Equipment)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select equipment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EQUIPMENT_OPTIONS.map((equipment) => (
                                            <SelectItem key={equipment.id} value={equipment.id}>
                                                {equipment.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="custom-exercise-cues">Cues (comma separated)</Label>
                                <Input
                                    id="custom-exercise-cues"
                                    placeholder="Brace core, Keep elbows high"
                                    value={customCues}
                                    onChange={(event) => setCustomCues(event.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom-exercise-description">Description (optional)</Label>
                            <Input
                                id="custom-exercise-description"
                                placeholder="Short coaching note"
                                value={customDescription}
                                onChange={(event) => setCustomDescription(event.target.value)}
                            />
                        </div>

                        <Button className="w-full gradient-primary" onClick={handleCreateCustomExercise}>
                            Save Custom Exercise
                        </Button>
                    </CardContent>
                )}
            </Card>

            {!isFiltering && !isLoading && <ExerciseOfTheDay onSelect={setSelectedExercise} />}

            <ExerciseFilters
                category={filters.category}
                muscle={filters.muscle}
                difficulty={filters.difficulty}
                equipment={filters.equipment}
                onFilterChange={handleFilterChange}
                onClear={clearFilters}
            />

            {!isFiltering && hasWizardData && recommendedForRail.length > 0 && (
                <section className="mb-12 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-black/20 to-transparent p-5 md:p-6">
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-1">
                            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                                <span className="inline-flex items-center justify-center rounded-lg border border-primary/30 bg-primary/20 p-1.5 text-primary">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                Recommended for You
                            </h2>
                            <p className="text-sm text-white/65">
                                Personalized picks based on your goals, target muscles, and available equipment.
                            </p>
                        </div>

                        <div className="hidden items-center gap-2 lg:flex">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 border-white/20 bg-black/25 text-white/80 hover:bg-black/40 hover:text-white"
                                onClick={() => scrollRail('left')}
                                aria-label="Scroll recommended exercises left"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 border-white/20 bg-black/25 text-white/80 hover:bg-black/40 hover:text-white"
                                onClick={() => scrollRail('right')}
                                aria-label="Scroll recommended exercises right"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative overflow-hidden" aria-label="Recommended exercises carousel">
                        <div
                            ref={railRef}
                            data-testid="recommended-rail-track"
                            className="scrollbar-purple flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 pr-4"
                        >
                            {recommendedForRail.map((exercise, index) => (
                                <ExerciseCard
                                    key={`rec-${exercise.id}`}
                                    exercise={exercise}
                                    onClick={setSelectedExercise}
                                    index={index}
                                    variant="recommended"
                                />
                            ))}
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-background to-transparent md:block" />
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-3 text-[11px] uppercase tracking-[0.14em] text-white/45">
                        Scroll to explore your tailored shortlist
                    </div>
                </section>
            )}

            <div className="mb-4 text-sm text-muted-foreground flex justify-between items-end">
                <span>Showing {displayedExercises.length} of {filteredExercises.length} results</span>
                {isFiltering && (
                    <Button variant="link" onClick={clearFilters} className="text-primary p-0 h-auto">
                        View All Exercises
                    </Button>
                )}
            </div>

            {isLoading ? (
                <StateCard
                    variant="loading"
                    title="Loading exercise library"
                    description="Crunching your exercise catalogue now."
                />
            ) : displayedExercises.length === 0 ? (
                <StateCard
                    variant="empty"
                    title="No exercises found"
                    description="Try adjusting your filters or search terms."
                    action={{
                        label: 'Clear Filters',
                        onClick: clearFilters,
                        variant: 'outline',
                    }}
                    className="border-dashed border-white/10 bg-black/20"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {displayedExercises.map((exercise, index) => (
                            <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                onClick={setSelectedExercise}
                                index={index}
                                variant="library"
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {hasMore && (
                <div className="mt-12 flex justify-center">
                    <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => setPage((value) => value + 1)}
                        className="min-w-[200px]"
                    >
                        Load More
                    </Button>
                </div>
            )}

            <ExerciseDetailModal
                exercise={selectedExercise}
                isOpen={!!selectedExercise}
                onClose={() => setSelectedExercise(null)}
                onSelectExercise={setSelectedExercise}
            />
        </div>
    );
}
