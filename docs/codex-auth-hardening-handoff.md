# Codex Handoff: Demo-First Auth Correction and Hardening

Date: 2026-03-18

## Why This Work Was Done

This change set was driven by a mismatch between the intended product behavior and the actual runtime behavior around auth.

The app was described and routed as if several pages were protected, but the actual guard implementation made most of those routes guest-accessible because `RequireAuth` only enforced auth when a `strict` prop was passed. Most route usages did not pass `strict`, so the code and the comments were out of sync.

The chosen product direction for this phase was:

- Keep the app demo-first during pre-beta.
- Allow guest/local usage for local-state or prototype flows.
- Require real auth only for account-backed features like circle membership and trainer pages.
- Keep missing Supabase configuration as a supported demo mode, not a boot-time failure.

## Original Findings

### 1. Route protection did not match the route comments

What I found:

- `src/components/RequireAuth.tsx` allowed access when `strict` was not set.
- In `src/App.tsx`, routes such as `/plan`, `/history`, `/profile`, `/nutrition`, `/analytics`, `/exercises`, `/clients`, `/templates`, and `/revenue` were wrapped in `<RequireAuth>` without `strict`.
- This meant those pages were effectively guest-accessible despite the route comments implying protection.

Why this mattered:

- The code gave a false sense of security.
- It was hard to reason about which pages were truly account-backed.
- The implementation did not reflect the selected prototype policy.

### 2. Missing-Supabase behavior was too permissive for auth-backed pages

What I found:

- `src/lib/supabase.ts` intentionally allows the app to boot in demo mode when Supabase env vars are missing.
- `RequireAuth` previously returned children when auth was not configured, even on pages that should be account-backed.
- This created a silent failure mode where account-bound pages could render but later fail deeper in the stack.

Why this mattered:

- Demo mode was useful, but it needed explicit boundaries.
- Auth-required surfaces should fail clearly, not partially.

### 3. Auth modal behavior was too circles-specific and not globally wired

What I found:

- The auth modal copy in `src/components/auth/AuthModal.tsx` was specific to circles.
- `AuthModal` was rendered inside `src/pages/Circles.tsx` instead of once at app level.
- `RequireAuth` relied on opening that modal, which only worked cleanly when the user happened to be on a page that rendered it.

Why this mattered:

- Auth prompts should not depend on a page-specific implementation detail.
- The modal wording needed to fit both circles and trainer/auth-backed access.

### 4. Auth subscription cleanup was missing

What I found:

- `src/stores/authStore.ts` registered `supabase.auth.onAuthStateChange(...)` inside `initialize()`.
- It did not keep or unsubscribe the previous subscription.

Why this mattered:

- Repeated initialization, remounts, or HMR could stack listeners.
- This risked duplicate reactions to auth events in development and potentially in edge lifecycle cases.

### 5. Coverage gaps were concentrated in the risky parts

What I found:

- There was no route-level auth coverage for the current route matrix.
- The auth store cleanup behavior was not tested.
- The remote plan client’s provider selection and bearer header attachment were not directly covered.
- The server plan auth/validation path was effectively untested.

Why this mattered:

- The highest-risk behavior changes were not protected by tests.

## What I Implemented

## A. Route policy was made explicit in `src/App.tsx`

I changed the route table so it matches the agreed demo-first policy.

### Demo/public routes now intentionally stay guest-accessible

These routes are now rendered directly, without `RequireAuth`:

- `/`
- `/wizard`
- `/plan`
- `/workout/:planId/:dayIndex`
- `/nutrition`
- `/history`
- `/analytics`
- `/profile`
- `/exercises`
- `/circles`
- `/circles/join/:inviteCode`
- `/mcl`
- `/legal`
- `/guide`

### Auth-backed routes now explicitly require auth

These routes still use `RequireAuth`:

- `/circles/:circleId/*`
- `/clients`
- `/clients/:clientId`
- `/templates`
- `/revenue`

### Trainer pages remain “auth first, trainer mode second”

