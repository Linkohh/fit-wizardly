import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LabelledSlider } from '@/components/a11y/LabelledSlider';
import { SetLogger } from '@/components/logging/SetLogger';
import { ReadinessCheck } from '@/components/logging/ReadinessCheck';
import { PlateCalculatorDialog } from '@/components/tools/PlateCalculator';
import { useTheme } from '@/features/mcl/hooks/useTheme';
import { LayerToggle } from '@/features/mcl/components/MuscleSelector/ui/LayerToggle';
import { SculptSlider } from '@/features/mcl/components/MuscleSelector/ui/SculptSlider';
import SelectionSidebar from '@/features/mcl/components/MuscleSelector/ui/SelectionSidebar';
import { getMuscleById } from '@/features/mcl/data/muscles';

/** Lane D, Day 5 (roadmap 3.4, part 1): accessible names, RIR text, hit areas, MCL theme. */

describe('LabelledSlider', () => {
  it('names the thumb (role="slider"), not just the root, and gives it a 44 px hit area', () => {
    render(<LabelledSlider value={[2]} min={0} max={5} step={1} thumbLabel="Effort" thumbValueText="Hard" />);
    const thumb = screen.getByRole('slider', { name: 'Effort' });
    expect(thumb).toHaveAttribute('aria-valuetext', 'Hard');
    // 20 px thumb + 12 px invisible inset on each side = 44 px.
    expect(thumb).toHaveClass('h-5', 'w-5', 'after:absolute', 'after:-inset-3');
  });
});

describe('SetLogger RIR', () => {
  it('shows the effort level as text next to the number, and names the slider thumb', () => {
    render(<SetLogger setNumber={1} targetReps="8-12" targetRIR={2} onComplete={vi.fn()} />);
    const set = screen.getByRole('group', { name: 'Set 1' });
    // Text, not colour alone.
    expect(set).toHaveTextContent('2 - Hard');
    const thumb = screen.getByRole('slider', { name: 'Reps in reserve' });
    expect(thumb).toHaveAttribute('aria-valuetext', '2 - Hard');

    thumb.focus();
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(set).toHaveTextContent('3 - Moderate');
    expect(thumb).toHaveAttribute('aria-valuetext', '3 - Moderate');
  });

  it('keeps the step buttons at least 44 px (48 px, h-12 w-12)', () => {
    render(<SetLogger setNumber={1} targetReps="8-12" targetRIR={2} onComplete={vi.fn()} />);
    for (const name of ['Increase weight', 'Decrease weight', 'Increase reps', 'Decrease reps']) {
      expect(screen.getByRole('button', { name })).toHaveClass('h-12', 'w-12');
    }
  });

  it('names the plate calculator button', () => {
    render(<PlateCalculatorDialog initialWeight={135} weightUnit="lbs" />);
    expect(screen.getByRole('button', { name: 'Open plate calculator' })).toBeInTheDocument();
  });
});

describe('ReadinessCheck', () => {
  it('names all four sliders', () => {
    render(<ReadinessCheck onComplete={vi.fn()} onSkip={vi.fn()} />);
    for (const name of ['Sleep quality', 'Energy level', 'Muscle soreness', 'Stress level']) {
      const thumb = screen.getByRole('slider', { name });
      expect(thumb).toHaveAttribute('aria-valuetext', expect.stringMatching(/^\d of 5$/));
    }
  });
});

describe('MCL touch targets (DEBT-020)', () => {
  it('gives the layer toggle options a 44 px minimum', () => {
    render(<LayerToggle value="surface" onChange={vi.fn()} />);
    for (const name of ['Surface', 'Deep']) {
      expect(screen.getByRole('radio', { name })).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    }
  });

  it('gives the sculpt slider thumb a 44 px hit area', () => {
    render(<SculptSlider value={60} onChange={vi.fn()} />);
    const thumb = screen.getByRole('slider', { name: 'Muscle definition' });
    expect(thumb).toHaveClass('after:-inset-3');
    expect(thumb).toHaveAttribute('aria-valuetext', '60%');
  });

  it('uses semantic tokens and 44 px buttons in selected rows (DEBT-021)', () => {
    render(
      <SelectionSidebar
        selectedMuscles={[getMuscleById('biceps-left')!]}
        onRemoveMuscle={vi.fn()}
        onClearAll={vi.fn()}
        onViewInfo={vi.fn()}
        reduceMotion
      />,
    );
    const remove = screen.getByRole('button', { name: 'Remove Biceps (Left)' });
    expect(remove).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    const name = screen.getByText('Biceps (Left)');
    expect(name).toHaveClass('text-foreground');
    expect(name.className).not.toMatch(/gray-/);
  });
});

describe('MCL useTheme follows the app theme without a reload (DEBT-021)', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('tracks the dark class on <html> in system mode', async () => {
    document.documentElement.classList.remove('dark');
    const { result } = renderHook(() => useTheme('system'));
    expect(result.current.resolvedTheme).toBe('light');

    await act(async () => {
      document.documentElement.classList.add('dark');
      // MutationObserver callbacks run as microtasks.
      await Promise.resolve();
    });
    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.themeClassName).toBe('dark');
  });

  it('follows a change of the theme prop, dropping any local toggle', () => {
    const { result, rerender } = renderHook(({ mode }) => useTheme(mode), {
      initialProps: { mode: 'light' as 'light' | 'dark' | 'system' },
    });
    expect(result.current.resolvedTheme).toBe('light');

    act(() => result.current.toggleTheme());
    expect(result.current.resolvedTheme).toBe('dark');

    rerender({ mode: 'dark' });
    expect(result.current.resolvedTheme).toBe('dark');
    rerender({ mode: 'light' });
    expect(result.current.resolvedTheme).toBe('light');
  });
});
