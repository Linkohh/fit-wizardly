import { describe, expect, it } from 'vitest';
import { adaptExerciseLibraryRecordToExercise } from '../exerciseAdapter';
import type { ExerciseLibraryRecord } from '../types';

function buildRecord(
  overrides: Partial<ExerciseLibraryRecord> = {}
): ExerciseLibraryRecord {
  return {
    id: 'wger:100',
    source: 'wger',
    sourceId: 100,
    sourceUuid: 'exercise-uuid',
    slug: 'push-up-100',
    name: 'Push Up',
    description: 'Brace your core and press away from the floor.',
    category: {
      id: '11',
      name: 'Chest',
      slug: 'chest',
    },
    primaryMuscles: ['Chest', 'Triceps'],
    secondaryMuscles: ['Shoulders', 'Abs'],
    equipment: ['Bodyweight'],
    imageUrl: 'https://wger.de/media/exercise-images/push-up.png',
    imageUrls: ['https://wger.de/media/exercise-images/push-up.png'],
    licenseInfo: null,
    aliases: ['Press Up'],
    localizedContent: {},
    searchText: 'push up press up chest triceps',
    lastSyncedAt: '2026-05-17T00:00:00.000Z',
    ...overrides,
  };
}

describe('adaptExerciseLibraryRecordToExercise', () => {
  it('maps a wger library record into the planner Exercise shape', () => {
    const exercise = adaptExerciseLibraryRecordToExercise(buildRecord());

    expect(exercise).toMatchObject({
      id: 'wger:100',
      name: 'Push Up',
      primaryMuscles: ['chest', 'triceps'],
      secondaryMuscles: ['side_deltoid', 'abs'],
      equipment: ['bodyweight'],
      category: 'strength',
      difficulty: 'All Levels',
      imageUrl: 'https://wger.de/media/exercise-images/push-up.png',
      source: 'wger',
      sourceId: '100',
    });
    expect(exercise.patterns).toContain('horizontal_push');
    expect(exercise.cues).toContain('Brace your core and press away from the floor.');
  });

  it('keeps unknown muscles and equipment out of planner filters', () => {
    const exercise = adaptExerciseLibraryRecordToExercise(
      buildRecord({
        primaryMuscles: ['Unknown Muscle', 'Lats'],
        secondaryMuscles: ['Brachialis'],
        equipment: ['Mystery Tool', 'Pull-up Bar'],
        category: {
          id: '12',
          name: 'Back',
          slug: 'back',
        },
      })
    );

    expect(exercise.primaryMuscles).toEqual(['lats']);
    expect(exercise.secondaryMuscles).toEqual(['biceps']);
    expect(exercise.equipment).toEqual(['pullup_bar']);
    expect(exercise.patterns).toContain('vertical_pull');
  });
});
