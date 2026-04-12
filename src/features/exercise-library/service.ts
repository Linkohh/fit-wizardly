import { loadLegacyExerciseLibraryRecords } from './legacy';
import { normalizeWgerExercise, validateNormalizedRecords } from './normalize';
import type {
  ExerciseLibraryRecord,
  ExerciseLibrarySnapshotPayload,
  ExerciseLibrarySource,
  ExerciseLibraryState,
  WgerExerciseInfoPage,
  WgerExerciseInfoRecord,
} from './types';

const CACHE_KEY = 'fitwizard:exercise-library:last-known-good:v2';
const FAILURE_META_KEY = 'fitwizard:exercise-library:failure-meta:v1';
const CACHE_VERSION = 2;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 60 * 1000;
const MINIMUM_RECORD_COUNT = 200;
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_COUNT = 30;
const REQUEST_TIMEOUT_MS = 12000;
const WGER_API_URL = 'https://wger.de/api/v2/exerciseinfo/';
const WGER_ALLOWED_ORIGINS = new Set(['https://wger.de', 'https://www.wger.de']);
const SNAPSHOT_ASSET_VERSION = 'v1';
const SNAPSHOT_ASSET_PATH = `${import.meta.env.BASE_URL}exercise-data/wger-snapshot.${SNAPSHOT_ASSET_VERSION}.json`;

interface PersistedExerciseLibraryCache {
  version: number;
  storedAt: string;
  source: ExerciseLibrarySource;
  lastSyncedAt: string | null;
  records: ExerciseLibraryRecord[];
}

interface FailureMeta {
  count: number;
  lastFailureAt: string | null;
  cooldownUntil: string | null;
}

const EMPTY_STATE: ExerciseLibraryState = {
  records: [],
  source: 'snapshot',
  isStale: true,
  lastSyncedAt: null,
  syncStatus: 'loading',
  error: null,
};

let currentState: ExerciseLibraryState = EMPTY_STATE;
let loadPromise: Promise<ExerciseLibraryState> | null = null;
let syncPromise: Promise<ExerciseLibraryState | null> | null = null;
const listeners = new Set<() => void>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(nextState: ExerciseLibraryState) {
  currentState = nextState;
  emitChange();
}

function parseJson<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota failures and continue with in-memory state.
  }
}

function getFailureMeta(): FailureMeta {
  const parsed = parseJson<FailureMeta>(FAILURE_META_KEY);
  if (!parsed) {
    return {
      count: 0,
      lastFailureAt: null,
      cooldownUntil: null,
    };
  }

  return {
    count: typeof parsed.count === 'number' ? parsed.count : 0,
    lastFailureAt: parsed.lastFailureAt ?? null,
    cooldownUntil: parsed.cooldownUntil ?? null,
  };
}

function writeFailureMeta(meta: FailureMeta) {
  writeJson(FAILURE_META_KEY, meta);
}

function resetFailureMeta() {
  writeFailureMeta({
    count: 0,
    lastFailureAt: null,
    cooldownUntil: null,
  });
}

function recordSyncFailure() {
  const now = new Date();
  const current = getFailureMeta();
  const count = current.count + 1;
  const shouldCooldown = count >= 3;

  writeFailureMeta({
    count,
    lastFailureAt: now.toISOString(),
    cooldownUntil: shouldCooldown
      ? new Date(now.getTime() + COOLDOWN_MS).toISOString()
      : null,
  });
}

function isInCooldown() {
  const meta = getFailureMeta();
  if (!meta.cooldownUntil) return false;
  const cooldownUntil = new Date(meta.cooldownUntil).getTime();
  if (Number.isNaN(cooldownUntil)) return false;
  return cooldownUntil > Date.now();
}

