import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DailyQuote } from './DailyQuote';

const mocks = vi.hoisted(() => ({
  isMobile: false,
  shouldReduceMotion: false,
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mocks.isMobile,
}));

vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    shouldReduceMotion: mocks.shouldReduceMotion,
    prefersReducedMotion: mocks.shouldReduceMotion,
    reducedMotionEnabled: mocks.shouldReduceMotion,
  }),
}));

describe('DailyQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isMobile = false;
    mocks.shouldReduceMotion = false;
  });

  it('renders a static quote without starting the rotation timer on mobile', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    mocks.isMobile = true;

    render(<DailyQuote />);

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/"/)).toBeInTheDocument();

    setIntervalSpy.mockRestore();
  });
});