I kept `TrainerGuard` as a second gate inside auth, rather than changing it to RBAC or server-backed roles. This matches the existing pre-beta assumption that trainer mode is still client-side.

## B. `RequireAuth` was simplified to always enforce auth

File: `src/components/RequireAuth.tsx`

What changed:

- Removed the `strict` prop entirely.
- `RequireAuth` now has one behavior only:
  - show a loading state while auth is initializing
  - show an unavailable state if auth is not configured
  - otherwise redirect unauthenticated users to `/` and open the auth modal
  - otherwise render children

Additional behavior:

- When redirecting, it stores the full requested URL into `redirectUrl` so auth flows can return the user to the intended destination.

Why this is safer:

- The guard no longer has two contradictory meanings.
- Routes are now protected or public based on route wiring, not based on a hidden prop default.

## C. Added a clear unavailable state for auth-backed features in demo mode

File added: `src/components/auth/AuthUnavailableState.tsx`

What changed:

- Added a reusable UI state for account-backed features that cannot work without Supabase auth/backend configuration.
- `RequireAuth` uses it when `isConfigured` is false.
- `JoinCircleHandler` also uses a customized version of it for invite links.

Why this is better:

- Missing backend setup is now visible and intentional.
- Guest/demo pages still work, but account-backed routes fail clearly instead of partially.

## D. Auth modal was made generic and moved to app level

Files:

- `src/components/auth/AuthModal.tsx`
- `src/App.tsx`
- `src/pages/Circles.tsx`

What changed:

- The modal copy was changed from “Join Accountability Circles” to a more general “Sign In to Continue”.
- The description now refers to account-backed features like circles and trainer tools, not just circles.
- The unavailable state inside the modal now explains that sign-in and membership require backend setup and that the app is still in demo mode.
- `AuthModal` is now rendered once at app level in `src/App.tsx`.
- `src/pages/Circles.tsx` no longer renders its own duplicate modal.

Why this is better:

- Auth prompting is no longer page-local.
- Any auth-backed route can safely trigger the same modal behavior.

## E. Circles page and invite join flow were aligned with demo mode

Files:

- `src/pages/Circles.tsx`
- `src/components/circles/JoinCircleHandler.tsx`

What changed on the circles landing page:

- The circles landing page remains guest-accessible.
- Its CTA now reflects whether auth is configured:
  - “Sign In to Get Started” when configured
  - “Account Setup Required” when not configured

What changed in invite join:

- `/circles/join/:inviteCode` remains public.
- If auth is not configured, the page now renders an explicit unavailable state instead of attempting a broken flow.
- If auth is configured but the user is not signed in:
  - it stores the pending invite code in session storage
  - stores the redirect URL in auth state
  - opens the auth modal
- If signed in, it continues the join flow as before.

Why this is better:

- The public invite link remains usable as an entry point.
- The account-backed join action is no longer ambiguous in demo mode.

## F. Auth store now cleans up previous auth listeners

File: `src/stores/authStore.ts`

What changed:

- Added a module-level `authSubscription` reference.
- `initialize()` now unsubscribes the previous listener before registering a new one.
- `initialize()` also resets user/session/profile cleanly when Supabase is not configured.
- It explicitly sets `isConfigured` and `isLoading` states more deterministically at initialization time.

Why this is better:

- Prevents duplicate auth listeners from accumulating across repeated initialization.
- Makes demo-mode and configured-mode state transitions clearer.

## G. Remote plan path hardening and focused tests

Files:

- `src/lib/apiClient.ts`
- `src/lib/plans/plansClient.ts`
- `src/lib/apiClient.test.ts`
- `src/lib/plans/plansClient.test.ts`

What changed:

- Kept runtime behavior the same.
- Switched imports to alias-style paths for consistency.
- Added focused tests for:
  - bearer token attachment in the API client
  - provider selection in `plansClient`
  - “auto” mode preferring Supabase when configured
  - “auto” mode falling back to API when Supabase is unavailable

Why this is useful:

