import type { Exercise } from '@/types/fitness';
import { WGER_LANGUAGE_BY_LOCALE } from './locales';
import type {
  ExerciseLibraryLocalizedEntry,
  ExerciseLibraryLocale,
  ExerciseLibraryRecord,
  ExerciseLicenseInfo,
  WgerExerciseInfoRecord,
  WgerExerciseTranslation,
} from './types';
import {
  createSearchText,
  formatExerciseLabel,
  slugify,
  stripHtml,
  uniqueStrings,
} from './utils';

function getTranslationAliases(translation: WgerExerciseTranslation) {
  return uniqueStrings(
    translation.aliases.map((alias) => alias.alias.trim())
  );
}

function getBestTranslation(translations: WgerExerciseTranslation[]) {
  const english = translations.find(
    (translation) =>
      translation.language === WGER_LANGUAGE_BY_LOCALE.en &&
      translation.name.trim() !== ''
  );
  if (english) return english;

  return translations.find((translation) => translation.name.trim() !== '') ?? null;
}

function getTranslationForLanguage(
  translations: WgerExerciseTranslation[],
  languageId: number
) {
  const namedTranslation = translations.find(
    (translation) =>
      translation.language === languageId && translation.name.trim() !== ''
  );

  if (namedTranslation) return namedTranslation;

  return translations.find((translation) => translation.language === languageId) ?? null;
}

function normalizeLocalizedContent(
  translations: WgerExerciseTranslation[]
): Partial<Record<ExerciseLibraryLocale, ExerciseLibraryLocalizedEntry>> {
  const entries = Object.entries(WGER_LANGUAGE_BY_LOCALE).map(
    ([locale, languageId]) => {
      const translation = getTranslationForLanguage(translations, languageId);
      if (!translation) return null;

      const name = translation.name.trim();
      const description = translation.description
        ? stripHtml(translation.description)
        : '';

      if (name === '' && description === '') return null;

      return [
        locale,
        {
          name,
          description,
          aliases: getTranslationAliases(translation),
        },
      ] as const;
    }
  );

  return Object.fromEntries(
    entries.filter(
      (
        entry
      ): entry is readonly [ExerciseLibraryLocale, ExerciseLibraryLocalizedEntry] =>
        entry !== null
    )
  );
}

function normalizeLicense(
  record: Pick<WgerExerciseInfoRecord, 'license' | 'license_author' | 'author_history' | 'total_authors_history'>
): ExerciseLicenseInfo | null {
  if (!record.license) return null;

  const authorHistory = record.total_authors_history.length
    ? record.total_authors_history
    : record.author_history;

  return {
    id: String(record.license.id),
    fullName: record.license.full_name,
    shortName: record.license.short_name,
    url: record.license.url,
    author: record.license_author,
    authorHistory: authorHistory.filter(Boolean),
  };
}

function normalizeImageUrls(record: WgerExerciseInfoRecord) {
  const sortedImages = [...record.images].sort((left, right) => {
    if (left.is_main === right.is_main) return 0;
    return left.is_main ? -1 : 1;
  });

  return uniqueStrings(sortedImages.map((image) => image.image));
}

