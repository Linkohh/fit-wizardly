import { describe, expect, it } from 'vitest';
import { resolveExerciseLibraryMedia } from '../media';
import type { ExerciseLibraryRecord } from '../types';

function buildExercise(overrides: Partial<ExerciseLibraryRecord> = {}): ExerciseLibraryRecord {
  return {
    id: 'wger:1',
    source: 'wger',
    sourceId: 1,
    sourceUuid: 'uuid-1',
    slug: 'push-up-1',
    name: 'Push-Up',
    description: 'A classic bodyweight press.',
    category: {
      id: 'strength',
      name: 'Strength',
      slug: 'strength',
    },
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps'],
    equipment: ['Bodyweight'],
    imageUrl: null,
    imageUrls: [],
    licenseInfo: null,
    aliases: [],
    localizedContent: {},
    searchText: 'push-up strength chest triceps bodyweight',
    lastSyncedAt: '2025-01-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('resolveExerciseLibraryMedia', () => {
  it('prefers the real wger image when present', () => {
    const resolved = resolveExerciseLibraryMedia(
      buildExercise({
        imageUrl: 'https://cdn.example.com/push-up.jpg',
        imageUrls: ['https://cdn.example.com/push-up.jpg'],
      })
    );

    expect(resolved.variant).toBe('wger');
    expect(resolved.label).toBe('Image');
    expect(resolved.imageUrl).toBe('https://cdn.example.com/push-up.jpg');
  });

  it('returns anatomy media when the exercise has mapped muscles but no image', () => {
    const resolved = resolveExerciseLibraryMedia(buildExercise());

    expect(resolved.variant).toBe('anatomy');
    expect(resolved.label).toBe('Muscle map');
    expect(resolved.anatomy?.primaryKeys).toEqual(['chest']);
    expect(resolved.anatomy?.secondaryKeys).toEqual(['triceps']);
  });

  it('returns the brand fallback when no image and no anatomy mapping exist', () => {
    const resolved = resolveExerciseLibraryMedia(
      buildExercise({
        primaryMuscles: ['Unknown Prime'],
        secondaryMuscles: ['Unknown Assist'],
      })
    );

    expect(resolved.variant).toBe('brand');
    expect(resolved.label).toBe('Fallback');
    expect(resolved.anatomy).toBeNull();
  });

  it('chooses the expected default view for mixed front and back anatomy', () => {
    const resolved = resolveExerciseLibraryMedia(
      buildExercise({
        primaryMuscles: ['Upper Back'],
        secondaryMuscles: ['Chest'],
      })
    );

    expect(resolved.variant).toBe('anatomy');
    expect(resolved.anatomy?.defaultView).toBe('back');
    expect(resolved.anatomy?.availableViews).toEqual(['back', 'front']);
  });

  it('deduplicates anatomy views when multiple muscles map to the same side', () => {
    const resolved = resolveExerciseLibraryMedia(
      buildExercise({
        primaryMuscles: ['Chest', 'Front Deltoids'],
        secondaryMuscles: ['Abs'],
      })
    );

    expect(resolved.variant).toBe('anatomy');
    expect(resolved.anatomy?.availableViews).toEqual(['front']);
  });
});
