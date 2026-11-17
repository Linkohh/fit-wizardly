# Contracts between lanes

A contract is an interface one lane publishes and others build on. If you need a contract that hasn't merged yet, **code against the shape below with a local stub** and note this in your handoff. Changing a published contract requires a handoff note and Lincoln's OK before it merges.

| # | Contract | Provider | Ready | Consumers |
|---|---|---|---|---|
| 1 | Feature flags | Day 0 | **Merged with Day 0** | C, E, B |
| 2 | Device storage | E | Day 1 | E, H (Day 12) |
| 3 | Cloud tables (migration 007) | F | Day 1 | E (Day 4+) |
| 4 | Delete-account function | F | Day 3 | F (Day 4) |
| 5 | Sync engine | E | Day 4 | E, F |
| 6 | API base | H | Day 2 | Any code calling `/api` |
| 7 | Email-code sign-in | H | Day 3 | Auth UI |
| 8 | Monitoring | C | Day 3 | Everyone (optional) |
| 9 | Analytics | C | Day 4 | B, E, F, H |
| 10 | Native helpers | H | Days 5–6 | E, B |

---

## 1. Feature flags: `src/lib/featureFlags.ts` (exists)

```ts
export type FeatureFlag = 'circles' | 'coach';
export function isFeatureEnabled(flag: FeatureFlag): boolean;
// Reads VITE_FEATURE_CIRCLES / VITE_FEATURE_COACH; on only for the string "true".
```

- Never read the environment variables directly; always call this function.
- In tests, use `vi.stubEnv('VITE_FEATURE_CIRCLES', 'true')` or `vi.mock('@/lib/featureFlags', ...)`.

## 2. Device storage: `src/lib/storage/appStorage.ts`

```ts
import type { StateStorage } from 'zustand/middleware';

/** Async storage. IndexedDB (idb-keyval) on web, @capacitor/filesystem (Directory.Data) on native. */
export const appStorage: StateStorage;

/** Use with persist(): storage: createJSONStorage(() => appStorage, { reviver: dateReviver }) */
export function dateReviver(key: string, value: unknown): unknown;

/** Asks the browser not to evict storage. Call once after the first save; no-op on native. */
export function requestPersistentStorage(): Promise<boolean>;
```

`src/lib/storage/clearLocalUserData.ts` (Lane E, Day 3; **merged with Day 3**). It covers plans, nutrition, measurements, readiness, achievements, custom exercises and exercise preferences (`fitwizard-preferences`). `USER_DATA_STORE_NAMES` lists them.

```ts
// src/lib/storage/hydration.ts (Day 3)
/** Resolves once a persisted store has loaded. Await it before changing a store that was just loaded on demand. */
export function waitForHydration(store: { persist: { hasHydrated(): boolean; onFinishHydration(fn: () => void): () => void } }, name: string, timeoutMs?: number): Promise<void>;
// Settles on success OR failure (via hydrationTracking), with a safety timeout. `name` = the store's persist name.
```

`dateReviver` also restores `timestamp` (meal entries) since Day 3.

Original specification:

```ts
/** Erases every persisted user-data store from the device and resets those stores in memory.
 *  Used by account sign-out (after sync), account deletion and "Erase data on this device". */
export async function clearLocalUserData(): Promise<void>;
```

Hydration (merged on Lane E Day 1):

```ts
// src/hooks/useStoresHydrated.ts
export function useStoresHydrated(): boolean;   // true once every registered store has rehydrated, or after a 3 s safety timeout

// src/components/HydrationGate.tsx
export function HydrationGate(props: { children: React.ReactNode }): JSX.Element; // shows LoadingScreen until hydrated; gates the first render only

// src/lib/storage/hydration.ts — how a persisted store takes part
export function hydrationTracking(name: string): { onRehydrateStorage: () => (state: unknown, error?: unknown) => void };
// Usage: persist(creator, { name, storage: createJSONStorage(() => appStorage, { reviver: dateReviver }), ...hydrationTracking(name) })
```

Storage helper (added on Lane E Day 2):

```ts
// src/lib/storage/appStorage.ts
/** The storage every user-data store passes to persist(): device storage, dates restored,
 *  and a one-time move of any old localStorage value with the same name. */
export function createUserDataStorage<S>(): PersistStorage<S> | undefined;
```

> **Change on Lane E Day 1:** the hook moved from `HydrationGate.tsx` to `src/hooks/useStoresHydrated.ts`. Exporting a hook from a component file breaks React fast refresh, which the lint rule `react-refresh/only-export-components` flags. Nothing used the old location.

- `dateReviver` turns ISO strings back into `Date` objects for the keys `startedAt`, `completedAt`, `achievedAt`, `createdAt` and `updatedAt`.
- Persisted store keys keep the existing `fitwizard-*` names.

## 3. Cloud tables: `supabase/migrations/007_user_data.sql`

