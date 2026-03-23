import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  ExerciseLibraryFilterState,
  ExerciseLibraryOption,
} from '../types';

interface ExerciseLibraryFiltersProps {
  filters: ExerciseLibraryFilterState;
  categories: ExerciseLibraryOption[];
  muscles: ExerciseLibraryOption[];
  equipment: ExerciseLibraryOption[];
  onChange: (key: keyof ExerciseLibraryFilterState, value: string) => void;
  onClear: () => void;
}

export function ExerciseLibraryFilters({
  filters,
  categories,
  muscles,
  equipment,
  onChange,
  onClear,
}: ExerciseLibraryFiltersProps) {
  return (
    <section className="rounded-[28px] border border-border/50 bg-muted/50 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
      <div className="mb-4 flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Filter the library</p>
      </div>

      <div
        data-testid="exercise-library-filters-grid"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto]"
      >
        <label className="relative block sm:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="Search exercises, muscles, or equipment"
            aria-label="Search exercise library"
            className="h-11 pl-10"
          />
        </label>

        <Select value={filters.category} onValueChange={(value) => onChange('category', value)}>
          <SelectTrigger
            aria-label="Filter by category"
            className="h-11"
          >
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.muscle} onValueChange={(value) => onChange('muscle', value)}>
          <SelectTrigger
            aria-label="Filter by muscle"
            className="h-11"
          >
            <SelectValue placeholder="Primary muscle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All muscles</SelectItem>
            {muscles.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.equipment} onValueChange={(value) => onChange('equipment', value)}>
          <SelectTrigger
            aria-label="Filter by equipment"
            className="h-11"
          >
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All equipment</SelectItem>
            {equipment.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="h-11 sm:col-span-2 xl:col-span-1"
          onClick={onClear}
          aria-label="Clear exercise library filters"
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Live filters are generated only from verified fields in the active library source.
      </div>
    </section>
  );
}
