import type { MotivationQuoteApiResponse, RemoteMotivationQuote } from './motivationQuoteTypes';

const CACHE_KEY = 'fitwizard:motivation-quote:v1';
const CACHE_VERSION = 1;
const DEFAULT_TIMEOUT_MS = 2500;
const MAX_QUOTE_LENGTH = 500;

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type FetchDailyMotivationQuoteOptions = {
  fetcher?: Fetcher;
  now?: Date;
  timeoutMs?: number;
  storage?: Storage | null;
};

type QuoteCacheRecord = {
  version: number;
  date: string;
  quote: RemoteMotivationQuote;
};

function getLocalDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function getBrowserStorage(storage?: Storage | null) {
  if (storage !== undefined) {
    return storage;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function isRemoteMotivationQuote(value: unknown): value is RemoteMotivationQuote {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const quote = value as Record<string, unknown>;
  const text = normalizeNullableString(quote.text);
  const source = quote.source;
  const categories = quote.categories;

  return Boolean(
    text &&
      text.length <= MAX_QUOTE_LENGTH &&
      source === 'api-ninjas' &&
      Array.isArray(categories) &&
      categories.every((category) => typeof category === 'string')
  );
}

function readCachedQuote(storage: Storage | null, dateKey: string) {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<QuoteCacheRecord>) : null;

    if (
      parsed?.version === CACHE_VERSION &&
      parsed.date === dateKey &&
      isRemoteMotivationQuote(parsed.quote)
    ) {
      return parsed.quote;
    }
  } catch {
    return null;
  }

  return null;
}

function writeCachedQuote(storage: Storage | null, dateKey: string, quote: RemoteMotivationQuote) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      CACHE_KEY,
      JSON.stringify({
        version: CACHE_VERSION,
        date: dateKey,
        quote,
      })
    );
  } catch {
    // localStorage may be unavailable or quota-limited; the UI can still use local quotes.
  }
}

function parseQuoteResponse(payload: unknown): RemoteMotivationQuote | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const quote = (payload as MotivationQuoteApiResponse).quote;
  return isRemoteMotivationQuote(quote) ? quote : null;
}

export function formatRemoteMotivationQuote(quote: RemoteMotivationQuote) {
  return quote.author ? `${quote.text} — ${quote.author}` : quote.text;
}

export async function fetchDailyMotivationQuote({
  fetcher = fetch,
  now = new Date(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  storage,
}: FetchDailyMotivationQuoteOptions = {}): Promise<RemoteMotivationQuote | null> {
  const dateKey = getLocalDateKey(now);
  const resolvedStorage = getBrowserStorage(storage);
  const cachedQuote = readCachedQuote(resolvedStorage, dateKey);

  if (cachedQuote) {
    return cachedQuote;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher('/api/motivation-quote', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const quote = parseQuoteResponse(await response.json());

    if (!quote) {
      return null;
    }

    writeCachedQuote(resolvedStorage, dateKey, quote);
    return quote;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
