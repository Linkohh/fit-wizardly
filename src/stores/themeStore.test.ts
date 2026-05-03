import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('themeStore legacy migration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
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

  it('keeps resolvedTheme in sync with explicit and system modes without persisting it', async () => {
    const { useThemeStore } = await import('@/stores/themeStore');

    expect(useThemeStore.getState().resolvedTheme).toBe('dark');

    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState()).toMatchObject({
      mode: 'light',
      resolvedTheme: 'light',
    });

    useThemeStore.getState().setMode('system');
    expect(useThemeStore.getState()).toMatchObject({
      mode: 'system',
      resolvedTheme: 'dark',
    });

    useThemeStore.getState().syncSystemTheme(false);
    expect(useThemeStore.getState().resolvedTheme).toBe('light');

    expect(JSON.parse(window.localStorage.getItem('fitwizard-theme') ?? '{}')).toMatchObject({
      state: { mode: 'system' },
    });
    expect(window.localStorage.getItem('fitwizard-theme')).not.toContain('resolvedTheme');
  });
});
