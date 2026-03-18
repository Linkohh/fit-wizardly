import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ExerciseLibraryDetailModal } from '../ExerciseLibraryDetailModal';
import type { ExerciseLibraryRecord } from '../../types';

const mocks = vi.hoisted(() => ({
  viewportTier: 'desktop' as 'phone' | 'tablet' | 'desktop',
  language: 'en',
  isFavorite: vi.fn(() => false),
  toggleFavorite: vi.fn(),
  selection: vi.fn(),
  trackView: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: mocks.language,
    },
  }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useViewportTier: () => mocks.viewportTier,
}));

vi.mock('@/hooks/useUserPreferences', () => ({
  usePreferencesStore: () => ({
    isFavorite: mocks.isFavorite,
    toggleFavorite: mocks.toggleFavorite,
  }),
}));

vi.mock('@/hooks/useExerciseInteraction', () => ({
  useTrackExerciseView: mocks.trackView,
}));

vi.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    selection: mocks.selection,
  }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({
    children,
    className,
    ...props
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <section data-testid="dialog-content" className={className} {...props}>
      {children}
    </section>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerContent: ({
    children,
    className,
    ...props
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <section data-testid="drawer-content" className={className} {...props}>
      {children}
    </section>
  ),
  DrawerTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({
    children,
    className,
    ...props
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <section data-testid="sheet-content" className={className} {...props}>
      {children}
    </section>
  ),
  SheetTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../ExerciseLibraryMedia', () => ({
  ExerciseLibraryMedia: ({ exercise }: { exercise: ExerciseLibraryRecord }) => (
    <div data-testid="exercise-library-media">{exercise.name}</div>
  ),
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

describe('ExerciseLibraryDetailModal', () => {
  beforeEach(() => {
    mocks.viewportTier = 'desktop';
    mocks.language = 'en';
    mocks.isFavorite.mockReturnValue(false);
    vi.clearAllMocks();
  });

  it('renders the phone drawer surface with safe-area sizing and an explicit close button', () => {
    mocks.viewportTier = 'phone';

    render(
      <ExerciseLibraryDetailModal
        exercise={buildExercise()}
        relatedExercises={[]}
        onClose={vi.fn()}
        onSelectRelated={vi.fn()}
      />
    );

    const drawer = screen.getByTestId('drawer-content');
    expect(drawer).toHaveAttribute('data-surface', 'phone');
    expect(drawer.className).toContain('h-[100svh]');
    expect(drawer.className).toContain('supports-[height:100dvh]:h-[100dvh]');
    expect(screen.getByRole('button', { name: /close exercise details/i })).toBeInTheDocument();
  });

  it('renders the tablet sheet surface for medium-width touch layouts', () => {
    mocks.viewportTier = 'tablet';

    render(
      <ExerciseLibraryDetailModal
        exercise={buildExercise()}
        relatedExercises={[]}
        onClose={vi.fn()}
        onSelectRelated={vi.fn()}
      />
    );

    const sheet = screen.getByTestId('sheet-content');
    expect(sheet).toHaveAttribute('data-surface', 'tablet');
    expect(sheet.className).toContain('sm:w-[min(92vw,54rem)]');
    expect(sheet.className).toContain('supports-[height:100dvh]:h-[100dvh]');
  });

  it('renders the desktop dialog surface for large viewports', () => {
    render(
      <ExerciseLibraryDetailModal
        exercise={buildExercise()}
        relatedExercises={[]}
        onClose={vi.fn()}
        onSelectRelated={vi.fn()}
      />
    );

    const dialog = screen.getByTestId('dialog-content');
    expect(dialog).toHaveAttribute('data-surface', 'desktop');
    expect(dialog.className).toContain('h-[min(90svh,56rem)]');
    expect(dialog.className).toContain('max-w-6xl');
  });

  it('renders localized titles and aliases from the display resolver', () => {
    mocks.language = 'es';

    render(
      <ExerciseLibraryDetailModal
        exercise={buildExercise({
          aliases: ['Chair steps'],
          localizedContent: {
            es: {
              name: 'Flexion',
              description: 'Presiona con control.',
              aliases: ['Lagartija', 'Flexion'],
            },
          },
        })}
        relatedExercises={[
          buildExercise({
            id: 'wger:2',
            slug: 'incline-push-up-2',
            name: 'Incline Push-Up',
            localizedContent: {
              es: {
                name: 'Flexion inclinada',
                description: 'Variante inclinada.',
                aliases: [],
              },
            },
          }),
        ]}
        onClose={vi.fn()}
        onSelectRelated={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Flexion' })).toBeInTheDocument();
    expect(screen.getAllByText('Presiona con control.').length).toBeGreaterThan(0);
    expect(screen.getByText('Also known as')).toBeInTheDocument();
    expect(screen.getByText('Lagartija')).toBeInTheDocument();
    expect(screen.getByText('Flexion inclinada')).toBeInTheDocument();
  });

  it('updates visible exercise copy when the app language changes without refetching', () => {
    const exercise = buildExercise({
      localizedContent: {
        es: {
          name: 'Flexion',
          description: 'Presiona con control.',
          aliases: [],
        },
      },
    });

    const { rerender } = render(
      <ExerciseLibraryDetailModal
        exercise={exercise}
        relatedExercises={[]}
        onClose={vi.fn()}
        onSelectRelated={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Push-Up' })).toBeInTheDocument();

    mocks.language = 'es';

    rerender(
      <ExerciseLibraryDetailModal
        exercise={exercise}
        relatedExercises={[]}
        onClose={vi.fn()}
        onSelectRelated={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Flexion' })).toBeInTheDocument();
    expect(screen.getAllByText('Presiona con control.').length).toBeGreaterThan(0);
  });
});
