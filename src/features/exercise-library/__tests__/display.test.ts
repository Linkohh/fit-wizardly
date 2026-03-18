import { describe, expect, it } from 'vitest';
import { resolveExerciseLibraryDisplayContent } from '../display';
import type { ExerciseLibraryRecord } from '../types';

function buildExercise(
  overrides: Partial<ExerciseLibraryRecord> = {}
): ExerciseLibraryRecord {
  return {
    id: 'wger:1',
    source: 'wger',
    sourceId: 1,
    sourceUuid: 'uuid-1',
    slug: 'step-up-1',
    name: 'Step-Up',
    description: 'Step onto the box with control.',
    category: {
      id: 'strength',
      name: 'Strength',
      slug: 'strength',
    },
    primaryMuscles: ['Quads'],
    secondaryMuscles: ['Glutes'],
    equipment: ['Bodyweight'],
    imageUrl: null,
    imageUrls: [],
    licenseInfo: null,
    aliases: ['Chair steps'],
    localizedContent: {
      es: {
        name: 'Subida al banco',
        description: 'Sube al banco con control.',
        aliases: ['Chair steps', 'Step onto bench'],
      },
    },
    searchText: 'step-up chair steps subida al banco',
    lastSyncedAt: '2025-01-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('resolveExerciseLibraryDisplayContent', () => {
  it('returns localized content for a supported locale when available', () => {
    const resolved = resolveExerciseLibraryDisplayContent(
      buildExercise(),
      'es-ES'
    );

    expect(resolved.name).toBe('Subida al banco');
    expect(resolved.description).toBe('Sube al banco con control.');
    expect(resolved.aliases).toEqual(['Chair steps', 'Step onto bench']);
    expect(resolved.resolvedLocale).toBe('es');
  });

  it('falls back to canonical content when the requested locale is unavailable', () => {
    const resolved = resolveExerciseLibraryDisplayContent(
      buildExercise(),
      'de'
    );

    expect(resolved.name).toBe('Step-Up');
    expect(resolved.description).toBe('Step onto the box with control.');
    expect(resolved.aliases).toEqual(['Chair steps']);
    expect(resolved.resolvedLocale).toBe('default');
  });

  it('filters aliases that duplicate the resolved title', () => {
    const resolved = resolveExerciseLibraryDisplayContent(
      buildExercise({
        aliases: ['Step-Up', 'Chair steps'],
        localizedContent: {
          en: {
            name: 'Step-Up',
            description: 'Step onto the box with control.',
            aliases: ['Step-Up', 'Chair steps'],
          },
        },
      }),
      'en'
    );

    expect(resolved.aliases).toEqual(['Chair steps']);
  });
});
