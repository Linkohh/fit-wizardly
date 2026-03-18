import { formatIdentifierLabel } from '@/lib/displayText';

const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function decodeHtmlEntities(value: string) {
  return value.replace(
    /&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g,
    (match) => HTML_ENTITY_MAP[match] ?? match
  );
}

export function stripHtml(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

export function formatExerciseLabel(value: string) {
  const normalized = value
    .replace(/^none \(bodyweight exercise\)$/i, 'Bodyweight')
    .replace(/^dumbbell$/i, 'Dumbbells')
    .replace(/^barbell$/i, 'Barbell')
    .replace(/^kettlebell$/i, 'Kettlebells');

  if (normalized.includes('_')) {
    return formatIdentifierLabel(normalized);
  }

  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function createSearchText(parts: Array<string | null | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLowerCase();
}

export function formatTimestamp(isoString: string | null) {
  if (!isoString) return 'Never';
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
}

export function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase();
}
