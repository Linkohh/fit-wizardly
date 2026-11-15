import { render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
    vi.clearAllMocks();
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ sculptLevel: 60, layer: 'deep' }));
  });

  afterEach(() => {
    window.localStorage.removeItem(PREFS_KEY);
  });

  it('front view with the deep layer stored still exposes surface muscles as enabled, focusable buttons', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="front" />);

    const pec = screen.getByRole('button', { name: /Pectoralis Major \(Left\)/i });
    expect(pec).toHaveAttribute('aria-disabled', 'false');
    expect(pec).toHaveAttribute('tabindex', '0');
    expect(pec).not.toHaveAttribute('aria-hidden');
  });

  it('side view with the deep layer exposes deep muscles and ghosts surface muscles', () => {
    render(<MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="side" />);

    const soleus = screen.getByRole('button', { name: /Soleus/i });
    expect(soleus).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('button', { name: /Gastrocnemius/i })).not.toBeInTheDocument();
    // Surface muscles are still drawn, as inert ghosts.
    expect(document.querySelectorAll('path.muscle-path[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
