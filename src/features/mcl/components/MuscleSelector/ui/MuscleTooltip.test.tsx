import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MuscleTooltip from './MuscleTooltip';
import { getMuscleById } from '../../../data/muscles';

const muscle = getMuscleById('biceps-left');
if (!muscle) throw new Error('biceps-left missing from muscle data');

const baseProps = {
  muscle,
  position: { x: 10, y: 10 },
  visible: true,
  containerRef: { current: document.createElement('div') },
};

describe('MuscleTooltip', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the muscle name by default', () => {
    render(<MuscleTooltip {...baseProps} />);
    expect(screen.getByRole('heading', { name: muscle.name })).toBeInTheDocument();
  });

  it('shows the label override instead of the muscle name', () => {
    render(<MuscleTooltip {...baseProps} label="Biceps" />);
    expect(screen.getByRole('heading', { name: 'Biceps' })).toBeInTheDocument();
    expect(screen.queryByText(muscle.name)).not.toBeInTheDocument();
  });

  it('keeps a desktop tooltip within the bottom-right edge of the canvas', () => {
    mockTooltipLayout();
    render(<MuscleTooltip {...baseProps} position={{ x: 236, y: 154 }} />);

    expect(screen.getByRole('tooltip')).toHaveStyle({ left: '106px', top: '64px' });
  });

  it('places the touch name above the thumb and moves it below near the top edge', () => {
    mockTooltipLayout();
    const { rerender } = render(
      <MuscleTooltip {...baseProps} inputType="touch" position={{ x: 120, y: 120 }} />,
    );

    expect(screen.getByRole('tooltip')).toHaveStyle({ left: '60px', top: '16px' });
    expect(screen.getByRole('tooltip')).toHaveTextContent(muscle.name);

    rerender(<MuscleTooltip {...baseProps} inputType="touch" position={{ x: 120, y: 10 }} />);
    expect(screen.getByRole('tooltip')).toHaveStyle({ left: '60px', top: '34px' });
  });
});

function mockTooltipLayout() {
  vi.spyOn(baseProps.containerRef.current, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 240, 160));
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(120);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(80);
}
