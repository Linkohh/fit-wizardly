import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeMeasurements } from '@/stores/measurementsStore';

async function startApp() {
  vi.resetModules();
  const { useMeasurementsStore } = await import('@/stores/measurementsStore');
  await vi.waitFor(() => {
    expect(useMeasurementsStore.persist.hasHydrated()).toBe(true);
  });
  return useMeasurementsStore;
}

describe('measurementsStore persistence', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await startApp();
    // persist.clearStorage() doesn't return its promise, so clear directly.
    const { appStorage } = await import('@/lib/storage/appStorage');
    await appStorage.removeItem('fitwizard-measurements');
    expect(await appStorage.getItem('fitwizard-measurements')).toBeNull();
  });

  it('keeps body measurements after a restart', async () => {
    let store = await startApp();
    store.getState().addMeasurement({
      id: 'measurement-1',
      date: '2026-04-11',
      weight: 185,
      bodyFat: 14,
      waist: 32,
      unit: 'imperial',
    });
    const { appStorage } = await import('@/lib/storage/appStorage');
    await vi.waitFor(async () => {
      expect(await appStorage.getItem('fitwizard-measurements')).toContain('measurement-1');
    });

    store = await startApp();

    expect(store.getState().measurements).toHaveLength(1);
    expect(store.getState().measurements[0].weight).toBe(185);
  });

  it('does not write body measurements to localStorage', async () => {
    const store = await startApp();
    store.getState().addMeasurement({
      id: 'measurement-1',
      date: '2026-04-11',
      weight: 185,
      unit: 'imperial',
    });
    const { appStorage } = await import('@/lib/storage/appStorage');
    await vi.waitFor(async () => {
      expect(await appStorage.getItem('fitwizard-measurements')).toContain('measurement-1');
    });

    expect(window.localStorage.getItem('measurements-storage')).toBeNull();
    expect(window.localStorage.getItem('fitwizard-measurements')).toBeNull();
  });
});

describe('sanitizeMeasurements', () => {
  it('drops malformed entries and sorts newest first', () => {
    const result = sanitizeMeasurements([
      { id: 'old', date: '2026-01-01', unit: 'metric', weight: 80 },
      { id: 'no-unit', date: '2026-02-01' },
      'junk',
      { id: 'new', date: '2026-03-01', unit: 'metric', weight: 79 },
    ]);

    expect(result.map((m) => m.id)).toEqual(['new', 'old']);
  });

  it('returns an empty list for non-array data', () => {
    expect(sanitizeMeasurements(undefined)).toEqual([]);
    expect(sanitizeMeasurements({ measurements: [] })).toEqual([]);
  });
});
