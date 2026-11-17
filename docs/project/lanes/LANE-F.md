# Lane F: Database & Accounts

**Mission:**
- Give every kind of user data a safe home in the cloud.
- Close the database access-rule holes.
- Let users delete their account, which both app stores require.
- Retire the unused Express server.

**Active:** Days 1–7 (Day 7 is a buffer). With 4 agents, this lane is paired with Lane E.

## Read first
- `docs/project/README.md`
- `docs/project/CONTRACTS.md`, sections 3 and 4
- `docs/SUPABASE_MIGRATIONS.md`
- `supabase/migrations/004_plans_schema.sql`, the pattern to copy
- `supabase/migrations/001_circles_schema.sql` (lines 70–130) and `002_exercise_interactions_schema.sql` (lines 70–140), the policies you will fix
- `docs/LAUNCH_ROADMAP.md`, items 1.3, 1.5, 1.6 and 1.7

## Owns
- `supabase/**` (migrations, `config.toml`, `functions/`, `tests/`), `src/types/supabase.ts`
- `src/lib/account/*` (new)
- The **account block** in `src/pages/Profile.tsx` (around lines 380–405, where the commented-out "Delete Account" button is)
- `src/lib/dataExport.ts` and its test
- Exceptions inside Lane A's docs: you may update `docs/SUPABASE_MIGRATIONS.md` and rewrite `docs/SECURITY.md`, because you know the data model best
- Day 5 only: `server/`, the server steps in `.github/workflows/ci.yml`, the `/plans` and `/health` proxy in `vite.config.ts`, `src/lib/apiClient.ts`, the API branch of `src/lib/plans/plansClient.ts`, the related `.env.example` lines, and the "Optional local API" section of `README.md`

## Must not touch
- Stores and sync code (Lane E). Call `clearLocalUserData()` from contract #2; don't reimplement it.
- `authStore.ts`, except for adding one call (see Day 4).
- `Legal.tsx`. Send your text to Lane A.

## Contracts
- **Provides:** #3, the cloud tables (Day 1), and #4, the delete-account function (Day 3).
- **Uses:** #2, `clearLocalUserData` (Day 4).

## Environment
Cloud agents can't reach Lincoln's Supabase dashboard, and usually can't run Docker (`supabase start`). Test the SQL against a **local Postgres** set up with a stub `auth` schema (Day 1). Lincoln applies the migrations to **staging** at Gate 1 and to **production** at Gate 2. Mark anything you couldn't run for real as **unverified** in your handoff.

---

## Day 1: Tooling, test harness, migration 007 (1.3)

### Steps
1. **Supabase CLI.**
   - Run `npx supabase init`. This creates `supabase/config.toml`; commit it and keep its defaults.
   - Don't run `supabase link`; that needs Lincoln's project credentials.
   - Check whether the CLI accepts the existing file names `001_…`–`006_…`. The CLI orders migrations by the numeric prefix. Read the current CLI docs and record what you find.
   - If the names are **not** accepted, write the rename plan (timestamped names, plus how to mark migrations already applied with `supabase migration repair`) in `docs/SUPABASE_MIGRATIONS.md`, but **don't rename the files yet**. Renaming is Lincoln's call because production already has these migrations applied.
2. **Local test harness** in `supabase/tests/`:
   - `setup.sql` creates schema `auth`, table `auth.users (id uuid primary key)`, function `auth.uid()` returning `current_setting('request.jwt.claim.sub', true)::uuid`, and roles `anon` and `authenticated` if they're missing.
   - `run.sh` installs Postgres if needed (`apt-get install -y postgresql`), starts it, creates a throwaway database, runs `setup.sql`, applies `migrations/*.sql` in order, then runs `tests/*.test.sql`. Each test switches to `SET ROLE authenticated; SET request.jwt.claim.sub = '<uuid>';` and asserts with `DO $$ … RAISE EXCEPTION … $$` blocks.
   - If Postgres can't be installed in your session, commit the harness anyway and mark the tests unverified.
   - Add `npm run test:db` (`bash supabase/tests/run.sh`) to `package.json` scripts. Lane H owns the `scripts` field, so put this line in your handoff for Lane H to add. You may run the script directly in the meantime.
3. **`007_user_data.sql`**, exactly as specified in contract #3:
   - All seven tables, plus `ALTER TABLE plans ADD COLUMN IF NOT EXISTS deleted_at`.
   - Reuse the existing `set_updated_at()` function, with one trigger per table.
   - The indexes listed in the contract.
   - Four owner-only policies per table, using `DROP POLICY IF EXISTS` then `CREATE POLICY`.
   - The file must be safe to run twice: use `CREATE TABLE IF NOT EXISTS` and `DROP TRIGGER IF EXISTS`.
