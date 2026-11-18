import { MEASUREMENTS_STORE_NAME, sanitizeMeasurements, useMeasurementsStore } from '@/stores/measurementsStore';
import { READINESS_STORE_NAME, sanitizeReadinessEntry, useReadinessStore } from '@/stores/readinessStore';
import { createStoreCollection, isStorableDay, required } from '@/lib/sync/storeCollection';
import type { BodyMeasurement } from '@/types/fitness';
import type { ReadinessEntry } from '@/types/readiness';

const measuredOn = (measurement: BodyMeasurement) => measurement.date.slice(0, 10);

/** `body_measurements` (migration 007). `measured_on` is the measurement's day. */
export const bodyMeasurementsCollection = createStoreCollection<BodyMeasurement>({
  table: 'body_measurements',
  keyColumn: 'id',
  onConflict: 'user_id,id',
  stores: [{ store: useMeasurementsStore, persistName: MEASUREMENTS_STORE_NAME }],
  readItems: () => useMeasurementsStore.getState().measurements.filter((m) => isStorableDay(measuredOn(m))),
  writeItems: (items) => {
    const kept = useMeasurementsStore.getState().measurements.filter((m) => !isStorableDay(measuredOn(m)));
    const measurements = [...kept, ...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    useMeasurementsStore.setState({ measurements });
  },
  key: (measurement) => measurement.id,
  toRow: (measurement, userId) => ({
    user_id: userId,
    id: measurement.id,
    measured_on: measuredOn(measurement),
    data: measurement,
    deleted_at: null,
  }),
  fromRow: (row) => required(sanitizeMeasurements([row.data])[0], 'body_measurements row'),
});

/** `readiness_entries` (migration 007): one check-in per day. */
export const readinessEntriesCollection = createStoreCollection<ReadinessEntry>({
  table: 'readiness_entries',
  keyColumn: 'day',
  onConflict: 'user_id,day',
  stores: [{ store: useReadinessStore, persistName: READINESS_STORE_NAME }],
  readItems: () => useReadinessStore.getState().logs.filter((entry) => isStorableDay(entry.date)),
  writeItems: (items) => {
    const kept = useReadinessStore.getState().logs.filter((entry) => !isStorableDay(entry.date));
    // Newest first, as logReadiness() keeps them.
    const logs = [...kept, ...items].sort((a, b) => b.date.localeCompare(a.date));
    useReadinessStore.setState({ logs });
  },
  key: (entry) => entry.date,
  toRow: (entry, userId) => ({ user_id: userId, day: entry.date, entry, deleted_at: null }),
  fromRow: (row) => {
    const entry = required(sanitizeReadinessEntry(row.entry), 'readiness_entries row');
    return { ...entry, date: String(row.day).slice(0, 10) };
  },
});
