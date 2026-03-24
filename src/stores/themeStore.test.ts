import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('themeStore legacy migration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it('migrates the legacy theme key before the store hydrates', async () => {
    window.localStorage.setItem(
      'theme-storage',
      JSON.stringify({
        state: { mode: 'dark' },
        version: 0,
      }),
    );

    await import('@/stores/themeStore');

    expect(JSON.parse(window.localStorage.getItem('fitwizard-theme') ?? '{}')).toMatchObject({
      state: { mode: 'dark' },
    });
  });

  it('preserves the modern key when both storage entries exist', async () => {
    window.localStorage.setItem(
      'fitwizard-theme',
      JSON.stringify({
        state: { mode: 'light' },
        version: 0,
      }),
    );
    window.localStorage.setItem(
      'theme-storage',
      JSON.stringify({
        state: { mode: 'dark' },
        version: 0,
      }),
    );

    await import('@/stores/themeStore');

    expect(JSON.parse(window.localStorage.getItem('fitwizard-theme') ?? '{}')).toMatchObject({
      state: { mode: 'light' },
    });
  });
});
