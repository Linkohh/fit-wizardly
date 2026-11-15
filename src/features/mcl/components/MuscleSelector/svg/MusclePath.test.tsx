import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MusclePath } from './MusclePath';
import { SCULPT_DEFAULT, getGhostOpacity, getMuscleOpacity, getSculptStyle, type SculptStyle } from '../../../lib/sculpt';
import type { Muscle, MuscleHighlight } from '../../../types';

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

type RenderOptions = Parameters<typeof renderPathContainer>[0];

function renderPathContainer({
  onClick = vi.fn(),
  onLongPress = vi.fn(),
  sculpt = getSculptStyle(SCULPT_DEFAULT),
  isSelected = false,
  isHovered = false,
  isGhost = false,
  isDisabled = false,
  highlight,
}: {
  onClick?: (muscle: Muscle) => void;
  onLongPress?: (muscle: Muscle) => void;
  sculpt?: SculptStyle;
  isSelected?: boolean;
  isHovered?: boolean;
  isGhost?: boolean;
  isDisabled?: boolean;
  highlight?: MuscleHighlight;
} = {}) {
  const onMouseEnter = vi.fn();
  const { container } = render(
    <svg>
      <MusclePath
        muscle={TEST_MUSCLE}
        view="front"
        isSelected={isSelected}
        sculpt={sculpt}
        isHovered={isHovered}
        highlight={highlight}
        isGhost={isGhost}
        isDisabled={isDisabled}
        colorByGroup
        accentColor="#EF4444"
        enableTouchInfo
        longPressMs={380}
        onMouseEnter={onMouseEnter}
        onMouseLeave={vi.fn()}
        onClick={onClick}
        onLongPress={onLongPress}
      />
    </svg>
  );

  const button = isGhost
    ? (container.querySelector('path.muscle-path') as SVGPathElement)
    : screen.getByRole('button', { name: /Pectoralis Major \(Left\)/i });
  return { container, button, onMouseEnter };
}

function renderPath(options: RenderOptions = {}) {
  return renderPathContainer(options).button;
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

describe('MusclePath sculpt rendering', () => {
  it('unselected muscle uses sculpt.fillOpacity as its target opacity', () => {
    const sculpt = getSculptStyle(30);
    const base = { isSelected: false, isHovered: false, isDisabled: false };
    expect(getMuscleOpacity(base, sculpt, 'default')).toBe(sculpt.fillOpacity);
    expect(getMuscleOpacity(base, sculpt, 'strong')).toBe(sculpt.fillOpacity);
  });

  it('selected muscle stays at opacity 1 when sculpt.fillOpacity is 0.12', () => {
    const sculpt = getSculptStyle(0);
    expect(sculpt.fillOpacity).toBeCloseTo(0.12);
    expect(
      getMuscleOpacity({ isSelected: true, isHovered: false, isDisabled: false }, sculpt, 'default')
    ).toBe(1);
  });

  it('keeps disabled and hovered opacity independent of sculpt', () => {
    const sculpt = getSculptStyle(0);
    expect(getMuscleOpacity({ isSelected: false, isHovered: false, isDisabled: true }, sculpt, 'default')).toBe(0.15);
    expect(getMuscleOpacity({ isSelected: false, isHovered: true, isDisabled: false }, sculpt, 'default')).toBe(0.95);
    expect(getMuscleOpacity({ isSelected: false, isHovered: true, isDisabled: false }, sculpt, 'strong')).toBe(1);
  });

  it('draws a separation edge with strokeOpacity = sculpt.edgeOpacity when not selected or hovered', () => {
    const sculpt = getSculptStyle(80);
    const button = renderPath({ sculpt });
    expect(button.getAttribute('stroke')).toBe('currentColor');
    expect(button.getAttribute('stroke-width')).toBe('0.6');
    expect(Number(button.getAttribute('stroke-opacity'))).toBeCloseTo(sculpt.edgeOpacity);
  });

  it('renders a non-interactive shading overlay (aria-hidden, pointer-events none) only when shadingOpacity > 0', () => {
    const sculpt = getSculptStyle(100);
    const { container } = renderPathContainer({ sculpt });
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(2);
    const overlay = paths[1];
    expect(overlay.getAttribute('d')).toBe(paths[0].getAttribute('d'));
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.getAttribute('pointer-events')).toBe('none');
    expect(overlay.getAttribute('fill')).toBe('url(#muscle-shade)');
    expect(overlay.hasAttribute('tabindex')).toBe(false);
    expect(overlay.hasAttribute('role')).toBe(false);
  });

  it('does not render the shading overlay when shadingOpacity is 0', () => {
    const { container } = renderPathContainer({ sculpt: getSculptStyle(0) });
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('keeps a highlighted resting muscle stroke transparent with width 0', () => {
    const { button } = renderPathContainer({
      highlight: { muscleId: TEST_MUSCLE.id, type: 'fatigue', intensity: 80 },
    });
    expect(button.getAttribute('stroke')).toBe('transparent');
    expect(button.getAttribute('stroke-width')).toBe('0');
    expect(button.hasAttribute('stroke-opacity')).toBe(false);
  });

  it.each([
    ['selected', { isSelected: true }],
    ['hovered', { isHovered: true }],
    ['highlighted', { highlight: { muscleId: TEST_MUSCLE.id, type: 'focus' as const, intensity: 80 } }],
  ])('renders no shading overlay when %s', (_name, state) => {
    const { container } = renderPathContainer({ sculpt: getSculptStyle(100), ...state });
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });
});

describe('MusclePath ghost rendering', () => {
  it('ghost: neutral grey fill, tabIndex -1, aria-hidden, click does not call onClick', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { container, button, onMouseEnter } = renderPathContainer({ onClick, onLongPress, isGhost: true });

    expect(button.getAttribute('fill')).toBe('#9CA3AF');
    expect(button.getAttribute('tabindex')).toBe('-1');
    expect(button.getAttribute('aria-hidden')).toBe('true');
    expect(button.hasAttribute('role')).toBe(false);
    expect(button.style.pointerEvents).toBe('none');
    expect(button.getAttribute('class')).not.toContain('cursor-pointer');
    expect(button.getAttribute('class')).not.toContain('muscle-pulse');

    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.mouseEnter(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(onMouseEnter).not.toHaveBeenCalled();

    // No separation edge and no shading overlay on a ghost.
    expect(button.getAttribute('stroke')).toBe('transparent');
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('ghost: long press does not call onLongPress', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { button } = renderPathContainer({ onLongPress, isGhost: true });
    fireEvent.pointerDown(button, { pointerType: 'touch', clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(500);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('selected ghost: opacity 0.45 with its selection stroke, still not clickable', () => {
    const onClick = vi.fn();
    const { button } = renderPathContainer({ onClick, isGhost: true, isSelected: true });

    expect(getGhostOpacity(true, getSculptStyle(SCULPT_DEFAULT))).toBe(0.45);
    expect(button.getAttribute('stroke')).not.toBe('transparent');
    expect(button.getAttribute('stroke-width')).toBe('1.5');
    expect(button.getAttribute('class')).not.toContain('muscle-pulse');
    expect(button.style.filter).not.toContain('drop-shadow');

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('ghost overrides disabled styling', () => {
    const { button } = renderPathContainer({ isGhost: true, isDisabled: true });
    expect(button.getAttribute('class')).not.toContain('cursor-not-allowed');
  });
});
