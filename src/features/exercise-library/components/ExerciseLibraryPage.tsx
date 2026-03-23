import { useMemo, useState } from 'react';
import { CloudOff, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomExerciseStore } from '@/stores/customExerciseStore';
import { useWizardStore } from '@/stores/wizardStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExerciseSkeletonGrid } from '@/components/exercises/ExerciseCardSkeleton';
import { StateCard } from '@/components/ui/state-card';
import {
  EQUIPMENT_OPTIONS,
  MUSCLE_DATA,
  type Equipment,
  type MuscleGroup,
} from '@/types/fitness';
import type {
  ExerciseLibraryFilterState,
  ExerciseLibraryOption,
  ExerciseLibraryRecord,
} from '../types';
import { adaptCustomExerciseRecord } from '../legacy';
import { useExerciseLibrary } from '../useExerciseLibrary';
import { normalizeFilterValue } from '../utils';
import { ExerciseLibraryCard } from './ExerciseLibraryCard';
import { ExerciseLibraryDetailModal } from './ExerciseLibraryDetailModal';
import { ExerciseLibraryFilters } from './ExerciseLibraryFilters';

const INITIAL_FILTERS: ExerciseLibraryFilterState = {
  search: '',
  category: 'all',
  muscle: 'all',
  equipment: 'all',
};

const PAGE_SIZE = 24;

function buildOptions(values: string[]): ExerciseLibraryOption[] {
  return Array.from(new Set(values))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ value, label: value }));
}

function matchesFilterValue(filterValue: string, candidate: string[]) {
  if (filterValue === 'all') return true;
  return candidate.some((item) => normalizeFilterValue(item) === normalizeFilterValue(filterValue));
}

