import { useState, useMemo, useRef, useCallback } from 'react';
import { filterExercises, ExerciseFilterOptions, getRecommendedExercises } from '@/lib/exercise-utils';
import { useWizardStore } from '@/stores/wizardStore';
import { Exercise } from '@/types/fitness';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';
import { CommunityPulse } from '@/components/community/CommunityPulse';
import { ExerciseOfTheDay } from './ExerciseOfTheDay';
import { AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 24;

export function ExercisesBrowser() {
    const [filters, setFilters] = useState<ExerciseFilterOptions>({
        category: 'all',
        muscle: 'all',
        difficulty: 'all',
        equipment: 'all',
        search: '',
    });

    const { selections } = useWizardStore();
    const hasWizardData = selections.targetMuscles.length > 0 || selections.equipment.length > 0;

    const recommendedExercises = useMemo(() => {
        if (hasWizardData) {
            return getRecommendedExercises(selections);
        }
        return [];
    }, [selections, hasWizardData]);
    const recommendedForRail = useMemo(() => recommendedExercises.slice(0, 10), [recommendedExercises]);

    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [page, setPage] = useState(1);

    const filteredExercises = useMemo(() => {
        // Reset page when filters change
        return filterExercises(filters);
    }, [filters]);

    const displayedExercises = useMemo(() => {
        return filteredExercises.slice(0, page * ITEMS_PER_PAGE);
    }, [filteredExercises, page]);

    const isFiltering =
        filters.category !== 'all'
        || filters.muscle !== 'all'
        || filters.difficulty !== 'all'
        || filters.equipment !== 'all'
        || filters.search.trim() !== '';

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
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

    const hasMore = displayedExercises.length < filteredExercises.length;
    const railRef = useRef<HTMLDivElement>(null);

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
                    Explore our comprehensive database of over 100 exercises. Filter by muscle, category, or difficulty to build your perfect workout.
                </p>

                <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search exercises (e.g., 'Bench Press', 'Chest')..."
                        className="pl-9 bg-black/20 border-white/10 focus:border-primary/50 transition-all font-medium"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
            </div>

            {/* Featured Daily Exercise */}
            {!isFiltering && (
                <ExerciseOfTheDay onSelect={setSelectedExercise} />
            )}

            <ExerciseFilters
                category={filters.category || 'all'}
                muscle={filters.muscle || 'all'}
                difficulty={filters.difficulty || 'all'}
                equipment={filters.equipment || 'all'}
                onFilterChange={handleFilterChange}
                onClear={clearFilters}
            />

            {/* Recommendations Section */}
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

                    <div
                        className="relative overflow-hidden"
                        aria-label="Recommended exercises carousel"
                    >
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
                    <Button variant="link" onClick={clearFilters} className="text-primary p-0 h-auto">View All Exercises</Button>
                )}
            </div>

            {displayedExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-xl bg-black/20">
                    <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No exercises found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your filters or search term.</p>
                    <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
                </div>
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
                        onClick={() => setPage(p => p + 1)}
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
