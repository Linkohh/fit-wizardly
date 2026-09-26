import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasSeenChangelog, markChangelogSeen } from './changelogSeen';

describe('changelogSeen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.removeItem('fitwizard-changelog-seen');
  });

  it('tracks the last version whose notes were opened', () => {
    expect(hasSeenChangelog('1.0.0')).toBe(false);
    markChangelogSeen('1.0.0');
    expect(hasSeenChangelog('1.0.0')).toBe(true);
    // A new release shows the unread dot again.
    expect(hasSeenChangelog('1.1.0')).toBe(false);
  });

  it('treats unreadable storage as seen, and swallows write failures', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(hasSeenChangelog('1.0.0')).toBe(true);
    expect(() => markChangelogSeen('1.0.0')).not.toThrow();
  });
});
