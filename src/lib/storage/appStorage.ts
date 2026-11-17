import { createJSONStorage, type PersistStorage, type StateStorage } from 'zustand/middleware';
import { isNativeApp } from '@/lib/platform';
import { devLog } from '@/lib/devLog';

/**
 * Device storage for user data (contract #2 in docs/project/CONTRACTS.md).
 *
 * - Web: IndexedDB through idb-keyval, in its own database (`fitwizard` / `kv`).
 * - Native (Capacitor): one JSON file per key in the app's private data
 *   directory, which survives app updates and is not evicted like WebView
 *   storage can be.
 * - Fallback: an in-memory map, for browsers where IndexedDB is unavailable
 *   (some private browsing modes). Data then lasts only for the session.
 *
 * Use with Zustand's persist middleware:
 *   storage: createJSONStorage(() => appStorage, { reviver: dateReviver })
 *
 * See ADR 11 (local-first user data) in docs/DECISIONS.md.
 */

interface StorageBackend {
  readonly kind: 'indexeddb' | 'filesystem' | 'memory';
  getItem(name: string): Promise<string | null>;
  setItem(name: string, value: string): Promise<void>;
  removeItem(name: string): Promise<void>;
}

const NATIVE_DIRECTORY_NAME = 'stores';
const PERSIST_REQUESTED_KEY = 'fitwizard-storage-persist-requested';

function createMemoryBackend(): StorageBackend {
  const entries = new Map<string, string>();
  return {
    kind: 'memory',
    async getItem(name) {
      return entries.has(name) ? (entries.get(name) as string) : null;
    },
    async setItem(name, value) {
      entries.set(name, value);
    },
    async removeItem(name) {
      entries.delete(name);
    },
  };
}

/** Keeps file names portable: anything outside [A-Za-z0-9._-] becomes "_". */
export function toStorageFileName(name: string): string {
  return `${name.replace(/[^A-Za-z0-9._-]/g, '_')}.json`;
}

