import { describe, expect, it } from 'vitest';
import { filterReadinessLogsByRange } from '@/lib/readinessRange';
import type { ReadinessEntry } from '@/types/readiness';

function buildEntry(date: string): ReadinessEntry {
  return {
    date,
    sleepQuality: 3,
    muscleSoreness: 3,
    energyLevel: 3,
    stressLevel: 3,
    overallScore: 3,
  };
}

describe('filterReadinessLogsByRange', () => {
  it('returns exactly seven calendar days including today for the 7d range', () => {
    const now = new Date(2026, 3, 30, 12);
    const logs = [
      '2026-04-30',
      '2026-04-29',
      '2026-04-28',
      '2026-04-27',
      '2026-04-26',
      '2026-04-25',
      '2026-04-24',
      '2026-04-23',
    ].map(buildEntry);

    const result = filterReadinessLogsByRange(logs, 7, now);

    expect(result.map((entry) => entry.date)).toEqual([
      '2026-04-24',
      '2026-04-25',
      '2026-04-26',
      '2026-04-27',
      '2026-04-28',
      '2026-04-29',
      '2026-04-30',
    ]);
  });

  it('sorts retained logs from oldest to newest', () => {
    const now = new Date(2026, 3, 30, 12);
    const logs = ['2026-04-29', '2026-04-24', '2026-04-30'].map(buildEntry);

    const result = filterReadinessLogsByRange(logs, 7, now);

    expect(result.map((entry) => entry.date)).toEqual([
      '2026-04-24',
      '2026-04-29',
      '2026-04-30',
    ]);
  });
});
