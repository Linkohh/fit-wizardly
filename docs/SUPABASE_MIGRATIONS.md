# Applying Supabase migrations

Migrations live in `supabase/migrations/` and are applied **manually** to each
Supabase project (there is no automated pipeline). Apply them in numeric order.

| # | File | Creates |
|---|------|---------|
| 001 | `001_circles_schema.sql` | `profiles`, `circles`, `circle_members`, `circle_activities`, `circle_challenges` |
| 002 | `002_exercise_interactions_schema.sql` | `exercise_interactions`, `user_exercise_preferences`, `exercise_stats`, `user_streaks`, `exercise_badges`, stat functions + trigger |
| 003 | `003_social_features.sql` | `activity_reactions`, `activity_comments`, `circle_posts`, `challenge_participants`, extra challenge columns |
| 004 | `004_plans_schema.sql` | `plans` (cloud plan sync) |
| 005 | `005_trainer_roles.sql` | `profiles.role` / `profiles.is_trainer` columns, constraints and sync function |
| 006 | `006_security_hardening.sql` | Tightened RLS policies on circle tables (`circle_members`, `circle_activities`, `circle_challenges`, `activity_comments`, `circle_posts`, `challenge_participants`) and replaced `join_circle_by_invite()` |
| 007 | `007_user_data.sql` | `workout_logs`, `personal_records`, `nutrition_days`, `nutrition_settings`, `body_measurements`, `readiness_entries`, `user_state`; `plans.deleted_at` (see [007 section](#007-user-data-tables)) |
| 008 | `008_policy_fixes.sql` | No tables. Membership helpers `is_circle_member()`, `is_circle_admin()`, `shares_circle_with()`; rewrites the circle, social, profile, streak, badge and challenge-score policies; adds DELETE policies; fixes the foreign keys that blocked account deletion (see [008 section](#008-access-rule-fixes)) |

## Re-run safety

- 002, 004, 007 and 008 are safe to re-run: tables/indexes use `IF NOT EXISTS`, and every
  policy and trigger is preceded by `DROP ... IF EXISTS`. The local harness
  (`bash supabase/tests/run.sh`) re-applies all four on every run to prove it.
- **Re-running 002 after 008 brings back the client write policies on
  `user_streaks` and `exercise_badges`** that 008 drops. If you ever re-run
  002, re-run 008 straight after it.
- 006 only touches circle/social tables (001 and 003 tables) and does not
  overlap with 002/004, so re-running 002 will not undo 006.
- 001 and 003 are NOT safe to re-run: they create policies without
  `DROP POLICY IF EXISTS`. Re-running 001/003 after 006 would also bring back the
  looser policies that 006 replaced. Never re-run them on a live database.
- Re-running a migration recreates its policies. Only do it if the policy text
  in the file is what you want live.

## Checking what is live (Supabase dashboard)

1. **Table Editor**: confirm these tables exist: `plans`, `exercise_interactions`,
   `user_exercise_preferences`, `exercise_stats`, `user_streaks`, `exercise_badges`.
2. **SQL Editor** (read-only check):
   ```sql
   select tablename from pg_tables
   where schemaname = 'public'
     and tablename in ('plans','exercise_interactions','user_exercise_preferences',
                       'exercise_stats','user_streaks','exercise_badges');
   ```
   Expect 6 rows. Missing rows mean 002 and/or 004 were never applied.
3. Confirm RLS is on for each table (Table Editor shows an "RLS enabled" badge).

## Applying

1. Open the SQL Editor on the target project.
2. Paste the migration file contents and run it. Do 002 then 004 if both are missing.
3. Re-run the check query above, then smoke-test plan sync and exercise
   community stats in the app.

Status of production as of 2026-09-27: **unverified**. See SEC-005 in
`docs/SESSION_LOG.md`.

## Supabase CLI and file names

`supabase/config.toml` was created with `npx supabase init` (CLI 3.2.0) and
keeps the defaults. The project is **not linked** (`supabase link` needs the
project credentials; Lincoln does that locally).

**The existing names are accepted. No rename is needed.** Checked on
2026-11-17 with CLI 3.2.0 against a local Postgres 16 (`--db-url`):

- The CLI takes any `<digits>_<name>.sql` file. `001_circles_schema.sql` gets
  version `001`, and so on up to `007`.
- Versions sort as text, so `001`…`007` sort before any timestamped file
  (`20261118000000_x.sql`). Mixing the two works today.
- **Do not add a 3-digit file after a timestamped one.** `009_x.sql` would sort
  before `20261118000000_x.sql`, and `db push` refuses local files older than
  the newest applied one unless you pass `--include-all` (documented CLI
  behaviour; not rehearsed here). Keep the launch migrations as `008_`, `009_`;
  switch to `supabase migration new` timestamps only after that, for good.
- `--db-url` still works but prints a deprecation warning; CLI v4 will use
  `--remote=<db-url>`.

### Before the first `supabase db push` on staging or production

Migrations 001–006 were applied by hand in the SQL Editor, so the CLI's history
table (`supabase_migrations.schema_migrations`) is empty there. **A bare
`db push` will try to run 001 again and fail** on
`policy "Public profiles are viewable by everyone" ... already exists` (seen in
the local rehearsal). Mark what is already live first:

```sh
supabase link --project-ref <ref>          # once, on Lincoln's machine
supabase migration list                     # shows 001–007 as local-only
supabase migration repair --status applied 001 002 003 004 005 006
# Add 007 to that list only if you already pasted 007 into the SQL Editor.
supabase db push --dry-run                  # must list only the new files
supabase db push
```

Only repair versions you have confirmed are live (use the checks above). This
exact sequence (manual 001–006, repair, push of 007 plus a timestamped file)
was rehearsed on a local database; it has **not** been run against staging or
production.

### Local test harness

`bash supabase/tests/run.sh` (proposed `npm run test:db`) needs no Docker:

1. Installs Postgres with `apt-get` if it is missing, then starts a throwaway
   cluster in a temp dir (or uses `TEST_DATABASE_URL` if set; superuser needed).
2. Runs `supabase/tests/setup.sql`: a stub `auth` schema (`auth.users (id)`,
   `auth.uid()`, `auth.role()` read from `request.jwt.claim.*`), the `anon`,
   `authenticated` and `service_role` roles, the `supabase_realtime`
   publication, and Supabase's default grants, so RLS is what blocks access.
3. Applies `migrations/*.sql` in order, then re-applies 002, 004, 007 and 008.
4. Runs each `tests/*.test.sql` in its own copy of the database. Tests switch
   identity with `SET ROLE authenticated; SET request.jwt.claim.sub = '<uuid>';`
   and fail with `RAISE EXCEPTION`.

It is a stand-in, not Supabase: GoTrue, storage and realtime are not emulated.

## 007: user data tables

Adds the cloud tables for the sync engine (contract #3 in
`docs/project/CONTRACTS.md`).

| Table | Primary key | Holds |
|---|---|---|
| `workout_logs` | `(user_id, id)` | One completed workout (`log` = `WorkoutLog`) |
| `personal_records` | `(user_id, id)` | One PR (`type` is `weight`, `reps` or `volume`) |
| `nutrition_days` | `(user_id, day)` | One `DailyNutritionLog` per day |
| `nutrition_settings` | `(user_id)` | Profile, targets, custom foods, favourites, saved meals |
| `body_measurements` | `(user_id, id)` | One `BodyMeasurement` |
| `readiness_entries` | `(user_id, day)` | One `ReadinessEntry` per day |
| `user_state` | `(user_id)` | Achievements, custom exercises, favourite exercises |

Every table has `user_id ... REFERENCES auth.users(id) ON DELETE CASCADE`,
`updated_at` (kept current by the `set_updated_at()` trigger from 004) and a
nullable `deleted_at` tombstone. RLS is on with four owner-only policies
(`auth.uid() = user_id`; UPDATE also has `WITH CHECK`, so a row can't be handed
to another user). It also adds `plans.deleted_at`.

Indexes: `(user_id, updated_at)` on all seven tables and on `plans`, plus
`workout_logs (user_id, completed_at DESC)` and
`personal_records (user_id, exercise_id)`.

**Re-runnable:** yes. Apply 004 first (007 needs `plans` and `set_updated_at()`).
Nothing in 007 touches data, so re-running it only recreates its own policies,
triggers and indexes.

**Verified locally** (`supabase/tests/007_user_data.test.sql`, Postgres 16):
owner CRUD on every table, another user can't see, change, delete or take over
rows, `anon` sees nothing, and deleting the `auth.users` row removes all of
that user's rows. Not yet run on staging.

### Verification queries (SQL Editor, read-only)

```sql
-- 1. All seven tables exist with RLS on. Expect 7 rows, all rls = true.
select c.relname as table_name, c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('workout_logs','personal_records','nutrition_days',
                    'nutrition_settings','body_measurements',
                    'readiness_entries','user_state')
order by 1;

-- 2. Four policies per table. Expect 7 rows, each with 4 and
--    {DELETE,INSERT,SELECT,UPDATE}.
select tablename, count(*) as policies, array_agg(cmd order by cmd) as cmds
from pg_policies
where schemaname = 'public'
  and tablename in ('workout_logs','personal_records','nutrition_days',
                    'nutrition_settings','body_measurements',
                    'readiness_entries','user_state')
group by tablename order by 1;

-- 3. plans.deleted_at exists. Expect 1 row: timestamp with time zone, YES.
select data_type, is_nullable from information_schema.columns
where table_schema = 'public' and table_name = 'plans' and column_name = 'deleted_at';

-- 4. Every user column cascades from auth.users. Expect 8 rows, all 'c'.
select conrelid::regclass as table_name, confdeltype
from pg_constraint
where contype = 'f' and confrelid = 'auth.users'::regclass
  and conrelid::regclass::text in ('plans','workout_logs','personal_records',
        'nutrition_days','nutrition_settings','body_measurements',
        'readiness_entries','user_state')
order by 1;
```

Then, signed in to the app on staging, no requests to these tables should
return `401`/`403` once Lane E's sync engine starts writing to them.

## 008: access-rule fixes

Roadmap item 1.6. No new tables and no data changes, only functions, policies,
one trigger and four foreign keys.

> **Apply to staging first.** Circles is flagged off in v1
> (`VITE_FEATURE_CIRCLES`), so the only live code these policies affect is the
> profile read in `authStore` (own row: still allowed) and the streak and badge
> reads in `useExerciseInteraction` (own rows: still allowed). The circle
> policies are there to keep the feature working for later; Lane F Day 6 checks
> every circle query shape against them.

| Fix | Before | After |
|---|---|---|
| `circle_members` recursion | The SELECT policy queried `circle_members` inside itself; Postgres raised `infinite recursion detected`, so every circle read failed | `is_circle_member(circle_id)` and `is_circle_admin(circle_id)`, `SECURITY DEFINER` with `search_path = public`, executable by `authenticated` only. Every circle, feed, challenge, reaction, comment and post policy from 001, 003 and 006 uses them |
| Circle policies for signed-out users | Policies applied to every role; anon could read public circles | All circle and profile policies are `TO authenticated`; anon gets nothing |
| Private circle creation | The creator couldn't read back a new private circle (not yet a member), so `insert().select()` and the admin self-join failed | `circles` SELECT also allows `created_by = auth.uid()`; INSERT requires `auth.uid() = created_by` |
| Forgeable streaks and badges | Clients could insert and update their own `user_streaks` and insert `exercise_badges` | Client write policies dropped; SELECT-own stays. Writes come only from `update_user_streak()` (via the `exercise_interactions` trigger) or the service role |
| Forgeable challenge score | Clients could update their own `challenge_participants.score`, and insert with any score | Client UPDATE policy dropped, plus trigger `trg_protect_challenge_score`: for `anon`/`authenticated`, an insert starts at 0 and an update keeps the old score. The service role and `SECURITY DEFINER` functions can set it |
| `profiles` exposure | `USING (true)`: anyone, signed out included, could read every profile | Own row (`auth.uid() = id`), plus profiles of people you share a circle with (`shares_circle_with(id)`). UPDATE also has `WITH CHECK` |
| Missing DELETE policies | None on `circles`, `circle_activities`, `circle_challenges`, `profiles` | `circles`: admins. `circle_activities`: author or admin. `circle_challenges`: creator or admin. `profiles`: own row |
| Foreign keys that blocked account deletion | `circles.created_by`, `circle_activities.user_id`, `circle_challenges.created_by` and `winner_id` referenced `profiles` with NO ACTION, so deleting anyone who had created a circle, posted or created a challenge failed | `circle_activities.user_id` CASCADE (the user's own feed items). The other three SET NULL: the circle and its challenges are shared, so they survive for the other members |

**Choice recorded:** when a circle's creator deletes their account the circle
stays, `created_by` becomes NULL, and their membership row is removed by the
existing cascade. If they were the only admin, the circle has no admin until a
later change promotes one (follow-up for Day 6; Circles is off in v1).

**Re-runnable:** yes. The foreign-key step looks each constraint up by column
before dropping and re-adding it.

**Verified locally** (`supabase/tests/008_policy_fixes.test.sql`, Postgres 16):
reading `circle_members` no longer recurses; members see their circle and its
feed, strangers see nothing and can't join a private circle or post into it; a
creator can create a private circle and become its admin; only admins update or
delete a circle; clients can't insert or update streaks or badges or set a
score, while the interaction trigger and the service role still can; anon reads
no profiles, a stranger reads only their own, a co-member reads (not writes) a
shared member's; deleting a user succeeds and no row in any table points at
them afterwards. Run against 001–007 without 008, the same checks fail on the
recursion, the streak write, the three profile reads and the deletion. Not yet
run on staging.

### Circle queries under 008 (Lane F Day 6)

`supabase/tests/circle_queries.test.sql` replays every query in
`src/stores/circles/*.ts` as the signed-in role: create a private circle (with
`insert().select()`), list my circles with members and profiles, join by invite
code, circle by id, the feed, the realtime refetch, the leaderboard inputs,
reactions, comments, challenges and leaving. **All pass under 008; no 009 was
needed.** Behaviour worth knowing when Circles is turned on:

- A public circle you're not in shows its row but no members (members are
  visible to members only).
- After someone leaves, their old posts stay in the feed but their profile is
  hidden (no shared circle any more); the feed shows "Someone".
- Deleting another member's comment matches no rows and returns no error; the
  UI only offers delete on your own comments.
- Realtime delivery isn't emulated by the harness. Supabase Realtime applies the
  same SELECT policy per row, which the feed tests cover.
- Open: a circle whose only admin deletes their account has no admin (above).

`supabase/tests/plans_tombstone.test.sql` covers the plans sync shapes: the
owner can upsert a row with `deleted_at` set (insert and update paths), pull it
back, tombstone with `UPDATE ... SET deleted_at` and revive it; another user can
do none of that and can't read it.

### Verification queries (SQL Editor, read-only)

```sql
-- 1. The helpers exist, are SECURITY DEFINER, and anon can't run them.
--    Expect 3 rows: definer = true, anon = false, authenticated = true.
select p.proname, p.prosecdef as definer,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_circle_member','is_circle_admin','shares_circle_with')
order by 1;

-- 2. No policy queries circle_members directly. Expect 0 rows.
select tablename, policyname from pg_policies
where schemaname = 'public'
  and (coalesce(qual,'') ~ '(FROM|JOIN) circle_members'
       or coalesce(with_check,'') ~ '(FROM|JOIN) circle_members');

-- 3. profiles is no longer public. Expect 0 rows.
select policyname from pg_policies
where schemaname = 'public' and tablename = 'profiles' and qual = 'true';

-- 4. Streaks and badges are read-only for clients. Expect 2 rows, both SELECT.
select tablename, cmd from pg_policies
where schemaname = 'public' and tablename in ('user_streaks','exercise_badges')
order by 1;

-- 5. No user foreign key blocks account deletion. Expect 0 rows.
select conrelid::regclass as table_name, conname, confdeltype
from pg_constraint
where contype = 'f' and connamespace = 'public'::regnamespace
  and confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
  and confdeltype not in ('c','n');
```

Then, on staging: sign in and open Profile (the own-profile read must still
work), and sign out and confirm the app still loads.

## Staging order at Gate 1 (L10)

Do these in order, on **staging** first and production only at Gate 2. Each step
links to its details above.

1. **Repair 001–006 (DEBT-053).** They were applied in the SQL Editor, so the CLI
   doesn't know about them:
   `supabase migration repair --status applied 001 002 003 004 005 006`
   (see [Before the first `supabase db push`](#before-the-first-supabase-db-push-on-staging-or-production)).
2. **Push 007 and 008:** `supabase db push --dry-run` must list exactly
   `007_user_data.sql` and `008_policy_fixes.sql`, then `supabase db push`.
   Run the [007](#007-user-data-tables) and [008](#008-access-rule-fixes)
   verification queries.
3. **Deploy the `delete-account` function** (needs 008; without it, deleting a user
   who created a circle fails). Follow
   [`supabase/functions/delete-account/README.md`](../supabase/functions/delete-account/README.md):
   `supabase secrets set ALLOWED_ORIGINS=…`, `supabase functions deploy delete-account`,
   then the curl test with a throwaway account.
4. **If 002 is ever re-run, re-run 008 straight after it (DEBT-070).** 002 recreates
   the client write policies on `user_streaks` and `exercise_badges` that 008
   drops. The same applies if anyone pastes 002 into the SQL Editor again.

## Account deletion (delete-account function)

Account deletion relies only on foreign keys: GoTrue deletes the `auth.users` row,
and every user row goes through `ON DELETE CASCADE`, or `SET NULL` for shared
circle rows (008).

`supabase/tests/delete_account.test.sql` checks this on top of 001–008:
- user A gets a row in **every** public column that references `auth.users` or
  `profiles` (22 columns today). A new user-linked table fails the test until it's
  seeded there, so the check can't go stale;
- a signed-in client can't delete from `auth.users` itself;
- the delete works for a role with no grants on public tables, as GoTrue's own
  role does;
- afterwards no row points at A; circles and challenges A created survive with
  the user nulled; user B's rows are unchanged, apart from B's reaction on A's
  deleted activity.

Mutation check (2026-11-18): with 008 removed, the test fails on
`circles_created_by_fkey`.

The verification query for deletion on a real project is in the function README.
