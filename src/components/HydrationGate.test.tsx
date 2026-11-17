import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HydrationGate } from './HydrationGate';
import { useStoresHydrated } from '@/hooks/useStoresHydrated';
import {
  HYDRATION_SAFETY_TIMEOUT_MS,
  hydrationTracking,
  markHydrated,
  registerHydration,
  resetHydrationForTests,
} from '@/lib/storage/hydration';

vi.mock('@/components/ui/loading-screen', () => ({
  LoadingScreen: () => <div>Loading saved data</div>,
}));

describe('useStoresHydrated', () => {
  beforeEach(() => {
    resetHydrationForTests();
  });

  it('is true when no store has registered', () => {
    const { result } = renderHook(() => useStoresHydrated());
    expect(result.current).toBe(true);
  });

  it('waits for every registered store', () => {
    registerHydration('fitwizard-plans');
    registerHydration('fitwizard-nutrition-storage');
    const { result } = renderHook(() => useStoresHydrated());
    expect(result.current).toBe(false);

    act(() => markHydrated('fitwizard-plans'));
    expect(result.current).toBe(false);

    act(() => markHydrated('fitwizard-nutrition-storage'));
    expect(result.current).toBe(true);
  });

  it('marks a store hydrated through the persist callback, even after an error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { onRehydrateStorage } = hydrationTracking('fitwizard-measurements');
    const { result } = renderHook(() => useStoresHydrated());
    expect(result.current).toBe(false);

    act(() => onRehydrateStorage()(undefined, new Error('corrupt data')));

    expect(result.current).toBe(true);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('HydrationGate', () => {
  beforeEach(() => {
    resetHydrationForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the app straight away when nothing needs loading', () => {
    render(<HydrationGate><p>App content</p></HydrationGate>);
    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('shows the loading screen until stores have loaded, then the app', () => {
    registerHydration('fitwizard-plans');
    render(<HydrationGate><p>App content</p></HydrationGate>);

    expect(screen.getByText('Loading saved data')).toBeInTheDocument();
    expect(screen.queryByText('App content')).not.toBeInTheDocument();

    act(() => markHydrated('fitwizard-plans'));

    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('stays open when a store registers after the app has shown', () => {
    render(<HydrationGate><p>App content</p></HydrationGate>);

    act(() => registerHydration('fitwizard-late-store'));

    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('opens after the safety timeout if a store never finishes loading', () => {
    vi.useFakeTimers();
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    registerHydration('fitwizard-stuck-store');
    render(<HydrationGate><p>App content</p></HydrationGate>);
    expect(screen.getByText('Loading saved data')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(HYDRATION_SAFETY_TIMEOUT_MS);
    });

    expect(screen.getByText('App content')).toBeInTheDocument();
    expect(consoleWarn).toHaveBeenCalledWith(
      '[FitWizard] Stores still loading after the safety timeout:',
      'fitwizard-stuck-store',
    );
    consoleWarn.mockRestore();
  });
});
