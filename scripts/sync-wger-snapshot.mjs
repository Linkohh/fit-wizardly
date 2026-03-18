import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_URL = 'https://wger.de/api/v2/exerciseinfo/';
const PAGE_SIZE = 100;
const MAX_PAGE_COUNT = 30;
const SUPPORTED_LOCALES = ['en', 'es', 'pt', 'de'];
const WGER_LANGUAGE_BY_LOCALE = {
  de: 1,
  en: 2,
  es: 4,
  pt: 7,
};

const ROOT_DIR = process.cwd();
const SNAPSHOT_PATH = path.join(
  ROOT_DIR,
  'src/features/exercise-library/data/wger-snapshot.json'
);
const REPORT_PATH = path.join(ROOT_DIR, 'docs/exercise-library-wger.md');

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(value) {
  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function formatLabel(value) {
  const normalized = value
    .replace(/^none \(bodyweight exercise\)$/i, 'Bodyweight')
    .replace(/^dumbbell$/i, 'Dumbbells')
    .replace(/^barbell$/i, 'Barbell')
    .replace(/^kettlebell$/i, 'Kettlebells');

  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getBestTranslation(translations) {
  const english = translations.find(
    (translation) =>
      translation.language === WGER_LANGUAGE_BY_LOCALE.en &&
      typeof translation.name === 'string' &&
      translation.name.trim() !== ''
  );

  if (english) return english;

  return (
    translations.find(
      (translation) =>
        typeof translation.name === 'string' && translation.name.trim() !== ''
    ) ?? null
  );
}

function getTranslationForLanguage(translations, languageId) {
  const namedTranslation = translations.find(
    (translation) =>
      translation.language === languageId &&
      typeof translation.name === 'string' &&
      translation.name.trim() !== ''
  );

  if (namedTranslation) return namedTranslation;

  return (
    translations.find((translation) => translation.language === languageId) ??
    null
  );
}

function normalizeAliases(translation) {
  return unique(
    (translation.aliases ?? []).map((alias) => alias.alias?.trim?.() ?? '')
  );
}

function normalizeLocalizedContent(translations) {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => {
      const translation = getTranslationForLanguage(
        translations,
        WGER_LANGUAGE_BY_LOCALE[locale]
      );

      if (!translation) return null;

      const name = translation.name?.trim?.() ?? '';
      const description = translation.description
        ? stripHtml(translation.description)
        : '';

      if (name === '' && description === '') return null;

      return [
        locale,
        {
          name,
          description,
          aliases: normalizeAliases(translation),
        },
      ];
    }).filter(Boolean)
  );
}