function normalizeNextPageUrl(nextUrl: string | null, currentUrl: string) {
  if (!nextUrl) {
    return '';
  }

  let parsed: URL;
  try {
    parsed = new URL(nextUrl, currentUrl);
  } catch {
    throw new Error('Invalid wger pagination URL');
  }

  if (parsed.protocol !== 'https:' || !WGER_ALLOWED_ORIGINS.has(parsed.origin)) {
    throw new Error(`Rejected wger pagination URL from untrusted origin: ${parsed.origin}`);
  }

  return parsed.toString();
}

function readPersistedCache() {
  const parsed = parseJson<PersistedExerciseLibraryCache>(CACHE_KEY);
  if (
    !parsed ||
    parsed.version !== CACHE_VERSION ||
    !Array.isArray(parsed.records) ||
    !validateNormalizedRecords(parsed.records, 1)
  ) {
    return null;
  }

  const storedAt = new Date(parsed.storedAt).getTime();
  const isFresh = !Number.isNaN(storedAt) && Date.now() - storedAt <= CACHE_TTL_MS;

  return {
    records: parsed.records,
    source: 'cache' as const,
    isStale: !isFresh,
    lastSyncedAt: parsed.lastSyncedAt,
  };
}

function persistLastKnownGood(
  records: ExerciseLibraryRecord[],
  source: ExerciseLibrarySource,
  lastSyncedAt: string | null
) {
  const payload: PersistedExerciseLibraryCache = {
    version: CACHE_VERSION,
    storedAt: new Date().toISOString(),
    source,
    lastSyncedAt,
    records,
  };

  writeJson(CACHE_KEY, payload);
}

