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

## Re-run safety

- 002, 004 and 007 are safe to re-run: tables/indexes use `IF NOT EXISTS`, and every
  policy and trigger is preceded by `DROP ... IF EXISTS`. The local harness
  (`bash supabase/tests/run.sh`) re-applies all three on every run to prove it.
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
3. Applies `migrations/*.sql` in order, then re-applies 002, 004 and 007.
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
