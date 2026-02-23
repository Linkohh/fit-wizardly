import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MusclePath } from './MusclePath';
import type { Muscle } from '../../../types';

const TEST_MUSCLE: Muscle = {
  id: 'pectoralis-major-left',
  name: 'Pectoralis Major (Left)',
  scientificName: 'Pectoralis Major',
  group: 'chest',
  function: 'Arm adduction',
  exercises: ['Bench Press'],
  views: ['front'],
  relatedMuscles: [],
  paths: { front: 'M10,10 L30,10 L30,30 L10,30 Z' },
};

function renderPath({
  onClick = vi.fn(),
  onLongPress = vi.fn(),
}: {
  onClick?: (muscle: Muscle) => void;
  onLongPress?: (muscle: Muscle) => void;
} = {}) {
  render(
    <svg>
      <MusclePath
        muscle={TEST_MUSCLE}
        view="front"
        isSelected={false}
        isHovered={false}
        isDisabled={false}
        colorByGroup
        accentColor="#EF4444"
        enableTouchInfo
        longPressMs={380}
        onMouseEnter={vi.fn()}
        onMouseLeave={vi.fn()}
        onClick={onClick}
        onLongPress={onLongPress}
      />
    </svg>
  );

  return screen.getByRole('button', { name: /Pectoralis Major \(Left\)/i });
}

describe('MusclePath touch behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('calls onClick on normal tap', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const musclePath = renderPath({ onClick, onLongPress });

    fireEvent.pointerDown(musclePath, { pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.pointerUp(musclePath, { pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.click(musclePath);

    expect(onClick).toHaveBeenCalledWith(TEST_MUSCLE);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('calls onLongPress and suppresses click after long press', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const musclePath = renderPath({ onClick, onLongPress });

    fireEvent.pointerDown(musclePath, { pointerType: 'touch', clientX: 12, clientY: 14 });
    vi.advanceTimersByTime(400);
    fireEvent.pointerUp(musclePath, { pointerType: 'touch', clientX: 12, clientY: 14 });
    fireEvent.click(musclePath);

    expect(onLongPress).toHaveBeenCalledWith(TEST_MUSCLE);
    expect(onClick).not.toHaveBeenCalled();
  });
});

