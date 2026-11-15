import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MuscleTooltip from './MuscleTooltip';
import { getMuscleById } from '../../../data/muscles';

const muscle = getMuscleById('biceps-left');
if (!muscle) throw new Error('biceps-left missing from muscle data');

const baseProps = {
  muscle,
  position: { x: 10, y: 10 },
  visible: true,
  containerRef: { current: null },
};

describe('MuscleTooltip', () => {
  it('shows the muscle name by default', () => {
    render(<MuscleTooltip {...baseProps} />);
    expect(screen.getByRole('heading', { name: muscle.name })).toBeInTheDocument();
  });

  it('shows the label override instead of the muscle name', () => {
    render(<MuscleTooltip {...baseProps} label="Biceps" />);
    expect(screen.getByRole('heading', { name: 'Biceps' })).toBeInTheDocument();
    expect(screen.queryByText(muscle.name)).not.toBeInTheDocument();
  });
});
