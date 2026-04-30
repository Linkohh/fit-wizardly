import type { ReadinessEntry } from '@/types/readiness';

export type ReadinessDayRange = 7 | 14 | 30;

function parseReadinessDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function getRangeCutoff(days: ReadinessDayRange, now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return cutoff;
}

export function filterReadinessLogsByRange(
  logs: ReadinessEntry[],
  days: ReadinessDayRange,
  now: Date = new Date()
): ReadinessEntry[] {
  const cutoff = getRangeCutoff(days, now);

  return logs
    .filter((entry) => parseReadinessDate(entry.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}
