import { render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isMobile: false,
  isAppleMobile: false,
  selectedIds: [] as string[],
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
    selectedIds: mocks.selectedIds,
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

vi.mock('./ui/SelectionSidebar', () => ({
  default: () => <div data-testid="selection-sidebar" />,
}));

vi.mock('./ui/InfoPanel', () => ({
  default: () => null,
}));

vi.mock('./ui/SculptSlider', () => ({
  default: () => <div data-testid="sculpt-slider-stub" />,
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

const PREFS_KEY = 'fitwizard.mcl.sculpt.v1';

describe('MuscleSelector layers', () => {
  let MuscleSelectorComponent: typeof import('./MuscleSelector').MuscleSelector;

  beforeAll(async () => {
    ({ MuscleSelector: MuscleSelectorComponent } = await import('./MuscleSelector'));
  });

  beforeEach(() => {
    mocks.isMobile = false;
    mocks.isAppleMobile = false;
    mocks.selectedIds = [];
    vi.clearAllMocks();
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ sculptLevel: 60, layer: 'deep' }));
  });

  afterEach(() => {
    window.localStorage.removeItem(PREFS_KEY);
  });

  it('front view on the deep layer exposes deep muscles and ghosts surface muscles', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="front" />);

    expect(screen.getByRole('button', { name: /Brachialis \(Left\)/i })).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('button', { name: /Pectoralis Major \(Left\)/i })).not.toBeInTheDocument();
    expect(document.querySelectorAll('path.muscle-path[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('back view on the surface layer hides deep muscles and offers them on the deep layer', () => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ sculptLevel: 60, layer: 'surface' }));
    const { unmount } = render(<MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="back" />);
    expect(screen.queryByRole('button', { name: /Rhomboid \(Left\)/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Latissimus Dorsi \(Left\)/i })).toHaveAttribute('tabindex', '0');
    unmount();

    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ sculptLevel: 60, layer: 'deep' }));
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="back" />);
    expect(screen.getByRole('button', { name: /Rhomboid \(Left\)/i })).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('button', { name: /Latissimus Dorsi \(Left\)/i })).not.toBeInTheDocument();
  });

  it('back view on the surface layer keeps a previously selected deep muscle as a selected ghost', () => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ sculptLevel: 60, layer: 'surface' }));
    mocks.selectedIds = ['rhomboid-left'];
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="back" />);

    const ghosts = Array.from(document.querySelectorAll('path.muscle-path[aria-hidden="true"]'));
    const selectedGhost = ghosts.find((p) => p.getAttribute('stroke') !== 'transparent' && p.getAttribute('stroke-width') === '1.5');
    expect(selectedGhost).toBeDefined();
  });

  it('side view with the deep layer exposes deep muscles and ghosts surface muscles', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="side" />);

    const soleus = screen.getByRole('button', { name: /Soleus/i });
    expect(soleus).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('button', { name: /Gastrocnemius/i })).not.toBeInTheDocument();
    // Surface muscles are still drawn, as inert ghosts.
    expect(document.querySelectorAll('path.muscle-path[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('side view on the surface layer keeps a selected deep muscle as an inert selected ghost', () => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ sculptLevel: 60, layer: 'surface' }));
    mocks.selectedIds = ['soleus-left'];
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="side" />);

    expect(screen.queryByRole('button', { name: /Soleus/i })).not.toBeInTheDocument();
    const ghosts = Array.from(document.querySelectorAll('path.muscle-path[aria-hidden="true"]'));
    const selectedGhost = ghosts.find((p) => p.getAttribute('stroke') !== 'transparent' && p.getAttribute('stroke-width') === '1.5');
    expect(selectedGhost).toBeDefined();
    expect(selectedGhost).toHaveAttribute('tabindex', '-1');
  });
});
