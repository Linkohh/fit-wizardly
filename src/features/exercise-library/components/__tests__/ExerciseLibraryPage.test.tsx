import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExerciseLibraryPage } from '../ExerciseLibraryPage';
import type { ExerciseLibraryRecord } from '../../types';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  addCustomExercise: vi.fn(),
  libraryState: {
    records: [] as ExerciseLibraryRecord[],
    source: 'snapshot',
    isStale: true,
    lastSyncedAt: '2025-01-03T00:00:00.000Z',
    syncStatus: 'ready',
    error: null as string | null,
  },
}));

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
    slug: 'bench-press-1',
    name: 'Bench Press',
    description: 'Press with control.',
    category: {
      id: 'strength',
      name: 'Strength',
      slug: 'strength',
    },
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps'],
    equipment: ['Barbell'],
    imageUrl: 'https://cdn.example.com/bench.jpg',
    imageUrls: ['https://cdn.example.com/bench.jpg'],
    licenseInfo: null,
    aliases: [],
    localizedContent: {},
    searchText: 'bench press strength chest triceps barbell',
    lastSyncedAt: '2025-01-03T00:00:00.000Z',
    ...overrides,
  };
}

const catalogRecord = buildExercise({
  aliases: ['Chair steps'],
  localizedContent: {
    es: {
      name: 'Press de banca',
      description: 'Presiona con control.',
      aliases: ['Empuje con barra'],
    },
  },
  searchText:
    'bench press strength chest triceps barbell chair steps press de banca empuje con barra',
});

vi.mock('../../useExerciseLibrary', () => ({
  useExerciseLibrary: () => ({
    ...mocks.libraryState,
    refresh: mocks.refresh,
  }),
}));

vi.mock('@/stores/wizardStore', () => ({
  useWizardStore: () => ({
    selections: {
      targetMuscles: [],
      equipment: [],
    },
  }),
}));

vi.mock('@/stores/customExerciseStore', () => ({
  useCustomExerciseStore: (selector: (state: unknown) => unknown) =>
    selector({
      customExercises: [
        {
          id: 'custom_row',
          name: 'Custom Row',
          primaryMuscles: ['upper_back'],
          secondaryMuscles: ['biceps'],
          equipment: ['dumbbells'],
          patterns: ['horizontal_pull'],
          contraindications: [],
          cues: ['Keep the chest proud'],
          description: 'Saved locally.',
          category: 'strength',
          difficulty: 'Intermediate',
        },
      ],
      addCustomExercise: mocks.addCustomExercise,
    }),
}));

vi.mock('../ExerciseLibraryCard', () => ({
  ExerciseLibraryCard: ({
    exercise,
  }: {
    exercise: ExerciseLibraryRecord;
  }) => <div>{exercise.name}</div>,
}));

vi.mock('@/hooks/useExerciseSearch', () => ({
  useExerciseSearch: () => ({
    data: [],
    isLoading: false,
    error: null,
    hasEmptyResults: false,
    searchPrimary: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('../ExerciseLibraryDetailModal', () => ({
  ExerciseLibraryDetailModal: () => null,
}));

describe('ExerciseLibraryPage', () => {
  beforeEach(() => {
    mocks.libraryState.records = [catalogRecord];
    mocks.libraryState.source = 'snapshot';
    mocks.libraryState.isStale = true;
    mocks.libraryState.lastSyncedAt = '2025-01-03T00:00:00.000Z';
    mocks.libraryState.syncStatus = 'ready';
    mocks.libraryState.error = null;
    mocks.refresh.mockReset();
    mocks.addCustomExercise.mockReset();
  });

  it('renders backup-state messaging and keeps custom exercises separate from catalog counts', () => {
    render(<ExerciseLibraryPage />);

    expect(screen.getByText('Backup boot sequence active')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 1 catalog exercises')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('My exercises')).toBeInTheDocument();
    expect(screen.getByText('Custom Row')).toBeInTheDocument();
  });

  it('filters the catalog with search while leaving matching custom exercises visible in their own section', () => {
    render(<ExerciseLibraryPage />);

    fireEvent.change(
      screen.getByPlaceholderText(/Search exercises, muscles, or equipment/i),
      {
        target: {
          value: 'row',
        },
      }
    );

    expect(screen.getByText('Showing 0 of 0 catalog exercises')).toBeInTheDocument();
    expect(screen.getByText('No exercises matched')).toBeInTheDocument();
    expect(screen.getByText('Custom Row')).toBeInTheDocument();
  });

  it('matches catalog exercises by alias search text', () => {
    render(<ExerciseLibraryPage />);

    fireEvent.change(
      screen.getByPlaceholderText(/Search exercises, muscles, or equipment/i),
      {
        target: {
          value: 'chair steps',
        },
      }
    );

    expect(screen.getByText('Showing 1 of 1 catalog exercises')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('downgrades live refresh errors when local catalog records remain available', () => {
    mocks.libraryState.error = 'Load failed';
    mocks.libraryState.syncStatus = 'error';

    render(<ExerciseLibraryPage />);

    expect(screen.queryByText('Catalog refresh issue')).not.toBeInTheDocument();
    expect(screen.getByText('Live refresh unavailable')).toBeInTheDocument();
    expect(screen.getByText(/local exercise catalog remains available/i)).toBeInTheDocument();
  });
});
