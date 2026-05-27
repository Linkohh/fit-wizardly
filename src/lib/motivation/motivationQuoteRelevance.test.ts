import { describe, expect, it } from 'vitest';
import { isRelevantMotivationQuote } from './motivationQuoteRelevance';

describe('motivation quote relevance', () => {
  it('accepts broadly fitness-adjacent motivational quotes', () => {
    expect(
      isRelevantMotivationQuote(
        'Discipline and consistent effort turn small workout habits into lasting strength.'
      )
    ).toBe(true);
    expect(
      isRelevantMotivationQuote(
        'Growth comes from courage, resilience, and steady progress toward difficult goals.'
      )
    ).toBe(true);
  });

  it('rejects unrelated quotes', () => {
    expect(isRelevantMotivationQuote('The price of tomatoes changes with the season.')).toBe(false);
    expect(isRelevantMotivationQuote('Quarterly budgets are best reviewed before the board meeting.')).toBe(false);
  });
});
