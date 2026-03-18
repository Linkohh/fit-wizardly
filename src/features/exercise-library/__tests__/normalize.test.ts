import { describe, expect, it } from 'vitest';
import { normalizeWgerExercise, validateNormalizedRecords } from '../normalize';
import type { ExerciseLibraryRecord, WgerExerciseInfoRecord } from '../types';

function buildWgerRecord(
  overrides: Partial<WgerExerciseInfoRecord> = {}
): WgerExerciseInfoRecord {
  return {
    id: 42,
    uuid: 'exercise-uuid',
    created: '2025-01-01T00:00:00.000Z',
    last_update: '2025-01-02T00:00:00.000Z',
    last_update_global: '2025-01-02T00:00:00.000Z',
    category: {
      id: 8,
      name: 'Arms',
    },
    muscles: [
      {
        id: 1,
        name: 'Biceps',
        name_en: 'biceps',
        is_front: true,
        image_url_main: '',
        image_url_secondary: '',
      },
    ],
    muscles_secondary: [
      {
        id: 2,
        name: 'Forearms',
        name_en: 'forearms',
        is_front: true,
        image_url_main: '',
        image_url_secondary: '',
      },
    ],
    equipment: [
      {
        id: 3,
        name: 'dumbbell',
      },
    ],
    license: {
      id: 4,
      full_name: 'Creative Commons Attribution Share Alike 3',
      short_name: 'CC-BY-SA 3.0',
      url: 'https://example.com/license',
    },
    license_author: 'wger community',
    images: [
      {
        id: 5,
        uuid: 'image-uuid',
        exercise: 42,
        exercise_uuid: 'exercise-uuid',
        image: 'https://cdn.example.com/exercise-main.jpg',
        is_main: true,
        style: 'photo',
        license: 4,
        license_title: 'CC-BY-SA 3.0',
        license_object_url: '',
        license_author: 'wger community',
        license_author_url: '',
        license_derivative_source_url: '',
        author_history: ['wger community'],
      },
    ],
    translations: [
      {
        id: 6,
        uuid: 'translation-es',
        name: 'Curl de biceps',
        exercise: 42,
        description: '<p>Descripcion en espanol</p>',
        created: '2025-01-01T00:00:00.000Z',
        language: 4,
        aliases: [],
        notes: [],
        license: null,
        license_title: '',
        license_object_url: '',
        license_author: null,
        license_author_url: '',
        license_derivative_source_url: '',
        author_history: [],
      },
      {
        id: 7,
        uuid: 'translation-en',
        name: 'Biceps Curl',
        exercise: 42,
        description: '<p>Lift<br />slowly</p><ul><li>Control the lowering phase</li></ul>',
        created: '2025-01-01T00:00:00.000Z',
        language: 2,
        aliases: [],
        notes: [],
        license: null,
        license_title: '',
        license_object_url: '',
        license_author: null,
        license_author_url: '',
        license_derivative_source_url: '',
        author_history: [],
      },
    ],
    variations: null,
    videos: [],
    author_history: ['first author'],
    total_authors_history: ['first author', 'second author'],
    ...overrides,
  };
}

