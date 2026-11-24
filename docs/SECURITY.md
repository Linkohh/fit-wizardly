# Security

> **Rewritten 2026-11-18 (Lane F, Day 3) to match the code on `preview_b`.** Everything below names files that exist. If you change auth, a policy, a header or where data is stored, update this file in the same PR.
> For *what* data the app stores and who receives it, the single source is [`docs/store/DATA_INVENTORY.md`](store/DATA_INVENTORY.md). This file covers *how* it's protected.

## Contents
- [Threat model in one paragraph](#threat-model-in-one-paragraph)
- [Authentication](#authentication)
- [Authorization: Row Level Security](#authorization-row-level-security)
- [Account deletion and the service-role key](#account-deletion-and-the-service-role-key)
- [Server code: Vercel functions](#server-code-vercel-functions)
- [Browser hardening: CSP and headers](#browser-hardening-csp-and-headers)
- [Consent](#consent)
- [What is stored where](#what-is-stored-where)
- [Secrets and environment variables](#secrets-and-environment-variables)
- [Testing the security rules](#testing-the-security-rules)
- [PR checklist](#pr-checklist)
- [Known gaps](#known-gaps)

---

## Threat model in one paragraph

FitWizard is a client-heavy React app (web, plus iOS and Android through Capacitor). The client is **untrusted**: anything in the bundle, including every `VITE_*` variable and the Supabase anon key, is public. The browser talks **directly** to Supabase (PostgREST, Auth, Realtime), so the database's Row Level Security (RLS) policies are the real access control. Client-side checks such as `RequireAuth` and feature flags are for user experience, not security. The only privileged server code is one Supabase Edge Function (`delete-account`) and three small Vercel functions in `api/`. Guests (not signed in) keep everything on the device and send no training data anywhere.

---

## Authentication

| Item | Where | Notes |
|---|---|---|
| Provider | Supabase Auth (GoTrue) | No passwords. Email only. |
| Sign-in | `src/stores/authStore.ts`: `signInWithEmail()` → `supabase.auth.signInWithOtp({ email })` | Supabase emails a magic link **and** a 6-digit code. |
| Code entry | `verifyEmailCode()` → `supabase.auth.verifyOtp({ email, token, type: 'email' })`; UI in `src/components/auth/EmailCodeStep.tsx` | The email code is the main path on native, where magic links can't reliably return to the app (Lane H, Day 3). |
| Magic-link redirect | `emailRedirectTo: redirectUrl \|\| window.location.origin`; same-origin check in `src/components/auth/sameOriginPath.ts` | Allowed redirect URLs must also be listed in the Supabase dashboard (Auth → URL Configuration). |
| Session storage | `src/lib/supabase.ts` with `src/lib/authSessionStorage.ts`: `persistSession: true`, `autoRefreshToken: true`; localStorage on the web, `@capacitor/preferences` on native (ADR 12, #74) | The session lasts across restarts (decision D2). Script on the page can read it, as it could in `sessionStorage` before; the CSP is the XSS defence. Sign-out removes it. |
| Sign-out | `signOut()` clears in-memory auth state, calls `clearSensitiveStorage()` (wizard and onboarding keys), then `supabase.auth.signOut()` | Training data stays on the device until sync ships (DEBT-045); the app says so in a toast. |
| Route guard | `src/components/RequireAuth.tsx` | UX only: it opens the sign-in modal. RLS still blocks data access when this is bypassed. |
| Not configured | `isSupabaseConfigured()`; `src/components/auth/AuthUnavailableState.tsx` | Without `VITE_SUPABASE_URL` and the anon key, the app runs in guest-only mode. |

### Roles

- **Database roles:** `anon` (signed out), `authenticated` (signed in), and `service_role` (bypasses RLS). Only the `delete-account` function uses `service_role`.
- **App role on `profiles`:** `role` is `client` or `trainer`, and `is_trainer` is derived from it. The `sync_profile_trainer_flags` trigger in `005_trainer_roles.sql` forces `role = 'client'` on insert and keeps the old value on update, unless the caller is `service_role`. **A user can't promote themselves to trainer**, even with a hand-written request. The client also strips these fields (`stripTrainerFields` in `authStore.ts`).
- **Circle roles:** `admin` and `member` (`circle_members.role`, constrained in 006).

---

## Authorization: Row Level Security

Every table in `public` has RLS **enabled**. Policies are in `supabase/migrations/`. Since 008, every circle and profile policy is `TO authenticated`, so `anon` gets nothing from them.

Two `SECURITY DEFINER` helpers in `008_policy_fixes.sql` avoid policies that query their own table, which Postgres rejects as infinite recursion. Both are revoked from `PUBLIC` and `anon`, granted to `authenticated` and `service_role`, and pinned to `search_path = public`:
- `is_circle_member(circle_id)` and `is_circle_admin(circle_id)`
- `shares_circle_with(user_id)`

### Per table

"Own" means `auth.uid() = user_id` (or `= id` for `profiles`).

| Table | Read | Insert | Update | Delete | On account deletion |
|---|---|---|---|---|---|
| `plans` (004) | own | own | own | own | CASCADE |
| `workout_logs`, `personal_records`, `nutrition_days`, `nutrition_settings`, `body_measurements`, `readiness_entries`, `user_state` (007) | own | own | own | own | CASCADE |
| `profiles` (001, 008) | own row, plus profiles of people you share a circle with | own (trainer fields forced, 005) | own (trainer fields locked, 005) | own | CASCADE (from `auth.users`) |
| `exercise_interactions` (002) | own | own | — | own | CASCADE |
| `user_exercise_preferences` (002) | own | own | own | — | CASCADE |
| `exercise_stats` (002) | everyone (aggregate counts, no user column) | — (written by trigger) | — | — | no user data |
| `user_streaks`, `exercise_badges` (002, 008) | own | **none for clients** (written only by `SECURITY DEFINER` functions or `service_role`) | none | none | CASCADE |
| `circles` (001, 006, 008) | members, plus the creator | signed in, `created_by = auth.uid()` | admins | admins | creator SET NULL (circle survives) |
| `circle_members` (001, 006, 008) | members of the same circle | join a public circle as member, or your own circle as admin; private circles only through `join_circle_by_invite()` | — | own row (leave) | CASCADE |
| `circle_activities` (001, 008) | members | members, as themselves | — | author or admin | CASCADE |
| `circle_challenges` (001, 008) | members | members, as creator | — | creator or admin | `created_by`, `winner_id` SET NULL |
| `activity_reactions`, `activity_comments`, `circle_posts` (003, 008) | members | members, as themselves | own (comments, posts) | own | CASCADE |
| `challenge_participants` (003, 008) | members | members, as themselves; **score forced to 0** | **none for clients**; the `trg_protect_challenge_score` trigger keeps the old score for non-service roles | own | CASCADE |

Circles is behind `VITE_FEATURE_CIRCLES` and off in v1. Its policies are still enforced and tested, because the tables exist in production.

### Rules for new tables

1. `ENABLE ROW LEVEL SECURITY` in the same migration that creates the table.
2. `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, or `SET NULL` for a shared row that must survive. **Never `NO ACTION`:** it makes account deletion fail.
3. Four owner policies, `TO authenticated`, using `DROP POLICY IF EXISTS` then `CREATE POLICY` (copy `007_user_data.sql`).
4. Never query a table from inside its own policy. Use a `SECURITY DEFINER` helper as in 008.
5. Columns the client must not set (scores, roles, badges) are protected by a trigger or by having no client write policy.
6. Add the table to the seed in `supabase/tests/delete_account.test.sql`. Its coverage check fails until you do.

---

## Account deletion and the service-role key

- **Function:** `supabase/functions/delete-account/` (contract #4). Deploy steps and a curl test are in its [README](../supabase/functions/delete-account/README.md).
- **Flow:** it verifies the caller's token with the anon key, then calls `auth.admin.deleteUser(<id from the token>)` with the service role. Every row goes through the foreign-key cascades above. It returns `204`, `401` or `500 {"error":"Deletion failed"}`, and never returns internal details.
- **The service-role key exists only as a Supabase function secret (`SUPABASE_SERVICE_ROLE_KEY`, injected by Supabase), used only by this one function.** It is not in `.env*`, Vercel, `api/` or the app bundle. If you ever see it anywhere else, rotate it in the Supabase dashboard (Settings → API) and remove it.
- **CORS:** `capacitor://localhost` and `https://localhost` are always allowed, plus the `ALLOWED_ORIGINS` function secret. CORS is not the boundary; the token is.
- **Client:** `src/lib/account/deleteAccount.ts` and the Profile → Account → Delete account button (Lane F, Day 4). After `204`, the client clears device data (`clearLocalUserData()`) and signs out.
- **Guests:** "Erase data on this device" calls `clearLocalUserData()` (`src/lib/storage/clearLocalUserData.ts`). No server call is needed because nothing was uploaded.

---

## Server code: Vercel functions

| Function | Purpose | Secret |
|---|---|---|
| `api/exercise-search-ninjas.ts` | Exercise search through API Ninjas | `API_NINJAS_API_KEY` (server only) |
| `api/motivation-quote.ts` | Quote of the day | `API_NINJAS_API_KEY` |
| `api/proxy-wger.ts` | Proxy to the public wger API (host allowlist) | none |

All three use `api/_lib/guard.ts`:
- **CORS allowlist:** `ALLOWED_ORIGINS`, plus the deployment's own URLs, `capacitor://localhost` and `https://localhost`. Other origins get `403`; requests with no `Origin` header are allowed.
- **Rate limit:** per IP, in memory. This is best-effort: each function instance has its own table.

None of them touch user data or Supabase.

There is no other server. The dev-only Express API (`server/`) was removed on Lane F Day 5 (decision D1, roadmap 1.7); plans are written straight to Supabase under RLS.

---

## Browser hardening: CSP and headers

Set for every path in `vercel.json`:

| Header | Value (summary) |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; `script-src 'self' 'wasm-unsafe-eval'`; `style-src 'self' 'unsafe-inline'`; `font-src 'self'`; `img-src 'self' data:` + `*.supabase.co`, `images.openfoodfacts.org`, `wger.de`; `connect-src 'self'` + `https://*.supabase.co`, `wss://*.supabase.co`, `world.openfoodfacts.org`, `wger.de`; `frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

- There are no inline scripts and no third-party script hosts. Fonts are self-hosted (Lane H, Day 2).
- **A new third party means editing the CSP** (Lane C owns `vercel.json` in Wave 2), plus a row in `DATA_INVENTORY.md` and, if data leaves the device, a consent gate (ADR 10).
- The `delete-account` function is on `*.supabase.co`, which `connect-src` already covers.
- **Native:** Capacitor serves the bundle locally, so these HTTP headers don't apply in the native apps. The WebView loads only bundled code.
- **React:** don't use `dangerouslySetInnerHTML` with user input. User-provided URLs go through the same-origin or allowlist helpers (`sameOriginPath.ts`, `validateRemoteEndpoint` in `src/lib/supabase.ts`).

---

## Consent

Consent is in `src/lib/consent.ts`, with the UI in `src/components/legal/ConsentModal.tsx`. Flags are stored on the device in localStorage; the exact keys are in `DATA_INVENTORY.md`.

| Flag | Gates |
|---|---|
| `fitwizard_consent_v1` | First-run acknowledgement of the privacy terms (`/legal`) |
| `fitwizard_analytics_consent` | Analytics. Off until the user opts in (`src/stores/analyticsStore.ts`) |
| `fitwizard_nutrition_lookup_consent` | Sending barcode and food searches to Open Food Facts (`src/lib/openFoodFacts.ts`) |
| Crash reporting | Lane C, Day 3 (Sentry): opt-in, disclosed in `/legal` |

Signing in is the consent for cloud storage of the signed-in user's data. Guests send nothing to Supabase.

---

## What is stored where

[`docs/store/DATA_INVENTORY.md`](store/DATA_INVENTORY.md) is the full table: every field, its key, where it's stored, who receives it, retention, and whether it's in the export. In short:

- **On the device:** training, nutrition, measurements, readiness, achievements and custom exercises are in IndexedDB `fitwizard` on the web, or app-private files on native (ADR 11). Preferences and consent flags are in localStorage. The auth session is in sessionStorage on the web.
- **In Supabase (signed in only):** the tables in the RLS table above, the account email in `auth.users`, and the profile.
- **Third parties:** Supabase (auth and database), Vercel (hosting and functions), API Ninjas (through `api/`, no user data), wger (through `api/proxy-wger`), Open Food Facts (with consent). Crash reporting arrives with Lane C.
- **Export:** Profile → Export data (`src/lib/dataExport.ts`). Version 3, covering every store, is Lane F Day 4.

---

## Secrets and environment variables

| Variable | Where it lives | Public? |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `.env.local`, Vercel, native build env | **Yes** (bundled). RLS is what protects data. |
| `VITE_FEATURE_*`, `VITE_PUBLIC_APP_ORIGIN`, `VITE_SHARE_BASE_URL` | same | Yes |
| `VITE_TRAINER_ACCESS_USERNAME` / `_PASSCODE` | same | **Yes.** A UX hold only, not a security control. |
| `API_NINJAS_API_KEY`, `ALLOWED_ORIGINS` | Vercel (server only, no `VITE_` prefix) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | **Supabase function secret only** (injected automatically) | No. Never anywhere else. |
| `ALLOWED_ORIGINS` (function) | Supabase function secret (`supabase secrets set`) | No (not sensitive, but configured server-side) |

Rules:
- Anything prefixed `VITE_` ships to every user. Never put a secret there.
- No secrets in code, docs, tests or commit messages. `.env`, `.env.local`, `.env.staging` and `.env.production` are git-ignored; only `.env.example` is committed.
- To rotate the anon key or the service-role key, use Supabase → Settings → API. Then update Vercel and the native build env for the anon key. Function secrets update themselves.

---

## Testing the security rules

| What | Command | Covers |
|---|---|---|
| RLS and cascades | `npm run test:db` (`supabase/tests/run.sh`, local Postgres with an `auth` stub) | 007 owner policies, 008 recursion, forgeable scores, profile exposure, delete cascades; `delete_account.test.sql` covers the full deletion path |
| delete-account function | `npx -y deno@2 test --no-config supabase/functions/delete-account/` | 401, 204, 500 (no details), 405, CORS |
| API guard | `npm run test:run` (`api/_lib/guard.test.ts`) | CORS allowlist, rate limit |
| Dependencies | `npm audit --omit=dev` | Known vulnerabilities |

The harness is not GoTrue. Real JWT handling and Supabase's own grants are approximated, so policy changes still get a staging check (see `docs/SUPABASE_MIGRATIONS.md`).

---

## PR checklist

- [ ] New table: RLS on, owner policies `TO authenticated`, user FK `CASCADE` or `SET NULL`, added to `delete_account.test.sql`, and a test in `supabase/tests/`.
- [ ] No secret in code, `VITE_*` or docs. No new use of the service-role key.
- [ ] New stored data or third party: row in `DATA_INVENTORY.md`, disclosure text for `Legal.tsx` (Lane A), included in `dataExport.ts`, consent gate if it leaves the device, CSP updated.
- [ ] User input validated with Zod at the boundary (`src/lib/validation/`).
- [ ] Errors shown to users are generic; details go to the console or logs.

---

## Known gaps

| Gap | Status |
|---|---|
| Re-running 002 after 008 recreates the client write policies on streaks and badges (DEBT-070) | Documented: re-run 008 straight after 002 |
| A circle whose only admin deletes their account has no admin | Lane F Day 6 (Circles is off in v1) |
| The rate limit in `api/` is per instance | Long term: Vercel firewall rules |
| Sign-out keeps training data on the device (DEBT-045) | Until sync ships (Lane E) |
| `delete-account` hasn't run against a real project yet | Lincoln deploys it to staging at Gate 1 (function README) |
