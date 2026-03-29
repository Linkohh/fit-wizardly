import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isMobile: false,
  isAppleMobile: false,
  emit: vi.fn(),
  toggleTheme: vi.fn(),
  toggleMuscle: vi.fn(),
  selectMuscle: vi.fn(),
  deselectMuscle: vi.fn(),
  clearSelection: vi.fn(),
  setSelection: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mocks.isMobile,
}));

vi.mock('@/hooks/use-apple-mobile', () => ({
  useAppleMobile: () => mocks.isAppleMobile,
}));

vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    shouldReduceMotion: false,
    prefersReducedMotion: false,
    reducedMotionEnabled: false,
  }),
}));

vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({
    emit: mocks.emit,
  }),
}));

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    resolvedTheme: 'dark',
    toggleTheme: mocks.toggleTheme,
    themeClassName: '',
  }),
}));

vi.mock('../../hooks/useMuscleSelection', () => ({
  useMuscleSelection: () => ({
    selectedIds: [],
    selectedMuscles: [],
    toggleMuscle: mocks.toggleMuscle,
    selectMuscle: mocks.selectMuscle,
    deselectMuscle: mocks.deselectMuscle,
    clearSelection: mocks.clearSelection,
    setSelection: mocks.setSelection,
    undo: mocks.undo,
    redo: mocks.redo,
    canUndo: true,
    canRedo: true,
  }),
}));

vi.mock('./svg/MuscleCanvas', () => ({
  default: () => <div data-testid="muscle-canvas" />,
}));

vi.mock('./ui/SelectionSidebar', () => ({
  default: () => <div data-testid="selection-sidebar" />,
}));

vi.mock('./ui/InfoPanel', () => ({
  default: () => null,
}));

vi.mock('./ui/ViewSwitcher', () => ({
  default: () => <div data-testid="view-switcher" />,
}));

vi.mock('./ui/SearchBar', () => ({
  default: () => <div data-testid="search-bar" />,
}));

vi.mock('./ui/Legend', () => ({
  default: () => <div data-testid="legend" />,
}));

vi.mock('./ui/MuscleTooltip', () => ({
  default: () => null,
}));

describe('MuscleSelector header controls mode', () => {
  let MuscleSelectorComponent: typeof import('./MuscleSelector').MuscleSelector;

  beforeAll(async () => {
    ({ MuscleSelector: MuscleSelectorComponent } = await import('./MuscleSelector'));
  });

  beforeEach(() => {
    mocks.isMobile = false;
    mocks.isAppleMobile = false;
    vi.clearAllMocks();
  });

  it('shows only search, view switching, and undo controls in embedded mode', () => {
    render(
      <MuscleSelectorComponent
        showLegend={false}
        headerControlsMode="embedded"
      />,
    );

    expect(screen.getByTestId('view-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
    expect(screen.getByTitle('Redo (Ctrl+Shift+Z)')).toBeInTheDocument();
    expect(screen.queryByTitle('Enable color by group')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Disable color by group')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Switch to light mode')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Switch to dark mode')).not.toBeInTheDocument();
  });
});