function getRelatedExercises(current: ExerciseLibraryRecord, records: ExerciseLibraryRecord[]) {
  return records
    .filter((record) => record.id !== current.id)
    .map((record) => {
      let score = 0;
      if (record.category.slug === current.category.slug) score += 4;
      if (record.primaryMuscles.some((item) => current.primaryMuscles.includes(item))) score += 5;
      if (record.secondaryMuscles.some((item) => current.primaryMuscles.includes(item))) score += 2;
      if (record.equipment.some((item) => current.equipment.includes(item))) score += 1;
      return { record, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((entry) => entry.record);
}

function getRecommendedRecords(
  records: ExerciseLibraryRecord[],
  targetMuscles: string[],
  equipment: string[]
) {
  if (targetMuscles.length === 0 && equipment.length === 0) return [];

  const normalizedMuscles = targetMuscles.map((item) => item.replace(/_/g, ' ').toLowerCase());
  const normalizedEquipment = equipment.map((item) => item.replace(/_/g, ' ').toLowerCase());

  return records
    .map((record) => {
      let score = 0;
      normalizedMuscles.forEach((muscle) => {
        if (record.searchText.includes(muscle)) score += 4;
      });
      normalizedEquipment.forEach((item) => {
        if (record.searchText.includes(item)) score += 2;
      });
      return { record, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((entry) => entry.record);
}

function filterCatalog(records: ExerciseLibraryRecord[], filters: ExerciseLibraryFilterState) {
  const query = normalizeFilterValue(filters.search);

  return records.filter((record) => {
    if (filters.category !== 'all' && normalizeFilterValue(record.category.name) !== normalizeFilterValue(filters.category)) {
      return false;
    }

    if (!matchesFilterValue(filters.muscle, record.primaryMuscles.concat(record.secondaryMuscles))) {
      return false;
    }

    if (!matchesFilterValue(filters.equipment, record.equipment)) {
      return false;
    }

    if (query && !record.searchText.includes(query)) {
      return false;
    }

    return true;
  });
}

function SourceStatus({
  source,
  isStale,
  syncStatus,
  lastSyncedAt,
  onRefresh,
}: {
  source: string;
  isStale: boolean;
  syncStatus: string;
  lastSyncedAt: string | null;
  onRefresh: () => void;
}) {
  const isRefreshing = syncStatus === 'refreshing' || syncStatus === 'loading';
  const isOfflineSource = source === 'snapshot' || source === 'legacy' || source === 'cache';

  return (
    <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
      <StateCard
        title={isOfflineSource ? 'Backup boot sequence active' : 'Live catalog available'}
        description={
          isOfflineSource
            ? 'The exercise library booted from a local source and will only promote live data after validation succeeds.'
            : 'The library is using live verified content from the public wger endpoint.'
        }
        icon={isOfflineSource ? CloudOff : Database}
        variant={isOfflineSource ? 'empty' : 'success'}
      />

      <Card className="border-border/50 bg-muted/50 dark:border-white/10 dark:bg-black/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Catalog source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Active source</span>
            <span className="uppercase tracking-[0.18em] text-muted-foreground/60">{source}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Stale</span>
            <span>{isStale ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Sync status</span>
            <span>{syncStatus}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last synced</span>
            <span>{lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}</span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh catalog
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ExerciseLibraryPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibraryRecord | null>(null);
  const [showCustomComposer, setShowCustomComposer] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrimaryMuscle, setCustomPrimaryMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<Equipment>('bodyweight');
  const [customCues, setCustomCues] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const { records, syncStatus, source, isStale, lastSyncedAt, error, refresh } = useExerciseLibrary();
  const { selections } = useWizardStore();
  const customExercises = useCustomExerciseStore((state) => state.customExercises);
  const addCustomExercise = useCustomExerciseStore((state) => state.addCustomExercise);

  const customRecords = useMemo(
    () => customExercises.map(adaptCustomExerciseRecord),
    [customExercises]
  );

  const categories = useMemo(
    () => buildOptions(records.map((record) => record.category.name)),
    [records]
  );
  const muscles = useMemo(
    () =>
      buildOptions(
        records.flatMap((record) =>
          record.primaryMuscles.concat(record.secondaryMuscles)
        )
      ),
    [records]
  );
  const equipment = useMemo(
    () => buildOptions(records.flatMap((record) => record.equipment)),
    [records]
  );

  const filteredRecords = useMemo(() => filterCatalog(records, filters), [records, filters]);
  const pagedRecords = useMemo(
    () => filteredRecords.slice(0, page * PAGE_SIZE),
    [filteredRecords, page]
  );
  const hasMore = pagedRecords.length < filteredRecords.length;

  const filteredCustomRecords = useMemo(() => filterCatalog(customRecords, filters), [customRecords, filters]);
  const recommendedRecords = useMemo(
    () => getRecommendedRecords(records, selections.targetMuscles, selections.equipment),
    [records, selections.equipment, selections.targetMuscles]
  );
  const relatedExercises = useMemo(
    () => (selectedExercise ? getRelatedExercises(selectedExercise, records) : []),
    [records, selectedExercise]
  );

  const handleFilterChange = (key: keyof ExerciseLibraryFilterState, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const handleRefresh = async () => {
    const nextState = await refresh(true);
    if (nextState?.source === 'live') {
      toast.success('Exercise library refreshed from wger');
    } else {
      toast.warning('Live refresh failed. Keeping the current local source.');
    }
  };

  const handleCreateCustomExercise = () => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      toast.error('Custom exercise name is required');
      return;
    }

    const cues = customCues
      .split(',')
      .map((cue) => cue.trim())
      .filter(Boolean);

    const created = addCustomExercise({
      name: trimmedName,
      primaryMuscles: [customPrimaryMuscle],
      equipment: [customEquipment],
      cues: cues.length > 0 ? cues : ['Custom movement'],
      description: customDescription.trim() || undefined,
    });

    const customRecord = adaptCustomExerciseRecord(created);
    setSelectedExercise(customRecord);
    setCustomName('');
    setCustomPrimaryMuscle('chest');
    setCustomEquipment('bodyweight');
    setCustomCues('');
    setCustomDescription('');
    setShowCustomComposer(false);
    toast.success('Custom exercise saved');
  };

  return (
    <div className="container-full space-y-8 py-8">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
              Exercise system
            </p>
            <div>
              <h1 className="bg-gradient-to-r from-foreground via-foreground to-foreground/65 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
                Premium exercise library
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Image-first exercise browsing backed by a resilient local-first boot sequence. The library upgrades from backup sources to live wger content only after validation passes.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/50 bg-muted/50 p-5 text-left backdrop-blur-xl dark:border-white/10 dark:bg-black/20 sm:text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/60">Catalog visibility</p>
            <p className="mt-2 text-3xl font-black text-foreground">{pagedRecords.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing {pagedRecords.length} of {filteredRecords.length} catalog exercises
            </p>
          </div>
        </div>

        <SourceStatus
          source={source}
          isStale={isStale}
          syncStatus={syncStatus}
          lastSyncedAt={lastSyncedAt}
          onRefresh={handleRefresh}
        />

        {error ? (
          <StateCard
            title="Catalog refresh issue"
            description={error}
            icon={ShieldCheck}
            variant="error"
          />
        ) : null}
      </section>

      {recommendedRecords.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Aligned with your setup</h2>
              <p className="text-sm text-muted-foreground">
                Suggested from the current catalog using your selected muscles and equipment.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendedRecords.map((exercise, index) => (
              <ExerciseLibraryCard
                key={`recommended-${exercise.id}`}
                exercise={exercise}
                onSelect={setSelectedExercise}
                index={index}
              />
            ))}
          </div>
        </section>
      ) : null}

      <ExerciseLibraryFilters
        filters={filters}
        categories={categories}
        muscles={muscles}
        equipment={equipment}
        onChange={handleFilterChange}
        onClear={() => {
          setFilters(INITIAL_FILTERS);
          setPage(1);
        }}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Verified catalog</h2>
            <p className="text-sm text-muted-foreground">
              Real exercise photos when available, muscle-map visuals when they are not, and branded fallback only as the last resort.
            </p>
          </div>
        </div>

        {syncStatus === 'loading' && records.length === 0 ? (
          <ExerciseSkeletonGrid count={8} />
        ) : filteredRecords.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {pagedRecords.map((exercise, index) => (
                <ExerciseLibraryCard
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={setSelectedExercise}
                  index={index}
                />
              ))}
            </div>
            {hasMore ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((value) => value + 1)}
                >
                  Load more exercises
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <StateCard
            title="No exercises matched"
            description="Adjust your search or filters to see more of the library."
            icon={Database}
            variant="empty"
          />
        )}
      </section>

      <section className="rounded-[28px] border border-border/50 bg-muted/50 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">My exercises</h2>
            <p className="text-sm text-muted-foreground">
              Your local exercises stay separate from the synced catalog and remain available offline.
            </p>
          </div>

          <Button
            variant={showCustomComposer ? 'outline' : 'default'}
            className="w-full sm:w-auto lg:min-w-[180px]"
            onClick={() => setShowCustomComposer((value) => !value)}
          >
            {showCustomComposer ? 'Close composer' : 'Add custom exercise'}
          </Button>
        </div>

        {showCustomComposer ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Exercise name</Label>
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Kettlebell anti-rotation row"
                  className="border-border/50 bg-muted/30 text-foreground dark:border-white/10 dark:bg-white/5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-description">Description</Label>
                <Input
                  id="custom-description"
                  value={customDescription}
                  onChange={(event) => setCustomDescription(event.target.value)}
                  placeholder="Short coaching note"
                  className="border-border/50 bg-muted/30 text-foreground dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label>Primary muscle</Label>
                <Select
                  value={customPrimaryMuscle}
                  onValueChange={(value) => setCustomPrimaryMuscle(value as MuscleGroup)}
                >
                  <SelectTrigger className="border-border/50 bg-muted/30 text-foreground dark:border-white/10 dark:bg-white/5">
                    <SelectValue placeholder="Select a muscle" />
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

              <div className="space-y-2">
                <Label>Equipment</Label>
                <Select
                  value={customEquipment}
                  onValueChange={(value) => setCustomEquipment(value as Equipment)}
                >
                  <SelectTrigger className="border-border/50 bg-muted/30 text-foreground dark:border-white/10 dark:bg-white/5">
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_OPTIONS.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2 xl:col-span-1">
                <Label htmlFor="custom-cues">Cues</Label>
                <Input
                  id="custom-cues"
                  value={customCues}
                  onChange={(event) => setCustomCues(event.target.value)}
                  placeholder="Brace core, keep elbow tucked"
                  className="border-border/50 bg-muted/30 text-foreground dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/50">
                Custom exercises stay local to this device and remain available even if the live catalog is unavailable.
              </p>
            </div>

            <div className="flex justify-end">
              <Button className="min-w-[220px]" onClick={handleCreateCustomExercise}>
                Save custom exercise
              </Button>
            </div>
          </div>
        ) : null}

        {filteredCustomRecords.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCustomRecords.map((exercise, index) => (
              <ExerciseLibraryCard
                key={exercise.id}
                exercise={exercise}
                onSelect={setSelectedExercise}
                index={index}
              />
            ))}
          </div>
        ) : customRecords.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            You have not created any custom exercises yet.
          </p>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No custom exercises match the current filters yet.
          </p>
        )}
      </section>

      <ExerciseLibraryDetailModal
        exercise={selectedExercise}
        relatedExercises={relatedExercises}
        onClose={() => setSelectedExercise(null)}
        onSelectRelated={setSelectedExercise}
      />
    </div>
  );
}
