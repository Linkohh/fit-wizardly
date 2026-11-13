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

## Re-run safety

- 002 and 004 are safe to re-run: tables/indexes use `IF NOT EXISTS`, and every
  policy and trigger is preceded by `DROP ... IF EXISTS`.
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
