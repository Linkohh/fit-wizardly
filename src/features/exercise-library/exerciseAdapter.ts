import type {
  Constraint,
  Equipment,
  Exercise,
  ExerciseCategory,
  ExerciseType,
  MovementPattern,
  MuscleGroup,
} from '@/types/fitness';
import type { ExerciseLibraryRecord } from './types';

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  abs: 'abs',
  biceps: 'biceps',
  brachialis: 'biceps',
  calves: 'calves',
  chest: 'chest',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'obliquus externus abdominis': 'obliques',
  quads: 'quads',
  shoulders: 'side_deltoid',
  soleus: 'calves',
  'serratus anterior': 'chest',
  trapezius: 'traps',
  triceps: 'triceps',
};

const EQUIPMENT_MAP: Record<string, Equipment> = {
  barbell: 'barbell',
  bench: 'bench',
  bodyweight: 'bodyweight',
  dumbbells: 'dumbbells',
  'gym mat': 'mat',
  'incline bench': 'bench',
  kettlebells: 'kettlebells',
  'pull-up bar': 'pullup_bar',
  'resistance band': 'band',
  'swiss ball': 'stability_ball',
  'sz-bar': 'ez_bar',
};

const STRENGTH_CATEGORIES = new Set([
  'arms',
  'back',
  'calves',
  'chest',
  'legs',
  'shoulders',
]);

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function mapMuscles(values: string[]) {
  return unique(
    values
      .map((value) => MUSCLE_MAP[normalizeKey(value)])
      .filter((value): value is MuscleGroup => Boolean(value))
  );
}

function mapEquipment(values: string[]) {
  const mapped = values
    .map((value) => EQUIPMENT_MAP[normalizeKey(value)])
    .filter((value): value is Equipment => Boolean(value));

  return unique(mapped.length > 0 ? mapped : (['bodyweight'] satisfies Equipment[]));
}

function mapCategory(record: ExerciseLibraryRecord): ExerciseCategory {
  const category = normalizeKey(record.category.name);
  if (category === 'abs') return 'core';
  if (category === 'cardio') return 'cardio';
  if (STRENGTH_CATEGORIES.has(category)) return 'strength';
  return 'other';
}

function inferExerciseType(category: ExerciseCategory): ExerciseType {
  if (category === 'cardio') return 'cardio';
  if (category === 'plyometric') return 'plyometric';
  return 'strength';
}

function inferPatterns(
  record: ExerciseLibraryRecord,
  primaryMuscles: MuscleGroup[],
  secondaryMuscles: MuscleGroup[]
): MovementPattern[] {
  const name = normalizeKey(record.name);
  const category = normalizeKey(record.category.name);
  const equipment = new Set(record.equipment.map(normalizeKey));
  const muscles = new Set([...primaryMuscles, ...secondaryMuscles]);
  const patterns: MovementPattern[] = [];

  if (category === 'legs') {
    if (name.includes('deadlift') || name.includes('good morning')) {
      patterns.push('hinge');
    } else if (name.includes('lunge') || name.includes('split squat')) {
      patterns.push('lunge');
    } else {
      patterns.push('squat');
    }
  }

  if (muscles.has('chest') || muscles.has('triceps')) {
    patterns.push(name.includes('dip') ? 'vertical_push' : 'horizontal_push');
  }

  if (muscles.has('lats') || muscles.has('upper_back') || muscles.has('biceps')) {
    patterns.push(
      name.includes('pull-up') ||
        name.includes('pullup') ||
        name.includes('chin') ||
        name.includes('lat') ||
        equipment.has('pull-up bar')
        ? 'vertical_pull'
        : 'horizontal_pull'
    );
  }

  if (category === 'abs' || muscles.has('abs') || muscles.has('obliques')) {
    patterns.push(name.includes('twist') || name.includes('rotation') ? 'rotation' : 'isolation');
  }

  return unique(patterns.length > 0 ? patterns : ['isolation']);
}

function extractCues(record: ExerciseLibraryRecord) {
  const description = record.description.trim();
  if (!description) return [];

  return description
    .split(/(?:\.\s+|-\s*)/)
    .map((cue) => cue.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function adaptExerciseLibraryRecordToExercise(
  record: ExerciseLibraryRecord
): Exercise {
  const primaryMuscles = mapMuscles(record.primaryMuscles);
  const secondaryMuscles = mapMuscles(record.secondaryMuscles).filter(
    (muscle) => !primaryMuscles.includes(muscle)
  );
  const category = mapCategory(record);

  return {
    id: record.id,
    name: record.name,
    primaryMuscles,
    secondaryMuscles,
    equipment: mapEquipment(record.equipment),
    patterns: inferPatterns(record, primaryMuscles, secondaryMuscles),
    type: inferExerciseType(category),
    contraindications: [] as Constraint[],
    cues: extractCues(record),
    imageUrl: record.imageUrl ?? undefined,
    description: record.description || undefined,
    difficulty: 'All Levels',
    category,
    subcategory: record.category.slug,
    source: record.source,
    sourceId: record.sourceId ? String(record.sourceId) : record.sourceUuid ?? undefined,
  };
}

export function adaptExerciseLibraryRecordsToExercises(
  records: ExerciseLibraryRecord[]
) {
  return records
    .map(adaptExerciseLibraryRecordToExercise)
    .filter((exercise) => exercise.primaryMuscles.length > 0);
}
