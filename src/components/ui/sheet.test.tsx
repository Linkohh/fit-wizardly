import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Sheet, SheetContent } from './sheet';

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: vi.fn(() => true),
  });
});

describe('SheetContent', () => {
  it('renders a mobile-friendly close button affordance', () => {
    render(
      <Sheet open onOpenChange={vi.fn()}>
        <SheetContent>Drawer content</SheetContent>
      </Sheet>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close menu' });

    expect(closeButton).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    expect(closeButton).toHaveClass('bg-transparent', 'border-transparent');
    expect(closeButton.querySelector('svg')).toHaveClass('h-5', 'w-5');
  });

  it('applies caller-provided close button classes without replacing the default affordance', () => {
    render(
      <Sheet open onOpenChange={vi.fn()}>
        <SheetContent closeButtonClassName="top-[calc(env(safe-area-inset-top,0px)+0.75rem)] bg-white/75">
          Drawer content
        </SheetContent>
      </Sheet>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close menu' });

    expect(closeButton).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    expect(closeButton).toHaveClass(
      'top-[calc(env(safe-area-inset-top,0px)+0.75rem)]',
      'bg-white/75',
    );
  });

  it('closes a right-side gesture drawer when swiped past the threshold', () => {
    const onGestureClose = vi.fn();
    render(
      <Sheet open onOpenChange={vi.fn()}>
        <SheetContent
          enableGestures
          gestureMode="full-panel"
          onGestureClose={onGestureClose}
          title="FitWizard menu"
          description="Navigation and quick controls"
        >
          Drawer content
        </SheetContent>
      </Sheet>,
    );

    const drawer = screen.getByRole('dialog', { name: 'FitWizard menu' });

    fireEvent.pointerDown(drawer, { pointerId: 1, clientX: 40, clientY: 120 });
    fireEvent.pointerMove(drawer, { pointerId: 1, clientX: 220, clientY: 124 });
    fireEvent.pointerUp(drawer, { pointerId: 1, clientX: 220, clientY: 124 });

    expect(onGestureClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the drawer open for short or vertical gestures', () => {
    const onGestureClose = vi.fn();
    render(
      <Sheet open onOpenChange={vi.fn()}>
        <SheetContent
          enableGestures
          gestureMode="full-panel"
          onGestureClose={onGestureClose}
          title="FitWizard menu"
          description="Navigation and quick controls"
        >
          Drawer content
        </SheetContent>
      </Sheet>,
    );

    const drawer = screen.getByRole('dialog', { name: 'FitWizard menu' });

    fireEvent.pointerDown(drawer, { pointerId: 1, clientX: 40, clientY: 120 });
    fireEvent.pointerMove(drawer, { pointerId: 1, clientX: 88, clientY: 122 });
    fireEvent.pointerUp(drawer, { pointerId: 1, clientX: 88, clientY: 122 });

    fireEvent.pointerDown(drawer, { pointerId: 2, clientX: 40, clientY: 120 });
    fireEvent.pointerMove(drawer, { pointerId: 2, clientX: 52, clientY: 220 });
    fireEvent.pointerUp(drawer, { pointerId: 2, clientX: 52, clientY: 220 });

    expect(onGestureClose).not.toHaveBeenCalled();
  });

  it('does not start swipe-close gestures from interactive controls', () => {
    const onGestureClose = vi.fn();
    render(
      <Sheet open onOpenChange={vi.fn()}>
        <SheetContent
          enableGestures
          gestureMode="full-panel"
          onGestureClose={onGestureClose}
          title="FitWizard menu"
          description="Navigation and quick controls"
        >
          <button type="button">Theme control</button>
        </SheetContent>
      </Sheet>,
    );

    const drawer = screen.getByRole('dialog', { name: 'FitWizard menu' });
    const button = screen.getByRole('button', { name: 'Theme control' });

    fireEvent.pointerDown(button, { pointerId: 1, clientX: 40, clientY: 120 });
    fireEvent.pointerMove(drawer, { pointerId: 1, clientX: 260, clientY: 124 });
    fireEvent.pointerUp(drawer, { pointerId: 1, clientX: 260, clientY: 124 });

    expect(onGestureClose).not.toHaveBeenCalled();
  });
});
