import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExerciseLibraryMedia } from '../ExerciseLibraryMedia';
import type { ExerciseLibraryRecord } from '../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
    },
  }),
}));

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

describe('ExerciseLibraryMedia', () => {
  it('renders the image-backed hero when a usable image URL exists', () => {
    render(
      <ExerciseLibraryMedia
        exercise={buildExercise({
          imageUrl: 'https://cdn.example.com/push-up.jpg',
          imageUrls: ['https://cdn.example.com/push-up.jpg'],
        })}
      />
    );

    expect(screen.getByRole('img', { name: 'Push-Up' })).toBeInTheDocument();
    expect(screen.getByText('Image')).toBeInTheDocument();
  });

  it('renders the anatomy fallback when no image is available but muscles are mappable', () => {
    render(<ExerciseLibraryMedia exercise={buildExercise()} />);

    expect(screen.getByText('Muscle map')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Push-Up' })).not.toBeInTheDocument();
  });

  it('falls back from a failed image to the anatomy renderer', () => {
    render(
      <ExerciseLibraryMedia
        exercise={buildExercise({
          imageUrl: 'https://cdn.example.com/push-up.jpg',
          imageUrls: ['https://cdn.example.com/push-up.jpg'],
        })}
      />
    );

    fireEvent.error(screen.getByRole('img', { name: 'Push-Up' }));

    expect(screen.getByText('Muscle map')).toBeInTheDocument();
  });

  it('uses the brand fallback when the exercise cannot be mapped anatomically', () => {
    render(
      <ExerciseLibraryMedia
        exercise={buildExercise({
          primaryMuscles: ['Mystery Muscle'],
          secondaryMuscles: [],
        })}
      />
    );

    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });

  it('shows a front/back toggle for dual-side anatomy when enabled', () => {
    render(
      <ExerciseLibraryMedia
        allowViewToggle
        exercise={buildExercise({
          primaryMuscles: ['Chest'],
          secondaryMuscles: ['Upper Back'],
        })}
      />
    );

    expect(screen.getByRole('button', { name: /show front muscle map/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show back muscle map/i })).toBeInTheDocument();
  });
});
