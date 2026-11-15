import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MuscleSelector } from './MuscleSelector';

const device = vi.hoisted(() => ({ isMobile: true, isAppleMobile: false }));

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => device.isMobile }));
vi.mock('@/hooks/use-apple-mobile', () => ({ useAppleMobile: () => device.isAppleMobile }));
vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({ shouldReduceMotion: true }),
}));
vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({ emit: vi.fn().mockResolvedValue(undefined) }),
}));

const BICEPS = 'Biceps (Left)';
const CHEST = 'Pectoralis Major (Left)';
const hitTest = vi.fn<() => Element | null>();
const elementFromPoint = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');

function dispatchPointer(target: Element, type: string, clientX = 40, pointerType = 'touch') {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY: 140, detail: 1 });
  Object.defineProperties(event, {
    pointerType: { value: pointerType },
    pointerId: { value: 1 },
    isPrimary: { value: true },
  });
  fireEvent(target, event);
}

function setup() {
  const onSelectionChange = vi.fn();
  const onInfoRequest = vi.fn();
  render(
    <MuscleSelector
      enableTouchPreview
      showSideView
      showLegend={false}
      showSelectionSidebar={false}
      disabledMuscles={['biceps-right']}
      highlightedMuscles={[{ muscleId: 'brachialis-left', type: 'focus', intensity: 40 }]}
      onSelectionChange={onSelectionChange}
      onInfoRequest={onInfoRequest}
    />
  );
  const canvas = screen.getByTestId('muscle-selector-canvas-area');
  const muscle = (name: string) => within(canvas).getByRole('button', { name });
  const label = (name: string) => within(canvas).queryByText(name, { exact: true });
  const biceps = muscle(BICEPS);
  hitTest.mockReturnValue(biceps);
  return { canvas, muscle, label, biceps, onSelectionChange, onInfoRequest };
}

function waitForHold() {
  act(() => vi.advanceTimersByTime(380));
}

describe('MuscleSelector pointer preview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    device.isMobile = true;
    device.isAppleMobile = false;
    hitTest.mockReset();
    window.localStorage.clear();
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hitTest });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (elementFromPoint) Object.defineProperty(document, 'elementFromPoint', elementFromPoint);
    else Reflect.deleteProperty(document, 'elementFromPoint');
  });

  it('shows and clears a mouse label even in a mobile-width layout', () => {
    const { biceps, label } = setup();
    dispatchPointer(biceps, 'pointerover', 40, 'mouse');
    expect(label(BICEPS)).toBeInTheDocument();
    dispatchPointer(biceps, 'pointerout', 40, 'mouse');
    expect(label(BICEPS)).toBeNull();
  });

  it('keeps quick tap and keyboard selection available', () => {
    const { biceps, onSelectionChange, label } = setup();
    dispatchPointer(biceps, 'pointerdown');
    dispatchPointer(biceps, 'pointerup');
    dispatchPointer(biceps, 'click');
    expect(onSelectionChange).toHaveBeenLastCalledWith(['biceps-left']);
    expect(label(BICEPS)).toBeNull();

    fireEvent.keyDown(biceps, { key: 'Enter' });
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('only reserves native touch gestures that start on selectable muscle paths', () => {
    const { canvas, muscle, biceps } = setup();
    const startTouch = (target: Element) =>
      fireEvent(target, new Event('touchstart', { bubbles: true, cancelable: true }));

    expect(startTouch(biceps)).toBe(false);
    expect(startTouch(muscle('Biceps (Right) (disabled)'))).toBe(true);
    expect(startTouch(canvas.querySelector('svg')!)).toBe(true);
  });

  it('follows touch across the diagram without toggling selection or adding an undo entry', () => {
    device.isMobile = false;
    const { canvas, biceps, muscle, label, onSelectionChange } = setup();
    dispatchPointer(biceps, 'pointerdown');
    dispatchPointer(biceps, 'pointermove', 49);
    expect(label(BICEPS)).toBeNull();
    waitForHold();
    expect(label(BICEPS)).toBeInTheDocument();
    expect(biceps).toHaveAttribute('stroke-width', '1');

    const ghost = canvas.querySelector('[data-ghost-highlight="true"]');
    expect(ghost).not.toBeNull();
    for (const target of [null, muscle('Biceps (Right) (disabled)'), ghost]) {
      hitTest.mockReturnValue(biceps);
      dispatchPointer(biceps, 'pointermove', 50);
      expect(label(BICEPS)).toBeInTheDocument();
      hitTest.mockReturnValue(target);
      dispatchPointer(biceps, 'pointermove', 65);
      expect(label(BICEPS)).toBeNull();
      expect(label('Biceps (Right)')).toBeNull();
      expect(label('Brachialis (Left)')).toBeNull();
    }

    hitTest.mockReturnValue(muscle(CHEST));
    dispatchPointer(biceps, 'pointermove', 75);
    expect(label(CHEST)).toBeInTheDocument();
    expect(label(BICEPS)).toBeNull();
    dispatchPointer(biceps, 'pointerup', 75);
    fireEvent.click(biceps, { detail: 1 }); // Older Safari emits a MouseEvent after touch.
    expect(label(CHEST)).toBeNull();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('shows the touch preview in place of the Apple info hold', () => {
    device.isAppleMobile = true;
    const { biceps, label, onInfoRequest } = setup();
    dispatchPointer(biceps, 'pointerdown');
    waitForHold();
    expect(label(BICEPS)).toBeInTheDocument();
    expect(onInfoRequest).not.toHaveBeenCalled();
  });

  it('cancels the hold on an early drag and consumes its synthetic click', () => {
    const { biceps, label, onSelectionChange } = setup();
    dispatchPointer(biceps, 'pointerdown');
    dispatchPointer(biceps, 'pointermove', 51);
    waitForHold();
    expect(label(BICEPS)).toBeNull();
    dispatchPointer(biceps, 'pointerup', 51);
    dispatchPointer(biceps, 'click', 51);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('does not select when a finger lifts outside the starting muscle', () => {
    const { biceps, onSelectionChange } = setup();
    dispatchPointer(biceps, 'pointerdown');
    hitTest.mockReturnValue(null);
    dispatchPointer(biceps, 'pointerup', 44);
    dispatchPointer(biceps, 'click', 44);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it.each(['pointercancel', 'lostpointercapture'])('clears a preview on %s', (event) => {
    const { biceps, label, onSelectionChange } = setup();
    dispatchPointer(biceps, 'pointerdown');
    waitForHold();
    expect(label(BICEPS)).toBeInTheDocument();
    dispatchPointer(biceps, event);
    expect(label(BICEPS)).toBeNull();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it.each([['Back', 'button'], ['Deep', 'radio']])('clears an active preview when switching to %s', (name, role) => {
    const { biceps, label, onSelectionChange } = setup();
    dispatchPointer(biceps, 'pointerdown');
    waitForHold();
    expect(label(BICEPS)).toBeInTheDocument();
    fireEvent.click(screen.getByRole(role, { name }));
    expect(label(BICEPS)).toBeNull();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
