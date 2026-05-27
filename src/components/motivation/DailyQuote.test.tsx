import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DailyQuote } from './DailyQuote';
import { getDailyQuoteIndex, LOCAL_MOTIVATION_QUOTES } from './quotes';

const mocks = vi.hoisted(() => ({
  isMobile: false,
  shouldReduceMotion: false,
  fetchDailyMotivationQuote: vi.fn(),
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

vi.mock('@/lib/motivation/motivationQuoteClient', () => ({
  fetchDailyMotivationQuote: mocks.fetchDailyMotivationQuote,
  formatRemoteMotivationQuote: (quote: { text: string; author: string | null }) =>
    quote.author ? `${quote.text} — ${quote.author}` : quote.text,
}));

describe('DailyQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isMobile = false;
    mocks.shouldReduceMotion = false;
    mocks.fetchDailyMotivationQuote.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a static quote without starting the rotation timer when reduced motion is enabled', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    mocks.shouldReduceMotion = true;

    render(<DailyQuote />);

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/"/)).toBeInTheDocument();

    setIntervalSpy.mockRestore();
  });

  it('renders the local daily quote before the remote request resolves', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T12:00:00.000Z'));
    mocks.fetchDailyMotivationQuote.mockReturnValue(new Promise(() => {}));
    const localQuote = LOCAL_MOTIVATION_QUOTES[getDailyQuoteIndex(new Date())];

    render(<DailyQuote />);

    expect(screen.getByText(`"${localQuote}"`)).toBeInTheDocument();
    expect(mocks.fetchDailyMotivationQuote).toHaveBeenCalledTimes(1);
  });

  it('merges a valid remote quote into the displayed rotation after local render', async () => {
    vi.useRealTimers();
    mocks.shouldReduceMotion = true;
    let resolveRemoteQuote!: (quote: {
      text: string;
      author: string | null;
      categories: string[];
      source: 'api-ninjas';
    }) => void;
    mocks.fetchDailyMotivationQuote.mockReturnValue(
      new Promise((resolve) => {
        resolveRemoteQuote = resolve;
      })
    );

    render(<DailyQuote />);

    await act(async () => {
      resolveRemoteQuote({
        text: 'Consistent effort builds lasting strength.',
        author: 'Coach Example',
        categories: ['success'],
        source: 'api-ninjas',
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText('"Consistent effort builds lasting strength. — Coach Example"')
      ).toBeInTheDocument();
    });
  });
});