4. **`007_user_data.test.sql`**:
   - User A can insert, select, update and delete their own rows in every table.
   - User B can't see or change A's rows.
   - `anon` can't select anything.
   - Deleting A from `auth.users` removes all of A's rows (cascade).
5. **Types:** extend `src/types/supabase.ts` with the seven tables, plus `plans.deleted_at`, following the style of the existing `plans` entry.
6. **Docs:** add a 007 section to `docs/SUPABASE_MIGRATIONS.md`: what it adds, that it's re-runnable, and the verification queries Lincoln can run.

### Done when
- [ ] `bash supabase/tests/run.sh` passes, or is marked unverified with the reason.
- [ ] Applying 007 twice gives no errors.
- [ ] `npm run typecheck` is green with the new types.

---

## Day 2: Migration 008, access-rule fixes (1.6)

> **Carried over from Day 1 handoffs (added 2026-11-17 by the coordinator).** Do these too:
> - Note for Gate 1 (Lincoln): migrations 001–006 were applied in the SQL Editor, so the CLI history is empty. **Run `supabase migration repair --status applied 001 … 006` before the first `supabase db push`.** The steps are in `docs/SUPABASE_MIGRATIONS.md`. DEBT-053.


Write `008_policy_fixes.sql`, re-runnable, with a test file for each fix.

1. **`circle_members` recursion.** The SELECT policy in `001:115-122` queries `circle_members` from inside its own policy, which Postgres rejects as infinite recursion.
   - Create `public.is_circle_member(p_circle_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public`.
   - Have it run `SELECT EXISTS (SELECT 1 FROM circle_members WHERE circle_id = p_circle_id AND user_id = auth.uid())`.
   - Revoke it from `PUBLIC` and grant it to `authenticated`.
   - Replace the `circle_members`, `circles` and `circle_activities` member checks with it. Also check the 003 and 006 policies that repeat the subquery.
2. **Forgeable gamification** (`002:117-135`):
   - Drop the client INSERT and UPDATE policies on `user_streaks` and `exercise_badges`. SELECT-own stays. Writes happen only through the existing SECURITY DEFINER functions, or the service role later.
   - `challenge_participants`: users can't update `score`. Either drop the client UPDATE policy and keep a narrow one for non-score columns, or add a trigger that rejects score changes from non-service roles.
3. **`profiles` exposure** (`001:75-77`, `USING (true)`, readable by anyone including signed-out users). Replace it with:
   - "Users can read their own profile": `auth.uid() = id`.
   - "Signed-in users can read profiles of people they share a circle with": `EXISTS` a shared `circle_members` row, through a second SECURITY DEFINER helper `shares_circle_with(p_user uuid)`.
   - `anon` gets nothing.
   - This keeps the app working: `authStore` only reads the signed-in user's own row, and Circles (flagged off) reads co-members.
4. **Missing DELETE policies:** `circles` (admin only) and the 001 tables. Check that every `user_id` / `created_by` column referencing `auth.users` has `ON DELETE CASCADE`, or `SET NULL` where a shared row must survive (for example a circle whose creator deletes their account: reassign it or set it to null, and record your choice).
5. **Tests:**
   - Selecting `circle_members` works and doesn't recurse.
   - A user can't insert their own badge or streak, or change a score.
   - `anon` can't read profiles. A stranger can't read a profile; a co-member can.
   - Deleting a user leaves no orphan rows. Query every table that has a user column.

### Done when
- [ ] Every test passes, or is marked unverified.
- [ ] `docs/SUPABASE_MIGRATIONS.md` has an 008 section, including "apply to staging first; Circles is flagged off in v1".

---

## Day 3: The delete-account function (1.5 part 1)

1. Create `supabase/functions/delete-account/index.ts` (Deno), following contract #4:
   - Read the `Authorization` header and create a Supabase client with the **anon key plus that header**, then call `auth.getUser()` to identify the caller. If there's no user, return 401.
   - Create an admin client with `SUPABASE_SERVICE_ROLE_KEY`, which Supabase provides to functions as a secret. Call `auth.admin.deleteUser(user.id)`. The cascades from 007 and 008 remove every row.
   - Return 204. On any error, log it server-side and return `500 {"error":"Deletion failed"}` without details.
   - Handle CORS: allow `OPTIONS`, and allow origins from an `ALLOWED_ORIGINS` function secret. Native apps use `capacitor://localhost` (iOS) and `https://localhost` (Android), so include those.
   - Accept POST only.