async function fetchSnapshotPayload() {
  const response = await fetch(SNAPSHOT_ASSET_PATH, {
    cache: 'force-cache',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load exercise snapshot: HTTP ${response.status}`);
  }

  return (await response.json()) as ExerciseLibrarySnapshotPayload;
}

async function loadSnapshotRecords() {
  const snapshot = await fetchSnapshotPayload();
  const records = Array.isArray(snapshot.records) ? snapshot.records : [];
  const safeRecords = validateNormalizedRecords(records, 1) ? records : [];

  return {
    records: safeRecords,
    source: 'snapshot' as const,
    isStale: true,
    lastSyncedAt: snapshot.generatedAt ?? null,
  };
}

async function loadLegacyRecords() {
  return {
    records: await loadLegacyExerciseLibraryRecords(),
    source: 'legacy' as const,
    isStale: true,
    lastSyncedAt: null,
  };
}

export function resolveBootExerciseLibraryState() {
  const cached = readPersistedCache();
  if (cached) {
    return cached;
  }

  return {
    records: [],
    source: 'snapshot' as const,
    isStale: true,
    lastSyncedAt: null,
  };
}

function shouldAttemptSync(force = false) {
  if (force) return true;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  if (isInCooldown()) return false;

  if (currentState.source === 'live' && !currentState.isStale) {
    return false;
  }

  return true;
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as WgerExerciseInfoPage;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function fetchAllWgerExercises() {
  const results: WgerExerciseInfoRecord[] = [];
  let url = `${WGER_API_URL}?limit=${DEFAULT_PAGE_SIZE}`;
  let expectedCount: number | null = null;

  for (let pageIndex = 0; pageIndex < MAX_PAGE_COUNT && url; pageIndex += 1) {
    const page = await fetchWithTimeout(url);

    if (
      !isRecord(page) ||
      !Array.isArray(page.results) ||
      typeof page.count !== 'number'
    ) {
      throw new Error('Unexpected wger response shape');
    }

    if (expectedCount === null) {
      expectedCount = page.count;
    }

    results.push(...page.results);
    url = normalizeNextPageUrl(page.next, url);
  }

  if (url) {
    throw new Error('wger pagination did not complete before the page limit');
  }

  if (expectedCount !== null && results.length < expectedCount) {
    throw new Error('wger pagination completed with fewer records than expected');
  }

  return results;
}

function normalizeLivePayload(records: WgerExerciseInfoRecord[]) {
  const syncedAt = new Date().toISOString();
  return records.map((record) => normalizeWgerExercise(record, syncedAt));
}

export async function loadExerciseLibrary(): Promise<ExerciseLibraryState> {
  if (loadPromise) return loadPromise;

  loadPromise = Promise.resolve().then(async () => {
    const bootState = resolveBootExerciseLibraryState();

    setState({
      records: bootState.records,
      source: bootState.source,
      isStale: bootState.isStale,
      lastSyncedAt: bootState.lastSyncedAt,
      syncStatus: bootState.records.length > 0 ? 'ready' : 'loading',
      error: null,
    });

    let resolvedState: ExerciseLibraryState = currentState;

    if (bootState.records.length === 0) {
      try {
        const snapshotState = await loadSnapshotRecords();
        resolvedState = {
          records: snapshotState.records,
          source: snapshotState.source,
          isStale: snapshotState.isStale,
          lastSyncedAt: snapshotState.lastSyncedAt,
          syncStatus: 'ready',
          error: null,
        };
      } catch (snapshotError) {
        const legacyState = await loadLegacyRecords();
        resolvedState = {
          records: legacyState.records,
          source: legacyState.source,
          isStale: legacyState.isStale,
          lastSyncedAt: legacyState.lastSyncedAt,
          syncStatus: 'ready',
          error:
            snapshotError instanceof Error
              ? snapshotError.message
              : 'Failed to load snapshot asset',
        };
      }

      setState(resolvedState);

      if (resolvedState.records.length > 0) {
        persistLastKnownGood(
          resolvedState.records,
          resolvedState.source,
          resolvedState.lastSyncedAt
        );
      }
    }

    if (shouldAttemptSync()) {
      globalThis.setTimeout(() => {
        void syncExerciseLibrary().finally(() => {
          loadPromise = null;
        });
      }, 0);
    } else {
      loadPromise = null;
    }

    return resolvedState;
  });

  return loadPromise;
}

export async function syncExerciseLibrary(options?: { force?: boolean }) {
  if (syncPromise) return syncPromise;
  if (!shouldAttemptSync(options?.force)) {
    const status = isInCooldown() ? 'cooldown' : currentState.syncStatus;
    setState({
      ...currentState,
      syncStatus: status,
    });
    return null;
  }

  setState({
    ...currentState,
    syncStatus: currentState.records.length > 0 ? 'refreshing' : 'loading',
    error: null,
  });

  syncPromise = (async () => {
    try {
      const results = await fetchAllWgerExercises();
      const normalizedRecords = normalizeLivePayload(results);

      if (!validateNormalizedRecords(normalizedRecords, MINIMUM_RECORD_COUNT)) {
        throw new Error('Live exercise catalog did not pass validation');
      }

      const nextState: ExerciseLibraryState = {
        records: normalizedRecords,
        source: 'live',
        isStale: false,
        lastSyncedAt: normalizedRecords[0]?.lastSyncedAt ?? new Date().toISOString(),
        syncStatus: 'ready',
        error: null,
      };

      persistLastKnownGood(nextState.records, 'live', nextState.lastSyncedAt);
      resetFailureMeta();
      setState(nextState);
      return nextState;
    } catch (error) {
      recordSyncFailure();
      setState({
        ...currentState,
        syncStatus: isInCooldown() ? 'cooldown' : 'error',
        error: error instanceof Error ? error.message : 'Failed to sync exercise library',
      });
      return null;
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

export function getExerciseLibraryState() {
  return currentState;
}

export function subscribeToExerciseLibrary(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function resetExerciseLibraryServiceForTests() {
  currentState = EMPTY_STATE;
  loadPromise = null;
  syncPromise = null;
  listeners.clear();
  const storage = getStorage();
  storage?.removeItem(CACHE_KEY);
  storage?.removeItem(FAILURE_META_KEY);
}
