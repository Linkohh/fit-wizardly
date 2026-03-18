import type { ExerciseLibraryLocale } from './types';

export const SUPPORTED_EXERCISE_LIBRARY_LOCALES = [
  'en',
  'es',
  'pt',
  'de',
] as const satisfies readonly ExerciseLibraryLocale[];

export const WGER_LANGUAGE_BY_LOCALE: Record<ExerciseLibraryLocale, number> = {
  de: 1,
  en: 2,
  es: 4,
  pt: 7,
};

export function isSupportedExerciseLibraryLocale(
  value: string
): value is ExerciseLibraryLocale {
  return SUPPORTED_EXERCISE_LIBRARY_LOCALES.includes(
    value as ExerciseLibraryLocale
  );
}

export function normalizeExerciseLibraryLocale(
  value: string | null | undefined
): ExerciseLibraryLocale {
  const normalized = value?.split('-')[0]?.toLowerCase() ?? 'en';
  return isSupportedExerciseLibraryLocale(normalized) ? normalized : 'en';
}
