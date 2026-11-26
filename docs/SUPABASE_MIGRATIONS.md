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
| 009 | `009_purge_tombstone_content.sql` | No tables. Trigger function `purge_tombstone_content()` on `plans` and the seven 007 tables: a deleted row's content is wiped (see [009 section](#009-wipe-deleted-content-debt-097)). **Production only after the client change that reads empty tombstones has shipped** |

## Re-run safety

- 002, 004, 007, 008 and 009 are safe to re-run: tables/indexes use `IF NOT EXISTS`,
  functions use `CREATE OR REPLACE`, and every policy and trigger is preceded by
  `DROP ... IF EXISTS`. The local harness (`bash supabase/tests/run.sh`) re-applies
  all five on every run to prove it.
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
supabase migration list --remote            # shows 001–007 as local-only
supabase migration repair --remote --status applied 001 002 003 004 005 006
# Add 007 to that list only if you already pasted 007 into the SQL Editor.
supabase db push --remote --dry-run         # must list only the new files
supabase db push --remote
```

(`--remote` added 2026-11-26: CLI 3.2.0 targets the local database without it.
See the note in [Staging order](#staging-order-at-gate-1-l10).)

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
3. Applies `migrations/*.sql` in order, then re-applies 002, 004, 007, 008 and 009.
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

> **`--remote` (checked 2026-11-26, CLI 3.2.0).** `migration list`,
> `migration repair` and `db push` target the **local** database unless you pass
> `--remote` (the linked project). The commands below and in the production
> section include it. If your CLI rejects `--remote`, run `supabase --version`
> and check `supabase db push --help` for the flag it uses instead (older
> releases used `--linked`).

1. **Repair 001–006 (DEBT-053).** They were applied in the SQL Editor, so the CLI
   doesn't know about them:
   `supabase migration repair --remote --status applied 001 002 003 004 005 006`
   (see [Before the first `supabase db push`](#before-the-first-supabase-db-push-on-staging-or-production)).
2. **Push 007 and 008:** `supabase db push --remote --dry-run` must list exactly
   `007_user_data.sql` and `008_policy_fixes.sql`, then `supabase db push --remote`.
   Once 009 is in the checkout, `db push` would apply it too: on staging that's
   fine only if staging runs a client with the tombstone change (see
   [009](#009-wipe-deleted-content-debt-097)); otherwise push from a checkout
   without 009, as in [production step 3](#production-at-gate-2-l2).
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

## 009: wipe deleted content (DEBT-097)

Lincoln's decision (2026-11-26): when a signed-in user deletes an item, its
content is wiped from the cloud straight away, not kept until account deletion.

The sync engine deletes with `UPDATE <table> SET deleted_at = …`
(`src/lib/sync/engine.ts`, `pushChanges`), and a pushed row can also be an upsert
that already carries `deleted_at`. 009 adds one `BEFORE INSERT OR UPDATE`
trigger function, `public.purge_tombstone_content()`, attached to all eight
synced tables. When `NEW.deleted_at IS NOT NULL` it overwrites every content
column with an empty or neutral value that still passes the table's `NOT NULL`
and `CHECK` constraints. Live rows (`deleted_at` NULL) are not touched.

| Table | Cleared (value on a tombstone) | Kept |
|---|---|---|
| `plans` | `plan` → `{}`, `schema_version` → 1 | `user_id`, `id`, `created_at`, `updated_at`, `deleted_at` |
| `workout_logs` | `plan_id` → `''`, `completed_at` → 1970-01-01, `total_volume` → 0, `log` → `{}`, `schema_version` → 1 | `user_id`, `id`, `updated_at`, `deleted_at` |
| `personal_records` | `exercise_id` → `''`, `type` → `'weight'`, `value` → 0, `achieved_at` → 1970-01-01, `record` → `{}` | `user_id`, `id`, `updated_at`, `deleted_at` |
| `nutrition_days` | `log` → `{}` | `user_id`, `day`, `updated_at`, `deleted_at` |
| `nutrition_settings` | `profile` → NULL, `targets` → NULL, `custom_foods` / `favorites` / `saved_meals` → `[]` | `user_id`, `updated_at`, `deleted_at` |
| `body_measurements` | `measured_on` → 1970-01-01, `data` → `{}` | `user_id`, `id`, `updated_at`, `deleted_at` |
| `readiness_entries` | `entry` → `{}` | `user_id`, `day`, `updated_at`, `deleted_at` |
| `user_state` | `achievements` → `{}`, `custom_exercises` / `favorite_exercises` → `[]` | `user_id`, `updated_at`, `deleted_at` |

Why each kept column stays:

- **`user_id`**: the owner. RLS (`auth.uid() = user_id`) and the account-deletion
  cascade both depend on it, and it is half of every primary key.
- **`id` / `day`** (the rest of the primary key): the pull needs the key to know
  *which* local record to delete on other devices, and a revive upsert
  (`ON CONFLICT (user_id, id|day)`) needs it to find the row. For
  `nutrition_days` and `readiness_entries` the key is the date, so the date of a
  deleted day stays; that's the minimum needed to tombstone it.
- **`deleted_at`**: it is the tombstone. Other devices compare it with their
  own pending edits ("a delete beats any edit older than itself").
- **`updated_at`**: the pull cursor (`updated_at >= $cursor`). Without it moving,
  other devices would never see the delete.
- **`plans.created_at`** (judgement call, flagged for the coordinator): row
  metadata, not plan content. The client never sends it (`planToRow` omits it),
  so wiping it would leave a revived plan with a fake creation date for good.
  The plan's own `createdAt` lives inside `plan`, which is wiped.

`type` on `personal_records` becomes `'weight'` because its `CHECK` only allows
`weight`, `reps` or `volume`; on a tombstone it carries no information.

**Undelete still works.** A revive is an upsert with full content and
`deleted_at = NULL`; the trigger does nothing for it, and `DO UPDATE` writes the
content back. Tested for every table.

**Client dependency (why production must wait).** Today's client pulls a row
and calls `fromRow()` *before* it looks at `deleted_at`
(`mergeRows` in `src/lib/sync/engine.ts`). With 009, `fromRow({ log: {} })`
fails validation, the row is skipped as "malformed", and **the delete never
reaches the user's other devices**. The coordinator's Lane E change makes the
pull handle a tombstone from its key alone. **Apply 009 to production only after
that client change has shipped to users.**

**Existing tombstones.** 009 only acts on writes made after it is applied.
Rows deleted before that keep their content until the backfill in
[production step 6](#production-at-gate-2-l2) is run.

**Re-runnable:** yes (`CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS`).
Requires 004 and 007.

**Verified locally** (`supabase/tests/009_purge_tombstone_content.test.sql`,
Postgres 16), for all eight tables: a live row keeps its content; the
`UPDATE ... SET deleted_at` path and the upsert-with-`deleted_at` path (update
and insert) wipe it; the key, `user_id` and `deleted_at` survive and
`updated_at` moves; a revive with full content restores it; another user can't
read, tombstone, revive or upsert onto the row. A catalog guard fails if any
synced table gains a column that 009 neither keeps nor clears. **Mutation
check:** with the `CREATE TRIGGER` statements commented out, the test fails
("expected 1 purge_tombstone_content trigger, found 0"); with the triggers
present but the wipe disabled, it fails on "UPDATE tombstone kept content".
Not yet run on staging.

### Verification queries (SQL Editor, read-only)

```sql
-- 1. The function exists. Expect 1 row, definer = false.
select p.proname, p.prosecdef as definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'purge_tombstone_content';

-- 2. One trigger per synced table, enabled. Expect 8 rows, enabled = 'O'.
select tg.tgrelid::regclass as table_name, tg.tgname, tg.tgenabled as enabled
from pg_trigger tg join pg_proc p on p.oid = tg.tgfoid
where p.proname = 'purge_tombstone_content' and not tg.tgisinternal
order by 1;

-- 3. After a test delete in the app (throwaway account): no tombstone holds
--    content. Expect 0 in every column.
select
  (select count(*) from plans              where deleted_at is not null and plan <> '{}') as plans,
  (select count(*) from workout_logs       where deleted_at is not null and log <> '{}') as workout_logs,
  (select count(*) from personal_records   where deleted_at is not null and record <> '{}') as personal_records,
  (select count(*) from nutrition_days     where deleted_at is not null and log <> '{}') as nutrition_days,
  (select count(*) from nutrition_settings where deleted_at is not null and (profile is not null or targets is not null or custom_foods <> '[]' or favorites <> '[]' or saved_meals <> '[]')) as nutrition_settings,
  (select count(*) from body_measurements  where deleted_at is not null and data <> '{}') as body_measurements,
  (select count(*) from readiness_entries  where deleted_at is not null and entry <> '{}') as readiness_entries,
  (select count(*) from user_state         where deleted_at is not null and (achievements <> '{}' or custom_exercises <> '[]' or favorite_exercises <> '[]')) as user_state;
```

Query 3 also counts tombstones written before 009 until the backfill has run.

## Production at Gate 2 (L2)

Exact steps for Lincoln. Production gets **007 and 008 at Gate 2**, and **009
later**, in a separate session, once the client change for empty tombstones has
shipped. Nothing here has been run against a real Supabase project by an agent;
the SQL is checked on the local harness only.

### Before you start

- [ ] Gate 1 is done on **staging**: 007 and 008 pushed and verified, the
      `delete-account` function deployed and its curl test passed (L10).
- [ ] You have the production project ref and database password, and the CLI
      installed (`supabase --version`).
- [ ] A backup you can restore: in the dashboard, **Database → Backups**, note
      the latest daily backup time (or the point-in-time-recovery window, if the
      plan has it). If there's no usable backup, take one first:
      `supabase db dump --remote -f prod-before-L2.sql` (check the flag with
      `supabase db dump --help` on your CLI). Keep the file off the repo.
- [ ] Do it at a quiet time. 007 and 008 take seconds; nothing is locked for long.
- [ ] 007 and 008 must be on production **before** v1.1.0 (which syncs to the
      007 tables and calls the delete-account function) is promoted to `main`.

### Step 1: link the production project

```sh
cd fit-wizardly
git switch preview_b && git pull              # the reviewed migrations
supabase link --project-ref <prod-ref>        # prompts for the database password
```

### Step 2: check which migrations are already applied

```sh
supabase migration list --remote
```

The "Remote" column shows what the CLI history table records. On production it
is most likely **empty**, because 001–006 were pasted into the SQL Editor. The
history table doesn't know about SQL Editor runs, so check the objects too
(SQL Editor, read-only):

```sql
-- Which migration's objects exist? Each column should read true for every
-- migration that is live.
select
  to_regclass('public.circle_members')     is not null as m001,
  to_regclass('public.user_streaks')       is not null as m002,
  to_regclass('public.activity_reactions') is not null as m003,
  to_regclass('public.plans')              is not null as m004,
  exists (select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'profiles'
            and column_name = 'is_trainer')            as m005,
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'join_circle_by_invite') as m006,
  to_regclass('public.workout_logs')       is not null as m007,
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'is_circle_member')      as m008,
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'purge_tombstone_content') as m009;

-- What the CLI history table records (errors if the CLI has never pushed here;
-- that means "empty").
select version, name from supabase_migrations.schema_migrations order by version;
```

Expected at Gate 2: `m001`–`m006` true, `m007`–`m009` false. If anything else
shows up, stop and work out why before going on:

- one of `m001`–`m006` false: that migration was never applied to production.
  Don't repair it; apply it first (SQL Editor, in order) and re-check.
- `m007` or `m008` true: it was pasted by hand. Include it in the repair below,
  then re-run its verification queries ([007](#007-user-data-tables),
  [008](#008-access-rule-fixes)) instead of pushing it.

### Step 3: repair the history, then push 007 and 008 (without 009)

Repair only the versions step 2 showed are live:

```sh
supabase migration repair --remote --status applied 001 002 003 004 005 006
supabase migration list --remote             # 001–006 now show as remote
```

`db push` applies **every** local file the history doesn't have, so from a
checkout that contains `009_…` it would apply 009 too. Push from a checkout
without it. `9a1a767` (v1.1.0 on `preview_b`) has 001–008 and no 009:

```sh
git worktree add ../fw-l2 9a1a767            # a second checkout, 001–008 only
cd ../fw-l2
supabase link --project-ref <prod-ref>
supabase db push --remote --dry-run          # must list exactly 007_user_data.sql and 008_policy_fixes.sql
supabase db push --remote
supabase migration list --remote             # 001–008 remote; 009 not listed here
cd ../fit-wizardly && git worktree remove ../fw-l2
```

If the dry run lists anything else, stop. Don't push.

### Step 4: verify 007 and 008

Run the read-only queries in the [007](#007-user-data-tables) and
[008](#008-access-rule-fixes) sections on production; every result must match
its "Expect" line. Then:

1. deploy the `delete-account` function to production
   ([`supabase/functions/delete-account/README.md`](../supabase/functions/delete-account/README.md)),
   with production's `ALLOWED_ORIGINS`;
2. with a throwaway account on the production web app: sign in, create a plan
   and log a workout, check they sync (no `401`/`403` in the network tab), open
   Profile, then delete the account and confirm the query in the function README
   returns no rows for it.

Tick L2 on the board for 007 and 008 here. 009 is not part of Gate 2.

### Step 5 (later): apply 009, only after the client change has shipped

Preconditions, all true:

- [ ] the coordinator's Lane E change (the pull handles tombstones with empty
      content) is merged **and released**: live on the production web app, and in
      the store builds people actually have. A user on an older build would stop
      receiving deletes from their other devices;
- [ ] 009 has been applied to **staging** and checked there with that client:
      delete an item on device A, confirm it disappears on device B, and that the
      row's content is empty (verification query 3);
- [ ] a fresh backup (as above). 009 throws data away by design.

Then, from an up-to-date checkout that contains 009:

```sh
supabase migration list --remote             # 001–008 remote, 009 local only
supabase db push --remote --dry-run          # must list exactly 009_purge_tombstone_content.sql
supabase db push --remote
```

Run the [009 verification queries](#verification-queries-sql-editor-read-only-2)
1 and 2, then delete something with a throwaway account and run query 3 for that
user.

### Step 6 (after step 5, optional but recommended): wipe old tombstones

Rows deleted before 009 still hold their content. Re-saving them makes the
trigger wipe them. It moves their `updated_at`, so every device pulls those
tombstones once more; with the new client that is harmless (each is already
deleted locally). Count first, then run in one transaction:

```sql
-- How many old tombstones, per table.
select 'plans' t, count(*) from plans where deleted_at is not null
union all select 'workout_logs', count(*) from workout_logs where deleted_at is not null
union all select 'personal_records', count(*) from personal_records where deleted_at is not null
union all select 'nutrition_days', count(*) from nutrition_days where deleted_at is not null
union all select 'nutrition_settings', count(*) from nutrition_settings where deleted_at is not null
union all select 'body_measurements', count(*) from body_measurements where deleted_at is not null
union all select 'readiness_entries', count(*) from readiness_entries where deleted_at is not null
union all select 'user_state', count(*) from user_state where deleted_at is not null;

begin;
update plans              set deleted_at = deleted_at where deleted_at is not null;
update workout_logs       set deleted_at = deleted_at where deleted_at is not null;
update personal_records   set deleted_at = deleted_at where deleted_at is not null;
update nutrition_days     set deleted_at = deleted_at where deleted_at is not null;
update nutrition_settings set deleted_at = deleted_at where deleted_at is not null;
update body_measurements  set deleted_at = deleted_at where deleted_at is not null;
update readiness_entries  set deleted_at = deleted_at where deleted_at is not null;
update user_state         set deleted_at = deleted_at where deleted_at is not null;
-- 009 verification query 3 must now return 0 in every column, then:
commit;   -- or rollback; if it doesn't
```

### Rollback notes

None of these migrations has a down file. Prefer fixing forward with a new
migration; restore from backup only for a real data problem.

| Migration | To undo | What you lose |
|---|---|---|
| 009 | `drop trigger if exists <table>_purge_tombstone_content on <table>;` for the 8 tables, then `drop function if exists public.purge_tombstone_content();` and `supabase migration repair --remote --status reverted 009` | **Wiped content does not come back.** Dropping the trigger only stops future wipes; content cleared before that is gone except from a backup taken before step 5 or 6. The client keeps working without the trigger (tombstones simply keep content again) |
| 008 | No clean undo. Re-running 002 would bring back the forgeable streak and badge writes; the old public `profiles` policy and the blocking foreign keys come back only by restoring from backup | Undoing it breaks account deletion for anyone who created a circle, and re-opens the access holes. If a policy is wrong, fix it in a new migration |
| 007 | Only before any client has synced: `drop table` the seven tables and `alter table plans drop column deleted_at`, then `migration repair --remote --status reverted 007` (and 008/009 first, which depend on it) | **All synced user data in those tables.** v1.1.0's sync needs these tables and `plans.deleted_at`, so a rollback also means rolling the web app back to before sync. Practically: fix forward |
| repair | `supabase migration repair --remote --status reverted <version>` | Only the history row; nothing in the schema changes |

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