export function normalizeWgerExercise(
  record: WgerExerciseInfoRecord,
  syncedAt: string
): ExerciseLibraryRecord {
  const translation = getBestTranslation(record.translations);
  const localizedContent = normalizeLocalizedContent(record.translations);
  const aliases = uniqueStrings(
    Object.values(localizedContent).flatMap((entry) => entry.aliases)
  );
  const name = translation?.name?.trim() || `Exercise ${record.id}`;
  const description = translation?.description ? stripHtml(translation.description) : '';
  const categoryName = record.category?.name?.trim() || 'Uncategorized';
  const categorySlug = slugify(categoryName || `category-${record.id}`);
  const primaryMuscles = uniqueStrings(
    record.muscles.map((muscle) => formatExerciseLabel(muscle.name_en || muscle.name))
  );
  const secondaryMuscles = uniqueStrings(
    record.muscles_secondary.map((muscle) => formatExerciseLabel(muscle.name_en || muscle.name))
  );
  const equipment = uniqueStrings(
    record.equipment.map((item) => formatExerciseLabel(item.name))
  );
  const imageUrls = normalizeImageUrls(record);
  const licenseInfo = normalizeLicense(record);
  const slugBase = slugify(name) || `exercise-${record.id}`;

  return {
    id: `wger:${record.id}`,
    source: 'wger',
    sourceId: record.id,
    sourceUuid: record.uuid,
    slug: `${slugBase}-${record.id}`,
    name,
    description,
    category: {
      id: String(record.category?.id ?? categorySlug),
      name: categoryName,
      slug: categorySlug,
    },
    primaryMuscles,
    secondaryMuscles,
    equipment,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    licenseInfo,
    aliases,
    localizedContent,
    searchText: createSearchText([
      name,
      description,
      categoryName,
      primaryMuscles.join(' '),
      secondaryMuscles.join(' '),
      equipment.join(' '),
      aliases.join(' '),
      Object.values(localizedContent)
        .map((entry) => entry.name)
        .join(' '),
    ]),
    lastSyncedAt: syncedAt,
  };
}

export function adaptLegacyExercise(
  exercise: Exercise,
  source: ExerciseLibraryRecord['source'] = 'legacy'
): ExerciseLibraryRecord {
  const categoryName = formatExerciseLabel(exercise.category || 'Other');
  const primaryMuscles = uniqueStrings(exercise.primaryMuscles.map(formatExerciseLabel));
  const secondaryMuscles = uniqueStrings(exercise.secondaryMuscles.map(formatExerciseLabel));
  const equipment = uniqueStrings(exercise.equipment.map(formatExerciseLabel));
  const imageUrls = uniqueStrings([
    exercise.imageUrl ?? '',
    exercise.gifUrl ?? '',
    exercise.videoThumbnailUrl ?? '',
  ]);

  return {
    id: exercise.id,
    source,
    sourceId: null,
    sourceUuid: null,
    slug: slugify(exercise.name) || exercise.id,
    name: exercise.name,
    description: exercise.description?.trim() || '',
    category: {
      id: exercise.category || 'other',
      name: categoryName,
      slug: slugify(categoryName) || 'other',
    },
    primaryMuscles,
    secondaryMuscles,
    equipment,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    licenseInfo: null,
    aliases: [],
    localizedContent: {},
    searchText: createSearchText([
      exercise.name,
      exercise.description,
      categoryName,
      primaryMuscles.join(' '),
      secondaryMuscles.join(' '),
      equipment.join(' '),
    ]),
    lastSyncedAt: null,
  };
}

export function validateNormalizedRecords(records: ExerciseLibraryRecord[], minimumCount = 200) {
  if (!Array.isArray(records)) return false;
  if (records.length < minimumCount) return false;

  return records.every((record) => {
    const hasValidLocalizedContent =
      record.localizedContent === undefined ||
      (typeof record.localizedContent === 'object' &&
        record.localizedContent !== null &&
        !Array.isArray(record.localizedContent) &&
        Object.values(record.localizedContent).every((entry) => {
          if (typeof entry !== 'object' || entry === null) return false;

          return (
            typeof entry.name === 'string' &&
            typeof entry.description === 'string' &&
            Array.isArray(entry.aliases)
          );
        }));

    return (
      typeof record.id === 'string' &&
      typeof record.name === 'string' &&
      typeof record.category?.name === 'string' &&
      Array.isArray(record.primaryMuscles) &&
      Array.isArray(record.secondaryMuscles) &&
      Array.isArray(record.equipment) &&
      Array.isArray(record.imageUrls) &&
      (record.aliases === undefined || Array.isArray(record.aliases)) &&
      hasValidLocalizedContent
    );
  });
}
