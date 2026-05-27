import { isRelevantMotivationQuote } from './motivationQuoteRelevance';
import type { RemoteMotivationQuote } from './motivationQuoteTypes';

const API_NINJAS_RANDOM_QUOTES_URL = 'https://api.api-ninjas.com/v2/randomquotes';
const DEFAULT_TIMEOUT_MS = 3500;
const MAX_QUOTE_LENGTH = 500;

export const API_NINJAS_MOTIVATION_CATEGORIES = [
  'inspirational',
  'success',
  'courage',
  'leadership',
  'wisdom',
] as const;

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type ApiNinjasQuoteRecord = {
  quote?: unknown;
  author?: unknown;
  categories?: unknown;
};

type FetchApiNinjasMotivationQuoteOptions = {
  apiKey?: string;
  fetcher?: Fetcher;
  now?: Date;
  timeoutMs?: number;
};

function getServerApiNinjasKey() {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };

  return runtime.process?.env?.API_NINJAS_API_KEY;
}

export function selectApiNinjasMotivationCategory(now = new Date()) {
  const dayBucket = Math.floor(now.getTime() / 86_400_000);
  return API_NINJAS_MOTIVATION_CATEGORIES[
    dayBucket % API_NINJAS_MOTIVATION_CATEGORIES.length
  ];
}

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeCategories(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((category): category is string => typeof category === 'string' && Boolean(category.trim()))
    .map((category) => category.trim());
}

function getFirstQuoteRecord(payload: unknown): ApiNinjasQuoteRecord | null {
  if (Array.isArray(payload)) {
    return typeof payload[0] === 'object' && payload[0] !== null
      ? (payload[0] as ApiNinjasQuoteRecord)
      : null;
  }

  return typeof payload === 'object' && payload !== null ? (payload as ApiNinjasQuoteRecord) : null;
}

export function parseApiNinjasMotivationQuote(payload: unknown): RemoteMotivationQuote | null {
  const record = getFirstQuoteRecord(payload);
  const text = normalizeOptionalString(record?.quote);

  if (!text || text.length > MAX_QUOTE_LENGTH || !isRelevantMotivationQuote(text)) {
    return null;
  }

  return {
    text,
    author: normalizeOptionalString(record?.author),
    categories: normalizeCategories(record?.categories),
    source: 'api-ninjas',
  };
}

export async function fetchApiNinjasMotivationQuote({
  apiKey = getServerApiNinjasKey(),
  fetcher = fetch,
  now = new Date(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: FetchApiNinjasMotivationQuoteOptions = {}): Promise<RemoteMotivationQuote | null> {
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const category = selectApiNinjasMotivationCategory(now);
  const url = `${API_NINJAS_RANDOM_QUOTES_URL}?categories=${encodeURIComponent(category)}`;

  try {
    const response = await fetcher(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Api-Key': apiKey,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return parseApiNinjasMotivationQuote(payload);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