function buildNormalizedRecord(overrides: Partial<ExerciseLibraryRecord> = {}): ExerciseLibraryRecord {
  return {
    id: 'wger:42',
    source: 'wger',
    sourceId: 42,
    sourceUuid: 'exercise-uuid',
    slug: 'biceps-curl-42',
    name: 'Biceps Curl',
    description: 'Lift slowly',
    category: {
      id: '8',
      name: 'Arms',
      slug: 'arms',
    },
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    equipment: ['Dumbbells'],
    imageUrl: 'https://cdn.example.com/exercise-main.jpg',
    imageUrls: ['https://cdn.example.com/exercise-main.jpg'],
    licenseInfo: {
      id: '4',
      fullName: 'Creative Commons Attribution Share Alike 3',
      shortName: 'CC-BY-SA 3.0',
      url: 'https://example.com/license',
      author: 'wger community',
      authorHistory: ['first author', 'second author'],
    },
    aliases: [],
    localizedContent: {},
    searchText: 'biceps curl arms biceps forearms dumbbells',
    lastSyncedAt: '2025-01-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('normalizeWgerExercise', () => {
  it('prefers the English translation and strips HTML from the description', () => {
    const record = normalizeWgerExercise(
      buildWgerRecord(),
      '2025-01-03T00:00:00.000Z'
    );

    expect(record.name).toBe('Biceps Curl');
    expect(record.description).toContain('Lift slowly');
    expect(record.description).toContain('Control the lowering phase');
    expect(record.description).not.toContain('<p>');
    expect(record.primaryMuscles).toEqual(['Biceps']);
    expect(record.equipment).toEqual(['Dumbbells']);
    expect(record.localizedContent.en).toEqual({
      name: 'Biceps Curl',
      description: 'Lift slowly • Control the lowering phase',
      aliases: [],
    });
    expect(record.localizedContent.es).toEqual({
      name: 'Curl de biceps',
      description: 'Descripcion en espanol',
      aliases: [],
    });
  });

  it('falls back to the first non-empty translation when English is missing', () => {
    const record = normalizeWgerExercise(
      buildWgerRecord({
        translations: [
          {
            id: 8,
            uuid: 'translation-fr',
            name: 'Curl biceps',
            exercise: 42,
            description: '<p>Version francaise</p>',
            created: '2025-01-01T00:00:00.000Z',
            language: 12,
            aliases: [],
            notes: [],
            license: null,
            license_title: '',
            license_object_url: '',
            license_author: null,
            license_author_url: '',
            license_derivative_source_url: '',
            author_history: [],
          },
        ],
      }),
      '2025-01-03T00:00:00.000Z'
    );

    expect(record.name).toBe('Curl biceps');
    expect(record.description).toBe('Version francaise');
  });

  it('collects supported localized aliases and adds them to search text', () => {
    const record = normalizeWgerExercise(
      buildWgerRecord({
        translations: [
          {
            id: 6,
            uuid: 'translation-en',
            name: 'Step-Up',
            exercise: 42,
            description: '<p>Use a box.</p>',
            created: '2025-01-01T00:00:00.000Z',
            language: 2,
            aliases: [
              { id: 1, uuid: 'alias-1', alias: 'Chair steps' },
              { id: 2, uuid: 'alias-2', alias: 'Chair steps' },
            ],
            notes: [],
            license: null,
            license_title: '',
            license_object_url: '',
            license_author: null,
            license_author_url: '',
            license_derivative_source_url: '',
            author_history: [],
          },
          {
            id: 7,
            uuid: 'translation-pt',
            name: 'Subida no banco',
            exercise: 42,
            description: '<p>Controle a descida</p>',
            created: '2025-01-01T00:00:00.000Z',
            language: 7,
            aliases: [
              { id: 3, uuid: 'alias-3', alias: 'Step onto bench' },
            ],
            notes: [],
            license: null,
            license_title: '',
            license_object_url: '',
            license_author: null,
            license_author_url: '',
            license_derivative_source_url: '',
            author_history: [],
          },
        ],
      }),
      '2025-01-03T00:00:00.000Z'
    );

    expect(record.aliases).toEqual(['Chair steps', 'Step onto bench']);
    expect(record.localizedContent.pt).toEqual({
      name: 'Subida no banco',
      description: 'Controle a descida',
      aliases: ['Step onto bench'],
    });
    expect(record.searchText).toContain('chair steps');
    expect(record.searchText).toContain('subida no banco');
  });

  it('handles missing images without breaking the normalized record', () => {
    const record = normalizeWgerExercise(
      buildWgerRecord({
        images: [],
        license: null,
        license_author: null,
      }),
      '2025-01-03T00:00:00.000Z'
    );

    expect(record.imageUrl).toBeNull();
    expect(record.imageUrls).toEqual([]);
    expect(record.licenseInfo).toBeNull();
  });
});

describe('validateNormalizedRecords', () => {
  it('accepts valid normalized records', () => {
    expect(validateNormalizedRecords([buildNormalizedRecord()], 1)).toBe(true);
  });

  it('rejects malformed normalized records', () => {
    const invalidRecord = {
      ...buildNormalizedRecord(),
      category: null,
    } as unknown as ExerciseLibraryRecord;

    expect(validateNormalizedRecords([invalidRecord], 1)).toBe(false);
  });
});
