import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGlobalClickFeedback } from './useGlobalClickFeedback';

const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
  primeClickSound: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/hooks/useUserPreferences', () => ({
  usePreferencesStore: (
    selector: (state: { settings: { sounds: boolean; haptics: boolean } }) => unknown
  ) =>
    selector({
      settings: {
        sounds: true,
        haptics: true,
      },
    }),
}));

vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({
    emit: mocks.emit,
  }),
}));

vi.mock('@/lib/clickFeedback/clickSound', () => ({
  primeClickSound: mocks.primeClickSound,
}));

function Harness() {
  useGlobalClickFeedback();

  return (
    <button data-click-feedback-event="brandHome" type="button">
      Tap me
    </button>
  );
}

describe('useGlobalClickFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('splits touch feedback into haptics on press and sound on click', () => {
    render(<Harness />);

    const button = screen.getByRole('button', { name: 'Tap me' });

    fireEvent.pointerDown(button, {
      button: 0,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.click(button, { detail: 1 });

    expect(mocks.primeClickSound).toHaveBeenCalledTimes(1);
    expect(mocks.emit).toHaveBeenNthCalledWith(1, 'brandHome', {
      pointerType: 'touch',
      channel: 'haptic',
    });
    expect(mocks.emit).toHaveBeenNthCalledWith(2, 'brandHome', {
      channel: 'sound',
    });
  });
});
