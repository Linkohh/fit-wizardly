import { beforeEach, describe, expect, it } from 'vitest';
import { useMeasurementsStore } from '@/stores/measurementsStore';

describe('measurementsStore persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useMeasurementsStore.setState({
      measurements: [],
    });
  });

  it('does not persist body measurements to browser storage', () => {
    useMeasurementsStore.getState().addMeasurement({
      id: 'measurement-1',
      date: '2026-04-11',
      weight: 185,
      bodyFat: 14,
      waist: 32,
      unit: 'imperial',
    });

    expect(window.localStorage.getItem('measurements-storage')).toBeNull();
  });
});
