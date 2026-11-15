import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
  toggleTheme: vi.fn(),
}));

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/use-apple-mobile', () => ({ useAppleMobile: () => false }));
vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    shouldReduceMotion: false,
    prefersReducedMotion: false,
    reducedMotionEnabled: false,
  }),
}));
vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({ emit: mocks.emit }),
}));
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ resolvedTheme: 'dark', toggleTheme: mocks.toggleTheme, themeClassName: '' }),
}));
vi.mock('./ui/SelectionSidebar', () => ({ default: () => <div data-testid="selection-sidebar" /> }));
vi.mock('./ui/InfoPanel', () => ({ default: () => null }));
vi.mock('./ui/SculptSlider', () => ({ default: () => <div data-testid="sculpt-slider-stub" /> }));
vi.mock('./ui/ViewSwitcher', () => ({ default: () => <div data-testid="view-switcher" /> }));
vi.mock('./ui/SearchBar', () => ({ default: () => <div data-testid="search-bar" /> }));
vi.mock('./ui/Legend', () => ({ default: () => <div data-testid="legend" /> }));
vi.mock('./ui/MuscleTooltip', () => ({ default: () => null }));

const PAIR = ['biceps-left', 'biceps-right'];

describe('MuscleSelector side view paired selection', () => {
  let MuscleSelectorComponent: typeof import('./MuscleSelector').MuscleSelector;

  beforeAll(async () => {
    ({ MuscleSelector: MuscleSelectorComponent } = await import('./MuscleSelector'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  const renderSide = (props: Partial<React.ComponentProps<typeof MuscleSelectorComponent>> = {}) =>
    render(
      <MuscleSelectorComponent showLegend={false} showSearch={false} defaultView="side" {...props} />
    );

  const sideBiceps = () => screen.getByRole('button', { name: 'Biceps' });

  it('side click selects both sides in one onSelectionChange call', () => {
    const onSelectionChange = vi.fn();
    renderSide({ onSelectionChange });

    fireEvent.click(sideBiceps());

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(PAIR);
  });

  it('side click on a half-selected pair selects both; next click clears both', () => {
    const onSelectionChange = vi.fn();
    renderSide({ selectedMuscles: ['biceps-left'], onSelectionChange });

    fireEvent.click(sideBiceps());
    expect(onSelectionChange).toHaveBeenLastCalledWith(['biceps-left', 'biceps-right']);

    fireEvent.click(sideBiceps());
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
  });

  it('only the right side selected: side click selects the pair', () => {
    const onSelectionChange = vi.fn();
    renderSide({ selectedMuscles: ['biceps-right'], onSelectionChange });

    expect(sideBiceps()).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(sideBiceps());

    expect(onSelectionChange).toHaveBeenCalledWith(['biceps-right', 'biceps-left']);
  });

  it('preserves other selected muscles', () => {
    const onSelectionChange = vi.fn();
    renderSide({ selectedMuscles: ['soleus-left'], onSelectionChange });

    fireEvent.click(sideBiceps());

    expect(onSelectionChange).toHaveBeenCalledWith(['soleus-left', ...PAIR]);
  });

  it('multiSelect=false: side click replaces the selection with the pair', () => {
    const onSelectionChange = vi.fn();
    renderSide({ multiSelect: false, selectedMuscles: ['soleus-left'], onSelectionChange });

    fireEvent.click(sideBiceps());

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(PAIR);
  });

  it('skips a disabled partner', () => {
    const onSelectionChange = vi.fn();
    renderSide({ disabledMuscles: ['biceps-right'], onSelectionChange });

    fireEvent.click(sideBiceps());

    expect(onSelectionChange).toHaveBeenCalledWith(['biceps-left']);
  });

  it('keeps firing onMuscleClick once per click', () => {
    const onMuscleClick = vi.fn();
    renderSide({ onMuscleClick });

    fireEvent.click(sideBiceps());

    expect(onMuscleClick).toHaveBeenCalledTimes(1);
    expect(onMuscleClick.mock.calls[0][0].id).toBe('biceps-left');
  });

  it('front-view click still toggles a single id', () => {
    const onSelectionChange = vi.fn();
    render(
      <MuscleSelectorComponent
        showLegend={false}
        showSearch={false}
        defaultView="front"
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Biceps (Left)' }));

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(['biceps-left']);
  });

  it('side-view muscle is announced without "(Left)"', () => {
    renderSide();

    expect(sideBiceps()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\(Left\)/ })).not.toBeInTheDocument();
  });
});