2. Write `supabase/functions/delete-account/README.md` with the deploy commands for Lincoln (`supabase functions deploy delete-account`, plus `supabase secrets set ALLOWED_ORIGINS=…`) and a curl test.
3. Write a Deno unit test, `index.test.ts`, with the Supabase client mocked: 401 without a token, 204 on success, 500 when the admin call fails. Run it with `deno test` if Deno is available; otherwise mark it unverified.
4. Rewrite `docs/SECURITY.md` to match reality:
   - auth model (email OTP code, after Lane H's Day 3)
   - RLS summary per table
   - **the service-role key exists only as a secret in this one function**
   - CSP
   - consent
   - what the app stores where (link to `docs/store/DATA_INVENTORY.md`)
   
   Remove the fictional `server/src/middleware`, `SUPABASE_SERVICE_KEY` and `FRONTEND_URL` content.

**Done when:** the function code and tests exist, the deploy steps are written, and `SECURITY.md` has no references to files that don't exist.

---

## Day 4: Deletion UI, guest erase, export v3 (1.5 part 2)

1. Create `src/lib/account/deleteAccount.ts` (contract #4 client):
   - `fetch(`${VITE_SUPABASE_URL}/functions/v1/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey } })`.
   - On 204, call `await clearLocalUserData()` (contract #2), then `useAuthStore.getState().signOut()`, then navigate to `/`.
2. In the `Profile.tsx` account block (around lines 399–403), replace the commented-out button:
   - **Signed in:** a destructive "Delete account" button opens an `AlertDialog`. It explains that this permanently deletes the account and all synced data, and that it can't be undone. The confirm button stays disabled until the user types `DELETE`. Show a loading state, then a toast on success or an error with retry.
   - **Guest:** "Erase data on this device" with the same confirm pattern, calling `clearLocalUserData()`.
   - Add a link under both: "Download your data first", which uses the existing export.
3. `src/lib/dataExport.ts`:
   - Bump `USER_DATA_EXPORT_VERSION` to 3.
   - Include every persisted store: plans, logs, PRs, nutrition (all fields), measurements, readiness, achievements, custom exercises, favourites, preferences, and the consent flags.
   - Keep the version-2 keys unchanged so old backups still read.
   - Update `dataExport.test.ts`.
4. If contract #9 has merged, add `track('account_deleted')` before signing out.
5. In the handoff, give Lane A the "Delete your account" text for `/legal`, and the exact in-app path: Profile → Account → Delete account.

**Done when:**
- Tests cover the dialog (button disabled until `DELETE`), success clears data and signs out, and failure shows an error.
- The export test covers every store.

---

## Day 5: Retire Express (1.7; decision D1, default yes)

If Lincoln answered D1 with **no**, do this instead: fix the UUID check in `server/src/index.ts` (around lines 68, 349, 380 and 445) to accept the `plan_` id format, add a test that uses a real generated id, and stop there.

If D1 is **yes** (the default):

1. Delete `server/`.
2. In `.github/workflows/ci.yml`, remove the "Install server dependencies", "Test server" and "Build server" steps.
3. In `vite.config.ts`, remove the `/plans` and `/health` dev proxy.
4. Delete `src/lib/apiClient.ts` and its test.
5. In `src/lib/plans/plansClient.ts`, remove the `api` provider branch. Supabase becomes the only remote.
6. Remove `VITE_USE_API`, `VITE_API_URL`, `VITE_PLANS_PROVIDER`, `ALLOWED_ORIGINS` and `TRUST_PROXY` from `.env.example`.
7. In `package.json`, remove the `server:*` scripts. Lane H owns `scripts`, so either coordinate this in the handoff or make the edit and flag it in the PR; this is the agreed exception for this day.
8. Docs:
   - `README.md`: remove "Optional local API", and remove the variables from its table (exception for this day).
   - `docs/API_REFERENCE.md`: delete it, or reduce it to the Vercel functions in `api/`.
   - Leave anything else that mentions the server for Lane A, listed in the handoff.
9. Search for leftovers: `grep -rn "server:dev\|VITE_USE_API\|VITE_API_URL\|apiClient\|localhost:3001" . --exclude-dir=node_modules`.

**Done when:** the search finds nothing outside the changelog or history docs, CI passes without the server, and the plans still sync (`plansClient` tests are green).

---

## Day 6: Circles compatibility under migration 008

Circles is off in v1, but 008 must not break it for later.

1. With `VITE_FEATURE_CIRCLES=true` locally, trace every circle query in `src/stores/circles/*.ts` (`.from(...)`, `.rpc(...)`).
2. Check each query against the 008 policies in the harness by writing one SQL test per query shape: listing my circles, members of my circle, the feed, the leaderboard, joining by invite. Fix the policies in an `009_circle_policy_followups.sql` only if needed; don't edit 008 once it's on staging.
3. Record any query that would now fail, and the fix. Hand client-side changes to Lane E, which owns the stores.

**Done when:** every circle query shape has a passing policy test, or there's a documented follow-up.

## Day 7: Buffer
Fix database and account issues from Gate 1 and from Lincoln's staging run. Help Lincoln with L2 (production migrations) by writing the exact apply-and-verify steps for production in `docs/SUPABASE_MIGRATIONS.md`.
