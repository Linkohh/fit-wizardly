import { BACK_MUSCLE_PATHS, FRONT_MUSCLE_PATHS } from '@/data/anatomyPaths';
import type {
  ExerciseLibraryMediaVariant,
  ExerciseLibraryMediaView,
  ExerciseLibraryRecord,
  ExerciseLibraryResolvedMedia,
} from './types';
import { findExerciseLibraryMediaOverride } from './media-overrides';
import { normalizeFilterValue } from './utils';

const FRONT_KEYS = new Set(Object.keys(FRONT_MUSCLE_PATHS));
const BACK_KEYS = new Set(Object.keys(BACK_MUSCLE_PATHS));

const MUSCLE_LABEL_MAP: Record<string, string[]> = {
  chest: ['chest'],
  pectorals: ['chest'],
  shoulders: ['front_deltoid', 'side_deltoid', 'rear_deltoid'],
  'front deltoid': ['front_deltoid'],
  'front deltoids': ['front_deltoid'],
  'anterior deltoid': ['front_deltoid'],
  'anterior deltoids': ['front_deltoid'],
  'side deltoid': ['side_deltoid'],
  'side deltoids': ['side_deltoid'],
  'lateral deltoid': ['side_deltoid'],
  'lateral deltoids': ['side_deltoid'],
  'rear deltoid': ['rear_deltoid'],
  'rear deltoids': ['rear_deltoid'],
  'posterior deltoid': ['rear_deltoid'],
  'posterior deltoids': ['rear_deltoid'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  abs: ['abs'],
  abdominals: ['abs'],
  obliques: ['obliques'],
  quadriceps: ['quads'],
  quadricep: ['quads'],
  quads: ['quads'],
  'quadriceps femoris': ['quads'],
  'hip flexor': ['hip_flexors'],
  'hip flexors': ['hip_flexors'],
  adductors: ['adductors'],
  'upper back': ['upper_back'],
  lats: ['lats'],
  lat: ['lats'],
  'latissimus dorsi': ['lats'],
  'lower back': ['lower_back'],
  erectors: ['lower_back'],
  'erector spinae': ['lower_back'],
  glutes: ['glutes'],
  glute: ['glutes'],
  hamstrings: ['hamstrings'],
  calves: ['calves'],
  calf: ['calves'],
  traps: ['traps'],
  trapezius: ['traps'],
  neck: ['neck'],
};

function normalizeMediaKey(value: string) {
  return normalizeFilterValue(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueKeys(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function mapMuscleLabelsToKeys(labels: string[]) {
  return uniqueKeys(
    labels.flatMap((label) => MUSCLE_LABEL_MAP[normalizeMediaKey(label)] ?? [])
  );
}

function getViewForKey(key: string): ExerciseLibraryMediaView | null {
  if (FRONT_KEYS.has(key)) return 'front';
  if (BACK_KEYS.has(key)) return 'back';
  return null;
}

function getAvailableViews(primaryKeys: string[], secondaryKeys: string[]) {
  return uniqueKeys(
    uniqueKeys(primaryKeys.concat(secondaryKeys))
      .map((key) => getViewForKey(key))
      .filter((view): view is ExerciseLibraryMediaView => view !== null)
  );
}

function chooseDefaultView(primaryKeys: string[], secondaryKeys: string[]) {
  let frontScore = 0;
  let backScore = 0;

  const applyScore = (keys: string[], weight: number) => {
    keys.forEach((key) => {
      const view = getViewForKey(key);
      if (view === 'front') frontScore += weight;
      if (view === 'back') backScore += weight;
    });
  };

  applyScore(primaryKeys, 2);
  applyScore(secondaryKeys, 1);

  if (frontScore > backScore) return 'front';
  if (backScore > frontScore) return 'back';

  const firstPrimaryView = getViewForKey(primaryKeys[0] ?? '');
  return firstPrimaryView ?? 'front';
}

function buildAnatomyMedia(
  exercise: ExerciseLibraryRecord,
  preferredView: ExerciseLibraryMediaView | null,
  displayName: string
): ExerciseLibraryResolvedMedia | null {
  const primaryKeys = mapMuscleLabelsToKeys(exercise.primaryMuscles);
  const secondaryKeys = mapMuscleLabelsToKeys(exercise.secondaryMuscles).filter(
    (key) => !primaryKeys.includes(key)
  );
  const availableViews = getAvailableViews(primaryKeys, secondaryKeys);

  if (availableViews.length === 0) {
    return null;
  }

  const defaultView = chooseDefaultView(primaryKeys, secondaryKeys);
  const activeView =
    preferredView && availableViews.includes(preferredView)
      ? preferredView
      : defaultView;

  return {
    variant: 'anatomy',
    label: 'Muscle map',
    imageUrl: null,
    alt: `${displayName} muscle map`,
    anatomy: {
      primaryKeys,
      secondaryKeys,
      defaultView,
      activeView,
      availableViews,
    },
  };
}

function buildBrandFallback(
  exercise: ExerciseLibraryRecord,
  displayName: string
): ExerciseLibraryResolvedMedia {
  return {
    variant: 'brand',
    label: 'Fallback',
    imageUrl: null,
    alt: `${displayName} fallback visual`,
    anatomy: null,
  };
}

export function resolveExerciseLibraryMedia(
  exercise: ExerciseLibraryRecord,
  options?: {
    disabledVariants?: ExerciseLibraryMediaVariant[];
    preferredView?: ExerciseLibraryMediaView | null;
    displayName?: string;
  }
): ExerciseLibraryResolvedMedia {
  const disabledVariants = new Set(options?.disabledVariants ?? []);
  const displayName = options?.displayName ?? exercise.name;

  if (!disabledVariants.has('wger') && exercise.imageUrl) {
    return {
      variant: 'wger',
      label: 'Image',
      imageUrl: exercise.imageUrl,
      alt: displayName,
      anatomy: null,
    };
  }

  const override = findExerciseLibraryMediaOverride(
    exercise.sourceId,
    exercise.slug
  );

  if (!disabledVariants.has('override') && override) {
    return {
      variant: 'override',
      label: 'Curated',
      imageUrl: override.imageUrl,
      alt: override.alt ?? displayName,
      anatomy: null,
    };
  }

  if (!disabledVariants.has('anatomy')) {
    const anatomyMedia = buildAnatomyMedia(
      exercise,
      options?.preferredView ?? null,
      displayName
    );
    if (anatomyMedia) {
      return anatomyMedia;
    }
  }

  return buildBrandFallback(exercise, displayName);
}