async function createFilesystemBackend(): Promise<StorageBackend> {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const pathFor = (name: string) => `${NATIVE_DIRECTORY_NAME}/${toStorageFileName(name)}`;

  return {
    kind: 'filesystem',
    async getItem(name) {
      try {
        const result = await Filesystem.readFile({
          path: pathFor(name),
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        return typeof result.data === 'string' ? result.data : null;
      } catch {
        // A missing file means nothing has been saved under this name yet.
        return null;
      }
    },
    async setItem(name, value) {
      await Filesystem.writeFile({
        path: pathFor(name),
        data: value,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    },
    async removeItem(name) {
      try {
        await Filesystem.deleteFile({ path: pathFor(name), directory: Directory.Data });
      } catch {
        // Already gone.
      }
    },
  };
}

async function createIndexedDbBackend(): Promise<StorageBackend | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  try {
    const { createStore, get, set, del } = await import('idb-keyval');
    const store = createStore('fitwizard', 'kv');
    // Probe once: some private modes expose indexedDB but reject every request.
    await get('__fitwizard_probe__', store);

    return {
      kind: 'indexeddb',
      async getItem(name) {
        const value = await get<unknown>(name, store);
        return typeof value === 'string' ? value : null;
      },
      async setItem(name, value) {
        await set(name, value, store);
      },
      async removeItem(name) {
        await del(name, store);
      },
    };
  } catch {
    return null;
  }
}

let backendPromise: Promise<StorageBackend> | null = null;

async function resolveBackend(): Promise<StorageBackend> {
  if (isNativeApp()) {
    try {
      return await createFilesystemBackend();
    } catch (error) {
      console.error('[FitWizard] Native file storage unavailable; falling back to memory.', error);
      return createMemoryBackend();
    }
  }

  const indexedDbBackend = await createIndexedDbBackend();
  if (indexedDbBackend) {
    return indexedDbBackend;
  }

  devLog('[FitWizard] IndexedDB unavailable; user data will last only for this session.');
  return createMemoryBackend();
}

function getBackend(): Promise<StorageBackend> {
  if (!backendPromise) {
    backendPromise = resolveBackend();
  }
  return backendPromise;
}

/** Which backend is in use. For diagnostics and tests. */
export async function getStorageBackendKind(): Promise<StorageBackend['kind']> {
  return (await getBackend()).kind;
}

/** Async storage for Zustand persist. Never throws: failures are logged, reads return null. */
export const appStorage: StateStorage = {
  async getItem(name) {
    try {
      return await (await getBackend()).getItem(name);
    } catch (error) {
      console.error(`[FitWizard] Could not read "${name}" from device storage.`, error);
      return null;
    }
  },
  async setItem(name, value) {
    try {
      await (await getBackend()).setItem(name, value);
    } catch (error) {
      console.error(`[FitWizard] Could not save "${name}" to device storage.`, error);
    }
  },
  async removeItem(name) {
    try {
      await (await getBackend()).removeItem(name);
    } catch (error) {
      console.error(`[FitWizard] Could not remove "${name}" from device storage.`, error);
    }
  },
};

const DATE_KEYS = new Set(['startedAt', 'completedAt', 'achievedAt', 'createdAt', 'updatedAt', 'timestamp']);
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * JSON reviver that turns ISO timestamps back into Date objects for the known
 * date fields (startedAt, completedAt, achievedAt, createdAt, updatedAt, timestamp).
 * Anything else, including invalid dates, is returned unchanged.
 */
export function dateReviver(key: string, value: unknown): unknown {
  if (!DATE_KEYS.has(key) || typeof value !== 'string' || !ISO_DATE_TIME.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}

/**
 * Asks the browser not to evict this site's storage. Call once after the
 * first save. Returns whether storage is persistent. No-op (false) on native,
 * where app files are not evicted.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (isNativeApp() || typeof navigator === 'undefined' || !navigator.storage) {
    return false;
  }

  const storageManager = navigator.storage;
  let alreadyRequested = false;
  try {
    alreadyRequested = window.localStorage.getItem(PERSIST_REQUESTED_KEY) === 'true';
  } catch {
    // localStorage blocked; just ask again.
  }

  try {
    if (alreadyRequested) {
      return (await storageManager.persisted?.()) ?? false;
    }

    const granted = (await storageManager.persist?.()) ?? false;
    try {
      window.localStorage.setItem(PERSIST_REQUESTED_KEY, 'true');
    } catch {
      // Not critical.
    }
    return granted;
  } catch {
    return false;
  }
}

function readLegacyLocalStorage(name: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

function removeLegacyLocalStorage(name: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(name);
  } catch {
    // Nothing to clean up.
  }
}

/**
 * Writes to a durable backend and reports whether it worked. False when only
 * the in-memory fallback is available or the write failed.
 */
async function writeDurably(name: string, value: string): Promise<boolean> {
  try {
    const backend = await getBackend();
    if (backend.kind === 'memory') return false;
    await backend.setItem(name, value);
    return true;
  } catch (error) {
    console.error(`[FitWizard] Could not move "${name}" into device storage.`, error);
    return false;
  }
}

/**
 * appStorage plus a one-time move from localStorage: if a store has nothing
 * in device storage yet but an older version of the app saved it in
 * localStorage under the same name, that value is copied over. The
 * localStorage copy is removed only once the copy is confirmed saved in
 * durable storage, so a failed or memory-only write never loses it.
 */
export const migratingAppStorage: StateStorage = {
  async getItem(name) {
    const current = await appStorage.getItem(name);
    if (current !== null) return current;

    const legacy = readLegacyLocalStorage(name);
    if (legacy === null) return null;

    if (await writeDurably(name, legacy)) {
      removeLegacyLocalStorage(name);
    }
    return legacy;
  },
  setItem: (name, value) => appStorage.setItem(name, value),
  async removeItem(name) {
    // Synchronous part first, so callers that don't await (zustand's
    // clearStorage) can't have it land after a later write.
    removeLegacyLocalStorage(name);
    await appStorage.removeItem(name);
  },
};

/**
 * The storage every user-data store should pass to persist():
 * device storage, JSON with dates restored, and the one-time localStorage move.
 */
export function createUserDataStorage<S>(): PersistStorage<S> | undefined {
  return createJSONStorage<S>(() => migratingAppStorage, { reviver: dateReviver });
}

/** Test helper: forget the chosen backend so the next call picks again. */
export function resetAppStorageForTests(): void {
  backendPromise = null;
}
