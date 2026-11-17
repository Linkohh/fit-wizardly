import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';

type AppStorageModule = typeof import('./appStorage');

async function loadAppStorage({ native }: { native: boolean }): Promise<AppStorageModule> {
  vi.resetModules();
  vi.doMock('@/lib/platform', () => ({ isNativeApp: () => native }));
  return import('./appStorage');
}

describe('appStorage on the web (IndexedDB)', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/platform');
  });

  it('saves, reads and removes values', async () => {
    const { appStorage, getStorageBackendKind } = await loadAppStorage({ native: false });

    expect(await getStorageBackendKind()).toBe('indexeddb');
    expect(await appStorage.getItem('fitwizard-test-roundtrip')).toBeNull();

    await appStorage.setItem('fitwizard-test-roundtrip', '{"state":{"count":2},"version":1}');
    expect(await appStorage.getItem('fitwizard-test-roundtrip')).toBe('{"state":{"count":2},"version":1}');

    await appStorage.removeItem('fitwizard-test-roundtrip');
    expect(await appStorage.getItem('fitwizard-test-roundtrip')).toBeNull();
  });

  it('keeps data when the module is loaded again (simulates an app restart)', async () => {
    const first = await loadAppStorage({ native: false });
    await first.appStorage.setItem('fitwizard-test-restart', 'saved before restart');

    const second = await loadAppStorage({ native: false });
    expect(await second.appStorage.getItem('fitwizard-test-restart')).toBe('saved before restart');
    await second.appStorage.removeItem('fitwizard-test-restart');
  });

  it('does not touch localStorage', async () => {
    const { appStorage } = await loadAppStorage({ native: false });
    window.localStorage.clear();

    await appStorage.setItem('fitwizard-test-isolation', 'value');

    expect(window.localStorage.getItem('fitwizard-test-isolation')).toBeNull();
    await appStorage.removeItem('fitwizard-test-isolation');
  });
});

describe('appStorage fallback', () => {
  const originalIndexedDb = globalThis.indexedDB;

  afterEach(() => {
    Object.defineProperty(globalThis, 'indexedDB', { value: originalIndexedDb, configurable: true, writable: true });
    vi.doUnmock('@/lib/platform');
  });

  it('uses memory when IndexedDB is unavailable', async () => {
    Object.defineProperty(globalThis, 'indexedDB', { value: undefined, configurable: true, writable: true });
    const { appStorage, getStorageBackendKind } = await loadAppStorage({ native: false });

    expect(await getStorageBackendKind()).toBe('memory');
    await appStorage.setItem('fitwizard-test-memory', 'kept in memory');
    expect(await appStorage.getItem('fitwizard-test-memory')).toBe('kept in memory');
  });
});