function normalizeRecord(record, generatedAt) {
  const translation = getBestTranslation(record.translations ?? []);
  const localizedContent = normalizeLocalizedContent(record.translations ?? []);
  const aliases = unique(
    Object.values(localizedContent).flatMap((entry) => entry.aliases ?? [])
  );
  const name = translation?.name?.trim() || `Exercise ${record.id}`;
  const description = translation?.description ? stripHtml(translation.description) : '';
  const categoryName = record.category?.name?.trim() || 'Uncategorized';
  const primaryMuscles = unique(
    (record.muscles ?? []).map((muscle) =>
      formatLabel(muscle.name_en || muscle.name || '')
    )
  );
  const secondaryMuscles = unique(
    (record.muscles_secondary ?? []).map((muscle) =>
      formatLabel(muscle.name_en || muscle.name || '')
    )
  );
  const equipment = unique(
    (record.equipment ?? []).map((item) => formatLabel(item.name || ''))
  );
  const imageUrls = unique(
    [...(record.images ?? [])]
      .sort((left, right) => Number(Boolean(right.is_main)) - Number(Boolean(left.is_main)))
      .map((image) => image.image)
  );

  return {
    id: `wger:${record.id}`,
    source: 'wger',
    sourceId: record.id,
    sourceUuid: record.uuid ?? null,
    slug: `${slugify(name) || `exercise-${record.id}`}-${record.id}`,
    name,
    description,
    category: {
      id: String(record.category?.id ?? slugify(categoryName)),
      name: categoryName,
      slug: slugify(categoryName) || `category-${record.id}`,
    },
    primaryMuscles,
    secondaryMuscles,
    equipment,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    licenseInfo: record.license
      ? {
          id: String(record.license.id),
          fullName: record.license.full_name,
          shortName: record.license.short_name,
          url: record.license.url,
          author: record.license_author ?? null,
          authorHistory: Array.isArray(record.total_authors_history)
            ? record.total_authors_history.filter(Boolean)
            : [],
        }
      : null,
    aliases,
    localizedContent,
    searchText: [
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
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
    lastSyncedAt: generatedAt,
  };
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`wger request failed: HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchAllExercises() {
  const records = [];
  let url = `${API_URL}?limit=${PAGE_SIZE}`;
  let expectedCount = null;

  for (let pageIndex = 0; pageIndex < MAX_PAGE_COUNT && url; pageIndex += 1) {
    const page = await fetchPage(url);
    if (!Array.isArray(page.results) || typeof page.count !== 'number') {
      throw new Error('Unexpected wger response shape');
    }

    if (expectedCount === null) {
      expectedCount = page.count;
    }

    records.push(...page.results);
    url = page.next || '';
  }

  if (url) {
    throw new Error('wger pagination did not complete before the page limit');
  }

  if (typeof expectedCount === 'number' && records.length < expectedCount) {
    throw new Error('wger pagination completed with fewer records than expected');
  }

  return records;
}

async function writeReport(recordCount, imageBackedCount) {
  const report = `# wger Exercise Library Integration Report

Last generated: ${new Date().toISOString()}

## Endpoint verification
- Public endpoint used at runtime: \`GET /api/v2/exerciseinfo/\`
- Public verified backup-only endpoints: \`GET /api/v2/exerciseimage/\`, \`GET /api/v2/muscle/\`
- Authentication required for read-only exercise content: No
- Runtime source of truth: official public \`exerciseinfo\` endpoint with pagination
- Exercise records already include image metadata: Yes
- Secondary image endpoint required in v1: No

## Verified live wrapper shape
- \`count\`
- \`next\`
- \`previous\`
- \`results\`

## Verified \`exerciseinfo\` fields in use
- \`id\`, \`uuid\`
- \`category\`
- \`muscles\`
- \`muscles_secondary\`
- \`equipment\`
- \`license\`, \`license_author\`
- \`images\`
- \`translations\`
- \`total_authors_history\`

## Normalized internal model
- \`id = "wger:{id}"\`
- \`source = "wger"\`
- \`sourceId\`, \`sourceUuid\`, \`slug\`
- \`name\`, \`description\`
- \`aliases\`, \`localizedContent\`
- \`category = { id, name, slug }\`
- \`primaryMuscles\`, \`secondaryMuscles\`
- \`equipment\`
- \`imageUrl\`, \`imageUrls\`
- \`licenseInfo\`
- \`searchText\`
- \`lastSyncedAt\`

## Snapshot summary
- Normalized record count: ${recordCount}
- Records with at least one image: ${imageBackedCount}
- Records without an image: ${Math.max(recordCount - imageBackedCount, 0)}

## Integration flow
1. Boot from persisted last-known-good normalized cache when available
2. Fall back to the bundled normalized wger snapshot when cache is unavailable
3. Fall back to the adapted curated local dataset when snapshot is unavailable
4. Start a background live sync only after the UI is already usable
5. Promote live data only after pagination, normalization, and minimum-record validation succeed

## Boot sequence
1. Persisted last-known-good normalized cache
2. Bundled normalized wger snapshot
3. Adapted current curated local dataset
4. Background live sync after UI is already usable

## Risk notes
- Licensing risk: exercise text and images must be reviewed per-record before commercial or closed-source launch
- Schema drift risk: live sync is rejected when required fields or pagination shape are invalid
- Missing-image risk: cards keep their media area and render the fallback heartbeat hero instead
- Uptime risk: the library is local-first and does not require the live API to render

## Licensing note
- wger application code is AGPL
- exercise content licensing is separate and must be reviewed per record metadata
- this integration retains \`licenseInfo\` on normalized records
- using the public API from a separate app does not, by itself, require this app's codebase to be open sourced
`;

  await fs.writeFile(REPORT_PATH, report, 'utf8');
}

async function main() {
  const generatedAt = new Date().toISOString();
  const rawRecords = await fetchAllExercises();
  const normalizedRecords = rawRecords.map((record) => normalizeRecord(record, generatedAt));

  const payload = {
    generatedAt,
    records: normalizedRecords,
  };

  await fs.writeFile(SNAPSHOT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeReport(
    normalizedRecords.length,
    normalizedRecords.filter((record) => record.imageUrl).length
  );

  console.log(
    `Generated wger snapshot with ${normalizedRecords.length} records at ${SNAPSHOT_PATH}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
