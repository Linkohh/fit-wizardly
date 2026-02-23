import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMotionPreferences } from './use-motion-preferences';

const mocks = vi.hoisted(() => ({
  prefersReducedMotion: false,
  settingsReducedMotion: false,
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => mocks.prefersReducedMotion,
  };
});

vi.mock('@/hooks/useUserPreferences', () => ({
  usePreferencesStore: (selector: (state: { settings: { reducedMotion: boolean } }) => unknown) =>
    selector({
      settings: {
        reducedMotion: mocks.settingsReducedMotion,
      },
    }),
}));

describe('useMotionPreferences', () => {
  beforeEach(() => {
    mocks.prefersReducedMotion = false;
    mocks.settingsReducedMotion = false;
  });

  it('returns reduced-motion true when media query prefers reduced motion', () => {
    mocks.prefersReducedMotion = true;
    const { result } = renderHook(() => useMotionPreferences());
    expect(result.current.shouldReduceMotion).toBe(true);
  });

  it('returns reduced-motion true when user settings enables it', () => {
    mocks.settingsReducedMotion = true;
    const { result } = renderHook(() => useMotionPreferences());
    expect(result.current.shouldReduceMotion).toBe(true);
  });

  it('returns reduced-motion false when both inputs are false', () => {
    const { result } = renderHook(() => useMotionPreferences());
    expect(result.current.shouldReduceMotion).toBe(false);
  });
});