Every table follows the same rules:
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`.
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, maintained by the existing `set_updated_at()` trigger.
- `deleted_at TIMESTAMPTZ NULL`, used as a tombstone. Rows are never hard-deleted by clients.
- Row-level security on, with four owner-only policies (`auth.uid() = user_id`), each written as `DROP POLICY IF EXISTS` followed by `CREATE POLICY`.

| Table | Primary key | Other columns |
|---|---|---|
| `workout_logs` | `(user_id, id TEXT)` | `plan_id TEXT NOT NULL`, `completed_at TIMESTAMPTZ NOT NULL`, `total_volume NUMERIC NOT NULL DEFAULT 0`, `log JSONB NOT NULL`, `schema_version INT NOT NULL DEFAULT 1` |
| `personal_records` | `(user_id, id TEXT)` | `exercise_id TEXT NOT NULL`, `type TEXT NOT NULL CHECK (type IN ('weight','reps','volume'))`, `value NUMERIC NOT NULL`, `achieved_at TIMESTAMPTZ NOT NULL`, `record JSONB NOT NULL` |
| `nutrition_days` | `(user_id, day DATE)` | `log JSONB NOT NULL` (a `DailyNutritionLog`) |
| `nutrition_settings` | `(user_id)` | `profile JSONB`, `targets JSONB`, `custom_foods JSONB NOT NULL DEFAULT '[]'`, `favorites JSONB NOT NULL DEFAULT '[]'`, `saved_meals JSONB NOT NULL DEFAULT '[]'` |
| `body_measurements` | `(user_id, id TEXT)` | `measured_on DATE NOT NULL`, `data JSONB NOT NULL` (a `BodyMeasurement`) |
| `readiness_entries` | `(user_id, day DATE)` | `entry JSONB NOT NULL` (a `ReadinessEntry`) |
| `user_state` | `(user_id)` | `achievements JSONB NOT NULL DEFAULT '{}'`, `custom_exercises JSONB NOT NULL DEFAULT '[]'`, `favorite_exercises JSONB NOT NULL DEFAULT '[]'` |

- Also in 007:
- `ALTER TABLE plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;` so plans can use the same tombstone rule (Lane E, Day 7).

Indexes: `workout_logs (user_id, completed_at DESC)`, `personal_records (user_id, exercise_id)`, and `(user_id, updated_at)` on every table for incremental pulls.
- Types: hand-extend `src/types/supabase.ts` with the same style as the existing `plans` entry.
- The TypeScript sources of the JSON blobs live in `src/types/fitness.ts` (`WorkoutLog`, `PersonalRecord`, `BodyMeasurement`), `src/types/nutrition.ts` and `src/types/readiness.ts`.

## 4. Delete account: `supabase/functions/delete-account/index.ts`

```
POST {VITE_SUPABASE_URL}/functions/v1/delete-account
Authorization: Bearer <the signed-in user's access token>
apikey: <VITE_SUPABASE_ANON_KEY>
Body: none

204  account and all rows deleted (cascade from auth.users)
401  { "error": "Not authenticated" }
500  { "error": "Deletion failed" }      (never echo internal details)
```

Client wrapper (Lane F, `src/lib/account/deleteAccount.ts`):

```ts
export async function deleteAccount(): Promise<{ error: Error | null }>;
```

## 5. Sync engine: `src/lib/sync/`

```ts
export interface SyncRow { user_id: string; updated_at: string; deleted_at: string | null; [column: string]: unknown }

export interface SyncCollection<T> {
  table: string;                          // a table from contract 3
  key(item: T): string;                   // stable local id (or the YYYY-MM-DD day)
  toRow(item: T, userId: string): Omit<SyncRow, 'updated_at'>;
  fromRow(row: SyncRow): T;
  readLocal(): T[];                       // from the Zustand store
  writeLocal(items: T[]): void;           // replaces the store's items
  getUpdatedAt(item: T): string;          // ISO timestamp of the last local edit
}

export interface SyncResult { pulled: number; pushed: number; failed: number }
export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error' | 'signed-out';

export function registerCollection<T>(collection: SyncCollection<T>): void;
export function syncAll(userId: string): Promise<SyncResult>;
export function markDirty(table: string, key: string): void;   // called by stores after a local write
export function useSyncStatus(): SyncStatus;
```

Merge rules:
- Per record, the newer `updated_at` wins.
- A tombstone (`deleted_at` set) beats any edit older than itself.

## 6. API base: `src/lib/apiBase.ts`

```ts
/** On web returns the path unchanged; on native prefixes VITE_PUBLIC_APP_ORIGIN (for example https://fitwizard.app). */
export function apiUrl(path: `/api/${string}`): string;
```

## 7. Email-code sign-in: `src/stores/authStore.ts`

```ts
signInWithEmail(email: string): Promise<{ error: Error | null }>;               // unchanged: sends the email (link + 6-digit code)
verifyEmailCode(email: string, code: string): Promise<{ error: Error | null }>; // supabase.auth.verifyOtp({ email, token, type: 'email' })
```

## 8. Monitoring: `src/lib/monitoring.ts`

```ts
export function initMonitoring(): void;   // no-op unless VITE_SENTRY_DSN is set AND the user consented
export function captureError(error: unknown, context?: Record<string, string>): void; // always safe to call
```

## 9. Analytics: `src/lib/analytics/track.ts`

```ts
export type AnalyticsEvent =
  | 'onboarding_completed' | 'wizard_step_completed' | 'plan_generated'
  | 'workout_started' | 'workout_completed' | 'meal_logged'
  | 'signed_in' | 'account_deleted';

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void;
// No-op without analytics consent. Never pass health values (weights, body measurements, readiness, food).
```

## 10. Native helpers: `src/hooks/`

Every helper is a no-op on the web, using a dynamic `import()` like `useHaptics.ts`.

```ts
useShare(): { share(data: { title: string; text?: string; url?: string; files?: File[] }): Promise<boolean> };
useLocalNotifications(): {
  requestPermission(): Promise<boolean>;
  scheduleRestEnd(at: Date, body: string): Promise<void>;
  cancelRestEnd(): Promise<void>;
  scheduleWorkoutReminders(days: number[], hour: number, minute: number): Promise<void>;
  cancelWorkoutReminders(): Promise<void>;
};
useStatusBarTheme(): void;   // keeps the status bar style in step with themeStore
```
