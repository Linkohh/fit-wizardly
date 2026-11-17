/**
 * Small, shared checks for data read back from device storage.
 * Stores use these in their merge() so malformed entries are dropped instead
 * of crashing the app. See ADR 11 (local-first user data).
 */

export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function toValidDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** Keeps the items that pass `sanitizeItem`, up to `max`. Non-arrays give []. */
export function sanitizeList<T>(
  value: unknown,
  sanitizeItem: (item: unknown) => T | null,
  max = Number.POSITIVE_INFINITY,
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const items: T[] = [];
  for (const item of value) {
    const clean = sanitizeItem(item);
    if (clean !== null) items.push(clean);
    if (items.length >= max) break;
  }
  return items;
}

export function sanitizeStringList(value: unknown): string[] {
  return sanitizeList(value, (item) => (typeof item === 'string' ? item : null));
}
