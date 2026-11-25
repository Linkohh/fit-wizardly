import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_FADE_ATTRIBUTE, changeThemeWithFade } from './themeFade';

type StartViewTransition = (callback: () => void) => { finished: Promise<void> };

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduce : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function setViewTransitions(start: StartViewTransition | undefined) {
  Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true, writable: true });
}

/** Mimics ThemeProvider: the store change puts the class on <html>. */
const applyDark = () => document.documentElement.classList.add('dark');

describe('changeThemeWithFade', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute(THEME_FADE_ATTRIBUTE);
    setReducedMotion(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    setViewTransitions(undefined);
  });

  it('crossfades and applies the theme inside the transition, then clears its attribute', async () => {
    let resolveFinished!: () => void;
    const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });
    let attributeDuringCallback: string | null = null;
    const start = vi.fn<StartViewTransition>((callback) => {
      attributeDuringCallback = document.documentElement.getAttribute(THEME_FADE_ATTRIBUTE);
      callback();
      return { finished };
    });
    setViewTransitions(start);

    changeThemeWithFade('dark', applyDark);

    expect(start).toHaveBeenCalledTimes(1);
    expect(attributeDuringCallback).toBe('to-dark');
    // The theme is applied synchronously, inside the transition callback.
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute(THEME_FADE_ATTRIBUTE)).toBe('to-dark');

    resolveFinished();
    await finished;
    await Promise.resolve();
    expect(document.documentElement.hasAttribute(THEME_FADE_ATTRIBUTE)).toBe(false);
  });

  it('applies immediately, with no fade, when Reduce Motion is on', () => {
    setReducedMotion(true);
    const start = vi.fn<StartViewTransition>();
    setViewTransitions(start);

    changeThemeWithFade('dark', applyDark);

    expect(start).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.hasAttribute(THEME_FADE_ATTRIBUTE)).toBe(false);
  });

  it('applies immediately when the browser has no View Transitions', () => {
    setViewTransitions(undefined);
    changeThemeWithFade('dark', applyDark);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.hasAttribute(THEME_FADE_ATTRIBUTE)).toBe(false);
  });

  it("doesn't fade when the visible theme stays the same (e.g. System while the OS is light)", () => {
    const start = vi.fn<StartViewTransition>();
    setViewTransitions(start);
    const apply = vi.fn();

    changeThemeWithFade('light', apply);

    expect(start).not.toHaveBeenCalled();
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('still applies the theme if starting the transition throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    setViewTransitions(() => { throw new Error('InvalidStateError'); });

    changeThemeWithFade('dark', applyDark);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.hasAttribute(THEME_FADE_ATTRIBUTE)).toBe(false);
    consoleError.mockRestore();
  });

  it('keeps the latest choice when a second tap lands before the first fade has applied', async () => {
    // Real browsers run the callback a frame later, after capturing the old screen.
    const pending: Array<() => void> = [];
    setViewTransitions((callback) => {
      pending.push(callback);
      return { finished: Promise.resolve() };
    });
    let chosen = 'light';
    const choose = (mode: 'light' | 'dark') => () => {
      chosen = mode;
      document.documentElement.classList.toggle('dark', mode === 'dark');
    };

    changeThemeWithFade('dark', choose('dark')); // deferred
    changeThemeWithFade('light', choose('light')); // <html> is still light: applies at once
    expect(chosen).toBe('light');

    pending.forEach((callback) => callback()); // the stale Dark callback runs late
    expect(chosen).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(document.documentElement.hasAttribute(THEME_FADE_ATTRIBUTE)).toBe(false);
  });

  it('lets only the latest of two quick taps clear the attribute', async () => {
    const resolvers: Array<() => void> = [];
    setViewTransitions((callback) => {
      callback();
      return { finished: new Promise<void>((resolve) => resolvers.push(resolve)) };
    });

    changeThemeWithFade('dark', applyDark);
    changeThemeWithFade('light', () => document.documentElement.classList.remove('dark'));
    expect(document.documentElement.getAttribute(THEME_FADE_ATTRIBUTE)).toBe('to-light');

    resolvers[0]();
    await Promise.resolve();
    await Promise.resolve();
    expect(document.documentElement.getAttribute(THEME_FADE_ATTRIBUTE)).toBe('to-light');

    resolvers[1]();
    await Promise.resolve();
    await Promise.resolve();
    expect(document.documentElement.hasAttribute(THEME_FADE_ATTRIBUTE)).toBe(false);
  });
});
