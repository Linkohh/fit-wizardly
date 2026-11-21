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

## 5. Sync engine: `src/lib/sync/` (merged on Lane E Day 4; import from `@/lib/sync`)

```ts
export interface SyncRow { user_id: string; updated_at: string; deleted_at: string | null; [column: string]: unknown }

export interface SyncCollection<T> {
  table: string;                          // a table from contract 3
  keyColumn: string | null;               // 'id' or 'day'; null for one-row-per-user tables   (added Day 4)
  onConflict: string;                     // upsert key, for example 'user_id,id'               (added Day 4)
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
export function syncAll(userId: string, options?: { client?: SyncClient }): Promise<SyncResult>; // client: tests only
export function markDirty(table: string, key: string, options?: { deleted?: boolean }): void; // every store write; { deleted: true } for deletes
export function countPendingChanges(): number;
export function useSyncStatus(): SyncStatus;
```

Merge rules:
- Per record, the newer `updated_at` wins.
- A tombstone (`deleted_at` set) beats any edit older than itself.
- A local delete beats any remote edit older than itself; a remote edit made after the local delete brings the item back.
- Local items without `updatedAt` (older data) count as oldest, so the remote copy wins the first conflict.

Behaviour:
- **Pull** pages through rows with `updated_at >= cursor`, ordered, 500 at a time. The cursor is the newest server `updated_at` seen, saved per user in `fitwizard-sync-cursor`. A different account starts from scratch. The cursor only advances after a successful pull.
- **Push** upserts changed items in batches of 200. Deletes are sent as `UPDATE ... SET deleted_at`, never as hard deletes. For one-row-per-user tables (`keyColumn: null`) the update is filtered on `user_id` alone.
- The **outbox** (`fitwizard-sync-outbox`, saved on the device) survives restarts. Every save merges the saved copy first, so a change made after a restart but before the first sync keeps the older unsent changes. An entry is cleared only if it hasn't changed during the push.
- A collection that fails is counted in `failed`, and the rest still sync. Overlapping `syncAll` calls share one run.
- **Collections (Day 5):** `src/lib/sync/collections/` holds one collection per 007 table: `workout_logs`, `personal_records`, `nutrition_days`, `nutrition_settings` (one row), `body_measurements`, `readiness_entries`, `user_state` (one row: achievements and custom exercises).
  - `startSyncCollections()` registers them all and starts tracking.
  - Import from `@/lib/sync/collections`, not `@/lib/sync`, so the engine doesn't pull the stores into the startup bundle.
- **How changes are marked (Day 5):** a tracker watches each store, compares records before and after every change, and calls `markDirty` for the changed keys (or `{ deleted: true }` for removed ones).
  - It catches every store action, so actions don't call `markDirty` themselves.
  - Loading the saved copy at startup, and writing pulled records, are not counted as edits.
  - The outbox entry's time is the local edit time, so stored items have no `updatedAt` field (`getUpdatedAt` returns `''`). A record with no outbox entry has already synced, so the cloud copy wins.
- **Left out of sync:** exercise favourites, which already sync through `user_exercise_preferences`. Also any item whose day isn't a valid `YYYY-MM-DD`, because one bad value would fail a whole upload batch; it stays on the device.
- **Triggers (Day 6):** `startSync(userId)` in `src/lib/sync/triggers.ts`, started from `App.tsx` when a user is signed in and Supabase is configured. It loads lazily.
  - It syncs on sign-in, on the `online` event, on returning to the app (`visibilitychange` on web; `appStateChange` with `isActive` on native), and 2 s after the last `markDirty`.
  - Runs never overlap; triggers during a run collapse into one follow-up.
  - It doesn't run while `navigator.onLine` is false.
  - The **first sign-in on a device for an account** runs `syncAll(userId, { uploadLocalOnly: true })`. It pulls everything (ignoring the cursor), keeps the cloud copy for every record the cloud has (even over a pending local edit), and then uploads only device-only records. The account id is then recorded in `fitwizard-sync-first-upload`, which erase-on-device clears. If the upload partly fails, it isn't recorded, so it retries on the next start.
  - **Change tracking starts at app start**, signed in or not (`App.tsx`), so edits made while signed out are sent after the next sign-in.
  - `retrySync(userId)` is for the Profile Retry button.
- **Indicator (Day 6):** `src/components/sync/SyncStatusRow.tsx` on Profile shows Synced, Saving…, Offline, Sync problem (with Retry), or a sign-in prompt. It's hidden in demo mode (no Supabase).
- **Not yet built (Day 7):** sync before sign-out with an unsent-changes warning, and clearing device data after sign-out (DEBT-045). Plans move onto the engine.

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

> **Change on Lane C Day 4 (needs Lincoln's OK):** `'$pageview'` joins the union. `usePageViews()` (`src/lib/analytics/usePageViews.ts`, mounted in `App.tsx`) sends it on every route change, because PostHog's own pageview capture is off.

Behaviour (merged on Lane C Day 4):
- No-op, and nothing is loaded, unless `VITE_POSTHOG_KEY` is set **and** `hasAnalyticsConsent()` is true (`fitwizard_analytics_consent`, the same key crash reports use). PostHog (EU cloud) is loaded with a dynamic import on the first allowed event.
- Only these property keys are sent: `step`, `goal`, `days_per_week`, `exercise_count`, `duration_min`, `source`, `platform`. Values must be strings (cut to 64 characters), finite numbers or booleans. Everything else is dropped silently. `platform` (`web`, `ios`, `android`) is added to every event.
- Page URLs lose their query string and hash, and id-like path segments become `:id`.
- Safe to call from stores: `track.ts` imports nothing heavy.

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
