import { render, screen, fireEvent } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Muscle } from '../../types';

const mocks = vi.hoisted(() => {
  const muscle: Muscle = {
    id: 'pectoralis-major-left',
    name: 'Pectoralis Major (Left)',
    scientificName: 'Pectoralis Major',
    group: 'chest',
    function: 'Arm adduction',
    exercises: ['Bench Press'],
    views: ['front'],
    relatedMuscles: [],
    paths: { front: 'M0,0 L1,1' },
  };

  return {
    isMobile: true,
    isAppleMobile: true,
    muscle,
    emit: vi.fn(),
    toggleMuscle: vi.fn(),
    selectMuscle: vi.fn(),
    deselectMuscle: vi.fn(),
    clearSelection: vi.fn(),
    setSelection: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  };
});

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
    toggleTheme: vi.fn(),
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
    canUndo: false,
    canRedo: false,
  }),
}));

vi.mock('./svg/MuscleCanvas', () => ({
  default: ({ onMuscleClick, onMuscleLongPress }: { onMuscleClick: (m: Muscle) => void; onMuscleLongPress?: (m: Muscle) => void }) => (
    <div>
      <button data-testid="tap-muscle" onClick={() => onMuscleClick(mocks.muscle)}>Tap muscle</button>
      <button data-testid="long-press-muscle" onClick={() => onMuscleLongPress?.(mocks.muscle)}>Long press muscle</button>
    </div>
  ),
}));

vi.mock('./ui/SelectionSidebar', () => ({
  default: ({ mobileSheetMode }: { mobileSheetMode?: boolean }) => (
    <div data-testid={mobileSheetMode ? 'selection-sidebar-sheet' : 'selection-sidebar-inline'} />
  ),
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({
    open,
    children,
    snapPoints,
    activeSnapPoint,
    setActiveSnapPoint,
  }: {
    open: boolean;
    children: ReactNode;
    snapPoints?: Array<number | string>;
    activeSnapPoint?: number | string | null;
    setActiveSnapPoint?: (value: number | string | null) => void;
  }) => (
    <div
      data-testid="selection-drawer"
      data-open={open ? 'true' : 'false'}
      data-snap-points={JSON.stringify(snapPoints)}
      data-active-snap={String(activeSnapPoint)}
    >
      <button data-testid="selection-drawer-snap" onClick={() => setActiveSnapPoint?.(0.5)}>
        snap
      </button>
      {children}
    </div>
  ),
  DrawerContent: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('./ui/InfoPanel', () => ({
  default: ({ isOpen, muscle }: { isOpen: boolean; muscle: Muscle | null }) =>
    isOpen ? <div data-testid="info-panel">{muscle?.name}</div> : null,
}));

vi.mock('./ui/ViewSwitcher', () => ({
  default: () => <div />,
}));

vi.mock('./ui/Legend', () => ({
  default: () => <div />,
}));

vi.mock('./ui/SearchBar', () => ({
  default: () => <div />,
}));

vi.mock('./ui/MuscleTooltip', () => ({
  default: () => null,
}));

describe('MuscleSelector iOS behavior', () => {
  let MuscleSelectorComponent: typeof import('./MuscleSelector').MuscleSelector;

  beforeAll(async () => {
    ({ MuscleSelector: MuscleSelectorComponent } = await import('./MuscleSelector'));
  });

  beforeEach(() => {
    mocks.isMobile = true;
    mocks.isAppleMobile = true;
    vi.clearAllMocks();
  });

  it('renders Apple mobile sheet trigger with iOS snap points and closed default state', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} />);

    expect(screen.getByTestId('muscle-selector-sheet-trigger')).toBeInTheDocument();
    expect(screen.queryByTestId('selection-sidebar-inline')).not.toBeInTheDocument();
    expect(screen.getByTestId('selection-drawer')).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('selection-drawer')).toHaveAttribute(
      'data-snap-points',
      JSON.stringify([0.22, 0.5, 0.88])
    );
  });

  it('opens the selection sheet from the mobile trigger and emits sheet open feedback', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} />);

    fireEvent.click(screen.getByTestId('muscle-selector-sheet-trigger'));

    expect(screen.getByTestId('selection-drawer')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('selection-sidebar-sheet')).toBeInTheDocument();
    expect(mocks.emit).toHaveBeenCalledWith('sheetOpen');
  });

  it('emits sheet snap feedback when active snap point changes', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} />);

    fireEvent.click(screen.getByTestId('selection-drawer-snap'));

    expect(mocks.emit).toHaveBeenCalledWith('sheetSnap');
  });

  it('tap selects muscle and emits selection feedback once', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} />);

    fireEvent.click(screen.getByTestId('tap-muscle'));

    expect(mocks.toggleMuscle).toHaveBeenCalledWith('pectoralis-major-left');
    expect(mocks.emit).toHaveBeenCalledWith('select');
    expect(mocks.emit).toHaveBeenCalledTimes(1);
  });

  it('opens info on long press and does not toggle selection', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} />);

    fireEvent.click(screen.getByTestId('long-press-muscle'));

    expect(screen.getByTestId('info-panel')).toHaveTextContent('Pectoralis Major (Left)');
    expect(mocks.toggleMuscle).not.toHaveBeenCalled();
    expect(mocks.emit).toHaveBeenCalledWith('longPressInfo');
  });
});
