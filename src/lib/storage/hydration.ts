/**
 * Tracks which persisted stores have finished loading from device storage.
 *
 * Each persisted store registers itself when it is created and reports when
 * rehydration finishes:
 *
 *   persist(creator, {
 *     name: 'fitwizard-plans',
 *     storage: createJSONStorage(() => appStorage, { reviver: dateReviver }),
 *     ...hydrationTracking('fitwizard-plans'),
 *   })
 *
 * `useStoresHydrated()` (src/hooks/useStoresHydrated.ts) is
 * true once every registered store has hydrated, or after a safety timeout so
 * a broken store can never keep the app on the loading screen.
 */

export const HYDRATION_SAFETY_TIMEOUT_MS = 3000;

const hydrationState = new Map<string, boolean>();
const listeners = new Set<() => void>();
let safetyValveOpen = false;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let snapshot = computeSnapshot();

function computeSnapshot(): boolean {
  if (safetyValveOpen) return true;
  for (const hydrated of hydrationState.values()) {
    if (!hydrated) return false;
  }
  return true;
}

function emit(): void {
  const next = computeSnapshot();
  if (next === snapshot) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

function startSafetyValve(): void {
  if (safetyTimer || safetyValveOpen) return;
  safetyTimer = setTimeout(() => {
    safetyTimer = null;
    if (computeSnapshot()) return;
    const pending = [...hydrationState.entries()].filter(([, done]) => !done).map(([name]) => name);
    console.warn('[FitWizard] Stores still loading after the safety timeout:', pending.join(', '));
    safetyValveOpen = true;
    emit();
  }, HYDRATION_SAFETY_TIMEOUT_MS);
}

/** Registers a store that must hydrate before the app shows. Safe to call more than once. */
export function registerHydration(name: string): void {
  if (!hydrationState.has(name)) {
    hydrationState.set(name, false);
    emit();
  }
}

/** Marks a registered store as hydrated (also registers it if needed). */
export function markHydrated(name: string): void {
  hydrationState.set(name, true);
  emit();
}

/**
 * Spread into a persist() options object: registers the store and marks it
 * hydrated when rehydration finishes, whether it succeeded or failed.
 */
export function hydrationTracking(name: string) {
  registerHydration(name);
  return {
    onRehydrateStorage: () => (_state: unknown, error?: unknown) => {
      if (error) {
        console.error(`[FitWizard] Could not load "${name}" from device storage.`, error);
      }
      markHydrated(name);
    },
  };
}

export function subscribeToHydration(listener: () => void): () => void {
  listeners.add(listener);
  startSafetyValve();
  return () => {
    listeners.delete(listener);
  };
}

export function getHydrationSnapshot(): boolean {
  return snapshot;
}

/** Test helper: clear every registration and timer. */
export function resetHydrationForTests(): void {
  hydrationState.clear();
  safetyValveOpen = false;
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
  snapshot = computeSnapshot();
  for (const listener of listeners) listener();
}