- These were key parts of the auth-backed persistence path and previously had no direct coverage.

## H. Added route/auth tests around the new behavior

File added: `src/App.auth-routing.test.tsx`

What this test file covers:

- guest access to demo routes like `/plan`
- guest redirect + auth modal open for auth-backed circle member routes
- guest redirect + auth modal open for trainer routes
- successful trainer-route access when both auth and trainer mode are present
- unavailable state for auth-backed routes when Supabase is not configured

Why this matters:

- The route policy is now encoded in tests rather than only in assumptions.

## I. Added auth store tests for listener cleanup and no-config mode

File added: `src/stores/authStore.test.ts`

What this test file covers:

- `initialize()` marking auth as unavailable when Supabase is not configured
- `initialize()` unsubscribing the previous auth listener before adding a new one

## J. Refactored the Express server for testability and added server tests

Files:

- `server/src/index.ts`
- `server/package.json`
- `server/test/index.test.ts`

What changed in the server:

- Reworked `server/src/index.ts` into a more testable structure:
  - `createApp(...)`
  - `createRouteHandlers(...)`
  - `startServer(...)`
- Added injected dependencies for:
  - auth token verification
  - plan repo functions
  - logging
- Preserved runtime behavior: `startServer()` still boots the app when the file is directly executed.

Why I refactored this:

- The previous single-file app mixed bootstrapping and handler logic in a way that made isolated testing difficult.
- The new structure allows route logic to be verified without binding a real port.

What server tests were added:

- rejects missing bearer token
- rejects invalid token
- rejects cross-user plan write attempts before reaching the repo layer
- accepts a valid plan create flow

Important note:

- The first server test approach used a real `listen()` call, but the sandbox here blocks binding a local port.
- I changed the tests to call the exported route handlers directly in-process.
- This still verifies the important handler behavior without requiring network privileges.

## Verification Performed

### Frontend tests run

Command:

```bash
npm run test:run -- src/App.auth-routing.test.tsx src/stores/authStore.test.ts src/lib/apiClient.test.ts src/lib/plans/plansClient.test.ts
```

Result:

- Passed: 4 files
- Passed: 10 tests

### Server tests run

Command:

```bash
cd server && npm test
```

Result:

- Passed: 4 tests

### Lint checks run on changed files

Commands:

```bash
npx eslint src/App.tsx src/components/RequireAuth.tsx src/components/auth/AuthModal.tsx src/components/auth/AuthUnavailableState.tsx src/pages/Circles.tsx src/components/circles/JoinCircleHandler.tsx src/App.auth-routing.test.tsx src/stores/authStore.test.ts src/lib/apiClient.test.ts src/lib/plans/plansClient.test.ts src/stores/authStore.ts src/lib/apiClient.ts src/lib/plans/plansClient.ts
```

```bash
cd server && npx eslint src/index.ts test/index.test.ts
```

Result:

- Passed

### TypeScript checks

Server:

```bash
cd server && npx tsc --noEmit -p tsconfig.json
```

Result:

- Passed

Frontend:

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Result:

- Failed due to pre-existing unrelated issues outside this change set

Files with existing unrelated TS errors included:

- `src/components/exercises/ExercisesBrowser.tsx`
- `src/components/logging/RestTimer.tsx`
- `src/features/exercise-library/media.ts`
- `src/hooks/use-hero-tilt.test.ts`
- `src/hooks/useUserPreferences.ts`
- `src/pages/Nutrition.tsx`

I did not fix those because they were not part of this auth hardening change.

## What I Did Not Change

These items were intentionally left out of scope:

- No `planStore` decomposition/refactor
- No local-vs-remote plan conflict resolution changes
- No backend-enforced trainer roles or RBAC
- No change to the demo-first availability of plan/history/profile/nutrition/analytics/exercises
- No broad cleanup of unrelated TypeScript errors

## Post-Codex Audit Results (2026-03-18)

All review items below were verified and resolved in PR #23.

### 1. Route policy correctness — VERIFIED

