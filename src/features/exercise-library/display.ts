import type {
  ExerciseLibraryDisplayContent,
  ExerciseLibraryLocalizedEntry,
  ExerciseLibraryRecord,
} from './types';
import { normalizeExerciseLibraryLocale } from './locales';
import { uniqueStrings } from './utils';

function hasLocalizedValue(
  content: ExerciseLibraryLocalizedEntry | undefined
): content is ExerciseLibraryLocalizedEntry {
  if (!content) return false;

  return (
    typeof content.name === 'string' ||
    typeof content.description === 'string' ||
    Array.isArray(content.aliases)
  );
}

function getFilteredAliases(name: string, aliases: string[]) {
  const normalizedName = name.trim().toLowerCase();

  return uniqueStrings(
    aliases
      .map((alias) => alias.trim())
      .filter(
        (alias) => alias !== '' && alias.toLowerCase() !== normalizedName
      )
  );
}

export function resolveExerciseLibraryDisplayContent(
  record: ExerciseLibraryRecord,
  locale: string | null | undefined
): ExerciseLibraryDisplayContent {
  const normalizedLocale = normalizeExerciseLibraryLocale(locale);
  const localizedEntry = record.localizedContent?.[normalizedLocale];
  const hasLocalizedEntry = hasLocalizedValue(localizedEntry);
  const resolvedName =
    localizedEntry?.name?.trim() || record.name || 'Exercise';
  const resolvedDescription =
    localizedEntry?.description?.trim() || record.description || '';
  const resolvedAliases = getFilteredAliases(
    resolvedName,
    hasLocalizedEntry
      ? uniqueStrings([
          ...(localizedEntry?.aliases ?? []),
          ...(record.aliases ?? []),
        ])
      : record.aliases ?? []
  );

  return {
    name: resolvedName,
    description: resolvedDescription,
    aliases: resolvedAliases,
    resolvedLocale: hasLocalizedEntry ? normalizedLocale : 'default',
  };
}
