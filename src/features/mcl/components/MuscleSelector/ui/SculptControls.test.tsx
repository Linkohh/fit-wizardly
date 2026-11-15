import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import type { MuscleLayer } from '../../../types';
import { SculptSlider } from './SculptSlider';
import { LayerToggle } from './LayerToggle';
import { MuscleSelector } from '../MuscleSelector';

beforeAll(() => {
  // Radix slider measures its track in jsdom; keep stubs local to this file.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

beforeEach(() => {
  localStorage.clear();
});

describe('SculptSlider', () => {
  it('exposes role slider with aria-valuenow and responds to ArrowRight', () => {
    const Harness = () => {
      const [v, setV] = useState(60);
      return <SculptSlider value={v} onChange={setV} />;
    };
    render(<Harness />);
    const slider = screen.getByRole('slider', { name: 'Muscle definition' });
    expect(slider).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByText('Sculpt')).toBeInTheDocument();
    slider.focus();
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuenow', '65');
  });
});

describe('LayerToggle', () => {
  it('exposes two radios and calls onChange("deep")', () => {
    const onChange = vi.fn();
    render(<LayerToggle value="surface" onChange={onChange} />);
    expect(screen.getByRole('radiogroup', { name: 'Muscle layer' })).toBeInTheDocument();
    const surface = screen.getByRole('radio', { name: 'Surface' });
    const deep = screen.getByRole('radio', { name: 'Deep' });
    expect(surface).toHaveAttribute('aria-checked', 'true');
    expect(deep).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(deep);
    expect(onChange).toHaveBeenCalledWith('deep');
  });

  it('moves selection with arrow keys', () => {
    const onChange = vi.fn<(l: MuscleLayer) => void>();
    render(<LayerToggle value="surface" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Surface' }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('deep');
  });
});

describe('MuscleSelector sculpt controls', () => {
  it('shows the slider in every view and the layer toggle only in side view', () => {
    render(<MuscleSelector showLegend={false} showSideView />);
    expect(screen.getByTestId('sculpt-slider')).toBeInTheDocument();
    expect(screen.queryByTestId('layer-toggle')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Side' }));
    expect(screen.getByTestId('sculpt-slider')).toBeInTheDocument();
    expect(screen.getByTestId('layer-toggle')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('sculpt-slider')).toBeInTheDocument();
    expect(screen.queryByTestId('layer-toggle')).not.toBeInTheDocument();
  });

  it('hides the controls when showHeader is false', () => {
    render(<MuscleSelector showLegend={false} showHeader={false} />);
    expect(screen.queryByTestId('sculpt-slider')).not.toBeInTheDocument();
  });
});
