import { describe, expect, it } from 'vitest';
import { maskVercelAnalyticsEvent } from './vercelAnalytics';

describe('maskVercelAnalyticsEvent', () => {
  it('masks an invite code and drops the query string and hash', () => {
    expect(
      maskVercelAnalyticsEvent({
        type: 'pageview',
        url: 'https://fitwizard.app/circles/join/AB12CD?ref=friend#top',
      }),
    ).toEqual({ type: 'pageview', url: 'https://fitwizard.app/circles/join/:code' });
  });

  it('masks plan, workout and circle ids but keeps route words', () => {
    expect(
      maskVercelAnalyticsEvent({ type: 'pageview', url: 'https://fitwizard.app/workout/plan-123/2' })?.url,
    ).toBe('https://fitwizard.app/workout/:id/:id');
    expect(
      maskVercelAnalyticsEvent({ type: 'event', url: 'https://fitwizard.app/circles/c-9f3/leaderboard' }),
    ).toEqual({ type: 'event', url: 'https://fitwizard.app/circles/:id/leaderboard' });
  });

  it('leaves a plain route unchanged', () => {
    expect(maskVercelAnalyticsEvent({ type: 'pageview', url: 'https://fitwizard.app/plan' })?.url).toBe(
      'https://fitwizard.app/plan',
    );
  });
});