Route split matches the handoff spec exactly. `/workout/:planId/:dayIndex` confirmed guest-accessible per demo-first policy — the workout logger reads from local plan state so no account is needed.

### 2. Redirect and auth modal behavior — VERIFIED

- `RequireAuth` uses a `useEffect` to open the modal only after the redirect has already rendered (`<Navigate to="/" />`), so there is no loop: `/` has no `RequireAuth` wrapper.
- `redirectUrl` stores `window.location.origin + requestedPath` which is the correct full URL for Supabase magic-link `emailRedirectTo`.

### 3. Demo-mode boundaries — FIXED

`AuthUnavailableState` previously had a hardcoded "View Circles" secondary button that appeared on all auth-unavailable surfaces, including trainer routes (`/clients`, `/templates`, `/revenue`). Fixed by adding an optional `secondaryLink` prop (defaults to no secondary button). `JoinCircleHandler` now explicitly passes the circles link.

### 4. Circles mutation boundaries — VERIFIED

`CreateCircleModal` and `JoinCircleModal` are only rendered inside the authenticated branch of `CirclesPage` (guarded by `if (!user && !authLoading)`). The join-by-invite flow gates on `isConfigured` and `user` before attempting any mutation.

### 5. Server refactor safety — VERIFIED AND IMPROVED

`createApp`/`createRouteHandlers`/`startServer` separation is clean and behaviorally equivalent. `listPlans` was the only handler not using `async/await` — converted for consistency. Added three missing server tests: `PATCH /plans/:id` cross-user ownership rejection, `PATCH` field-merge success, and `GET /plans` cross-user `userId` query param rejection.

### 6. Auth store lifecycle — VERIFIED

Module-level `authSubscription` pattern is correct and safe. Test confirms unsubscribe-before-register works across multiple `initialize()` calls. Added a test for the authenticated-user-without-trainer-mode case on trainer routes.

### Additional bugs found and fixed

- **Duplicate exercise ID**: `plyo_push_up` appeared twice in the migration-generated `src/data/exercises.ts`. First entry renamed to `plyometric_push_up`.
- **`suggestSplitAdjustment` clock dependency**: The function used `new Date()` directly, causing its test to fail once the hardcoded Feb 2026 fixture dates aged past the 28-day window. Added an optional `referenceDate` parameter (defaults to `new Date()`).

### Final test counts after PR #23

- Frontend: **184/184** (was 182 — two pre-existing failures now fixed)
- Server: **13/13** (was 10 — three new tests added)

## Files Directly Changed For This Work

Frontend runtime:

- `src/App.tsx`
- `src/components/RequireAuth.tsx`
- `src/components/auth/AuthModal.tsx`
- `src/components/auth/AuthUnavailableState.tsx`
- `src/pages/Circles.tsx`
- `src/components/circles/JoinCircleHandler.tsx`
- `src/stores/authStore.ts`
- `src/lib/apiClient.ts`
- `src/lib/plans/plansClient.ts`
- `src/test/setup.ts`

Frontend tests:

- `src/App.auth-routing.test.tsx`
- `src/stores/authStore.test.ts`
- `src/lib/apiClient.test.ts`
- `src/lib/plans/plansClient.test.ts`

Server runtime:

- `server/src/index.ts`
- `server/package.json`

Server tests:

- `server/test/index.test.ts`

## Bottom-Line Summary

The main bug I set out to fix was not “missing auth everywhere,” but “auth semantics were ambiguous and misleading.”

The final result is:

- route access is now explicit and aligned with the agreed demo-first prototype policy
- `RequireAuth` has one meaning instead of two
- auth prompting is global instead of circles-local
- demo mode remains supported, but auth-backed routes now fail clearly when backend config is missing
- auth listener cleanup is covered
- the most important auth/route/persistence/server boundaries now have direct tests

If Claude is reviewing this, the most important question is not whether the code compiles in a vacuum. It is whether the final route/auth policy now matches the intended product behavior without leaving hidden guest access or broken demo-mode edges behind.
