import type { NormalizedExercise, WgerExerciseResponse, FreeExerciseDbEntry } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function normalizeWgerExercise(
  raw: WgerExerciseResponse
): NormalizedExercise {
  const enTranslation = raw.translations?.find((t) => t.language === 2) ||
    raw.translations?.[0];
  const name = enTranslation?.name || `Exercise ${raw.id}`;
  const rawDescription = enTranslation?.description || '';
  const description = rawDescription ? stripHtml(rawDescription) : undefined;

  return {
    id: `wger-${raw.id}`,
    name,
    targetMuscles: raw.muscles.map((m) => m.name),
    equipment: raw.equipment?.map((e) => e.name),
    description: description || undefined,
    source: 'wger',
  };
}

const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  expert: 'advanced',
};

export function normalizeFreeExerciseDbExercise(
  raw: FreeExerciseDbEntry
): NormalizedExercise {
  const equipment =
    !raw.equipment || raw.equipment === 'body only'
      ? []
      : [raw.equipment];

  return {
    id: `free-exercise-db-${raw.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: raw.name,
    targetMuscles: raw.primaryMuscles,
    equipment,
    difficulty: difficultyMap[raw.level],
    exerciseType: raw.category || undefined,
    description: raw.instructions.length > 0 ? raw.instructions.join(' ') : undefined,
    source: 'free-exercise-db',
  };
}
