import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasSeenAbout, markAboutSeen } from './aboutSeen';

describe('aboutSeen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.removeItem('fitwizard-about-seen');
  });

  it('is unseen until marked, then stays seen', () => {
    expect(hasSeenAbout()).toBe(false);
    markAboutSeen();
    expect(hasSeenAbout()).toBe(true);
  });

  it('treats unreadable storage as seen so the hint never nags', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(hasSeenAbout()).toBe(true);
  });

  it('swallows write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => markAboutSeen()).not.toThrow();
  });
});