describe('appStorage on native (Capacitor Filesystem)', () => {
  const files = new Map<string, string>();
  const readFile = vi.fn(async ({ path }: { path: string }) => {
    if (!files.has(path)) throw new Error('File does not exist');
    return { data: files.get(path) as string };
  });
  const writeFile = vi.fn(async ({ path, data }: { path: string; data: string }) => {
    files.set(path, data);
    return { uri: path };
  });
  const deleteFile = vi.fn(async ({ path }: { path: string }) => {
    if (!files.has(path)) throw new Error('File does not exist');
    files.delete(path);
  });

  beforeEach(() => {
    files.clear();
    vi.clearAllMocks();
    vi.doMock('@capacitor/filesystem', () => ({
      Filesystem: { readFile, writeFile, deleteFile },
      Directory: { Data: 'DATA' },
      Encoding: { UTF8: 'utf8' },
    }));
  });

  afterEach(() => {
    vi.doUnmock('@capacitor/filesystem');
    vi.doUnmock('@/lib/platform');
  });

  it('writes one JSON file per key in the app data directory', async () => {
    const { appStorage, getStorageBackendKind } = await loadAppStorage({ native: true });

    expect(await getStorageBackendKind()).toBe('filesystem');
    await appStorage.setItem('fitwizard-plans', '{"state":{}}');

    expect(writeFile).toHaveBeenCalledWith({
      path: 'stores/fitwizard-plans.json',
      data: '{"state":{}}',
      directory: 'DATA',
      encoding: 'utf8',
      recursive: true,
    });
    expect(await appStorage.getItem('fitwizard-plans')).toBe('{"state":{}}');
  });

  it('returns null for a key that was never saved', async () => {
    const { appStorage } = await loadAppStorage({ native: true });
    expect(await appStorage.getItem('fitwizard-missing')).toBeNull();
  });

  it('removes files and ignores removing a missing one', async () => {
    const { appStorage } = await loadAppStorage({ native: true });
    await appStorage.setItem('fitwizard-nutrition', 'x');

    await appStorage.removeItem('fitwizard-nutrition');
    await expect(appStorage.removeItem('fitwizard-nutrition')).resolves.toBeUndefined();
    expect(await appStorage.getItem('fitwizard-nutrition')).toBeNull();
  });

  it('turns unsafe characters in keys into safe file names', async () => {
    const { toStorageFileName } = await loadAppStorage({ native: true });
    expect(toStorageFileName('fitwizard-plans')).toBe('fitwizard-plans.json');
    expect(toStorageFileName('../odd key/name')).toBe('.._odd_key_name.json');
  });

  it('never throws when the native write fails', async () => {
    writeFile.mockRejectedValueOnce(new Error('disk full'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { appStorage } = await loadAppStorage({ native: true });

    await expect(appStorage.setItem('fitwizard-plans', 'x')).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('dateReviver', () => {
  it('restores Date objects for the known date fields', async () => {
    const { dateReviver } = await loadAppStorage({ native: false });
    const json = JSON.stringify({
      startedAt: new Date('2026-11-17T10:00:00.000Z'),
      completedAt: new Date('2026-11-17T11:00:00.000Z'),
      nested: { achievedAt: new Date('2026-11-16T08:30:00.000Z') },
    });

    const parsed = JSON.parse(json, dateReviver) as {
      startedAt: Date;
      completedAt: Date;
      nested: { achievedAt: Date };
    };

    expect(parsed.startedAt).toBeInstanceOf(Date);
    expect(parsed.startedAt.toISOString()).toBe('2026-11-17T10:00:00.000Z');
    expect(parsed.completedAt).toBeInstanceOf(Date);
    expect(parsed.nested.achievedAt).toBeInstanceOf(Date);
  });

  it('leaves other fields and non-date strings alone', async () => {
    const { dateReviver } = await loadAppStorage({ native: false });
    const parsed = JSON.parse(
      '{"date":"2026-11-17T10:00:00.000Z","startedAt":"not a date","createdAt":"2026-11-17","name":"Push day"}',
      dateReviver,
    ) as Record<string, unknown>;

    expect(parsed.date).toBe('2026-11-17T10:00:00.000Z');
    expect(parsed.startedAt).toBe('not a date');
    expect(parsed.createdAt).toBe('2026-11-17');
    expect(parsed.name).toBe('Push day');
  });

  it('works with zustand createJSONStorage', async () => {
    const { appStorage, dateReviver } = await loadAppStorage({ native: false });
    const storage = createJSONStorage<{ log: { completedAt: Date } }>(() => appStorage, { reviver: dateReviver });

    await storage?.setItem('fitwizard-test-json', { state: { log: { completedAt: new Date('2026-11-17T12:00:00.000Z') } }, version: 1 });
    const restored = await storage?.getItem('fitwizard-test-json');

    expect(restored?.state.log.completedAt).toBeInstanceOf(Date);
    await storage?.removeItem('fitwizard-test-json');
  });
});

describe('requestPersistentStorage', () => {
  const originalStorage = navigator.storage;

  afterEach(() => {
    Object.defineProperty(navigator, 'storage', { value: originalStorage, configurable: true });
    window.localStorage.removeItem('fitwizard-storage-persist-requested');
    vi.doUnmock('@/lib/platform');
  });

  it('asks the browser once, then only checks the current state', async () => {
    const persist = vi.fn(async () => true);
    const persisted = vi.fn(async () => true);
    Object.defineProperty(navigator, 'storage', { value: { persist, persisted }, configurable: true });
    const { requestPersistentStorage } = await loadAppStorage({ native: false });

    expect(await requestPersistentStorage()).toBe(true);
    expect(await requestPersistentStorage()).toBe(true);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persisted).toHaveBeenCalledTimes(1);
  });

  it('does nothing on native', async () => {
    const persist = vi.fn(async () => true);
    Object.defineProperty(navigator, 'storage', { value: { persist }, configurable: true });
    const { requestPersistentStorage } = await loadAppStorage({ native: true });

    expect(await requestPersistentStorage()).toBe(false);
    expect(persist).not.toHaveBeenCalled();
  });

  it('returns false when the browser has no storage manager', async () => {
    Object.defineProperty(navigator, 'storage', { value: undefined, configurable: true });
    const { requestPersistentStorage } = await loadAppStorage({ native: false });

    expect(await requestPersistentStorage()).toBe(false);
  });
});

describe('migratingAppStorage (one-time move from localStorage)', () => {
  const originalIndexedDb = globalThis.indexedDB;
  const legacyValue = JSON.stringify({ state: { currentWeek: 3 }, version: 0 });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'indexedDB', { value: originalIndexedDb, configurable: true, writable: true });
    vi.doUnmock('@/lib/platform');
    vi.doUnmock('@capacitor/filesystem');
    window.localStorage.clear();
  });

  it('moves the value and removes the localStorage copy once it is saved', async () => {
    const { migratingAppStorage, appStorage } = await loadAppStorage({ native: false });
    await appStorage.removeItem('fitwizard-test-move');
    window.localStorage.setItem('fitwizard-test-move', legacyValue);

    expect(await migratingAppStorage.getItem('fitwizard-test-move')).toBe(legacyValue);

    expect(await appStorage.getItem('fitwizard-test-move')).toBe(legacyValue);
    expect(window.localStorage.getItem('fitwizard-test-move')).toBeNull();
    await appStorage.removeItem('fitwizard-test-move');
  });

  it('keeps the localStorage copy when only memory storage is available', async () => {
    Object.defineProperty(globalThis, 'indexedDB', { value: undefined, configurable: true, writable: true });
    const { migratingAppStorage } = await loadAppStorage({ native: false });
    window.localStorage.setItem('fitwizard-test-move', legacyValue);

    expect(await migratingAppStorage.getItem('fitwizard-test-move')).toBe(legacyValue);

    expect(window.localStorage.getItem('fitwizard-test-move')).toBe(legacyValue);
  });

  it('keeps the localStorage copy when the durable write fails', async () => {
    vi.doMock('@capacitor/filesystem', () => ({
      Filesystem: {
        readFile: vi.fn(async () => { throw new Error('File does not exist'); }),
        writeFile: vi.fn(async () => { throw new Error('disk full'); }),
        deleteFile: vi.fn(async () => undefined),
      },
      Directory: { Data: 'DATA' },
      Encoding: { UTF8: 'utf8' },
    }));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { migratingAppStorage } = await loadAppStorage({ native: true });
    window.localStorage.setItem('fitwizard-test-move', legacyValue);

    expect(await migratingAppStorage.getItem('fitwizard-test-move')).toBe(legacyValue);

    expect(window.localStorage.getItem('fitwizard-test-move')).toBe(legacyValue);
    consoleError.mockRestore();
  });
});
