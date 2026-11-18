-- ============================================
-- Account deletion cascade check (Lane F Day 3, contract #4)
-- ============================================
-- The delete-account Edge Function calls auth.admin.deleteUser(), which makes
-- GoTrue run `DELETE FROM auth.users WHERE id = …` as its own role. Nothing
-- else deletes user data, so the foreign keys from migrations 001–008 must do
-- all of it. This file checks, on top of 008:
--   1. Coverage: user A has a row in EVERY public column that references
--      auth.users or profiles. A new user-linked table fails here until it is
--      added to the seed below, so the cascade check can't silently go stale.
--   2. A signed-in client cannot delete from auth.users itself.
--   3. The delete works for a role that owns nothing in public and has no
--      grants there (like supabase_auth_admin): cascades don't depend on the
--      deleter's privileges and aren't blocked by RLS.
--   4. Afterwards no row anywhere points at A; shared rows survive with A
--      nulled out; user B's rows are all still there.
SET client_min_messages = notice;

-- --------------------------------------------
-- Seed (as the superuser, so RLS doesn't get in the way)
-- --------------------------------------------
-- A = 00…0a (deleted), B = 00…0b (stays). They share two circles:
--   CA (created by A, B is a member) and CB (created by B, A is a member).
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');

INSERT INTO profiles (id, username) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob');

INSERT INTO circles (id, name, created_by) VALUES
  ('c0000000-0000-0000-0000-0000000000ca', 'Circle A', '00000000-0000-0000-0000-00000000000a'),
  ('c0000000-0000-0000-0000-0000000000cb', 'Circle B', '00000000-0000-0000-0000-00000000000b');

INSERT INTO circle_members (circle_id, user_id, role) VALUES
  ('c0000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('c0000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-00000000000b', 'member'),
  ('c0000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000b', 'admin'),
  ('c0000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000a', 'member');

INSERT INTO circle_activities (id, circle_id, user_id, activity_type) VALUES
  ('a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000a', 'workout'),
  ('a0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000b', 'workout');

-- A reacts to and comments on B's activity; B reacts to A's (goes with A's activity).
INSERT INTO activity_reactions (activity_id, user_id) VALUES
  ('a0000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('a0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');
INSERT INTO activity_comments (activity_id, user_id, content) VALUES
  ('a0000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', 'nice');

INSERT INTO circle_posts (circle_id, user_id, content) VALUES
  ('c0000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000a', 'hello'),
  ('c0000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000b', 'hi');

-- B's challenge in CB was won by A; A's challenge in CA.
INSERT INTO circle_challenges (id, circle_id, title, start_date, end_date, created_by, winner_id) VALUES
  ('d0000000-0000-0000-0000-0000000000cb', 'c0000000-0000-0000-0000-0000000000cb', 'B challenge',
   CURRENT_DATE, CURRENT_DATE + 7, '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('d0000000-0000-0000-0000-0000000000ca', 'c0000000-0000-0000-0000-0000000000ca', 'A challenge',
   CURRENT_DATE, CURRENT_DATE + 7, '00000000-0000-0000-0000-00000000000a', NULL);
INSERT INTO challenge_participants (challenge_id, user_id) VALUES
  ('d0000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000a'),
  ('d0000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000b');

-- 002
INSERT INTO exercise_interactions (user_id, exercise_id, interaction_type) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'squat', 'view'),
  ('00000000-0000-0000-0000-00000000000b', 'squat', 'view');
INSERT INTO user_exercise_preferences (user_id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');
INSERT INTO user_streaks (user_id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b')
  ON CONFLICT DO NOTHING;  -- the interaction trigger may already have made them
INSERT INTO exercise_badges (user_id, badge_type, badge_name) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'first', 'First'),
  ('00000000-0000-0000-0000-00000000000b', 'first', 'First');

-- 004 + 007, for both users
INSERT INTO plans (user_id, id, plan)
  SELECT u, 'plan_1', '{}' FROM unnest(ARRAY['00000000-0000-0000-0000-00000000000a',
                                             '00000000-0000-0000-0000-00000000000b']::uuid[]) AS u;
INSERT INTO workout_logs (user_id, id, plan_id, completed_at, log)
  SELECT u, 'log_1', 'plan_1', NOW(), '{}' FROM unnest(ARRAY['00000000-0000-0000-0000-00000000000a',
                                                            '00000000-0000-0000-0000-00000000000b']::uuid[]) AS u;
INSERT INTO personal_records (user_id, id, exercise_id, type, value, achieved_at, record)
  SELECT u, 'pr_1', 'squat', 'weight', 100, NOW(), '{}' FROM unnest(ARRAY['00000000-0000-0000-0000-00000000000a',
                                                                         '00000000-0000-0000-0000-00000000000b']::uuid[]) AS u;
INSERT INTO nutrition_days (user_id, day, log)
  SELECT u, CURRENT_DATE, '{}' FROM unnest(ARRAY['00000000-0000-0000-0000-00000000000a',
                                                '00000000-0000-0000-0000-00000000000b']::uuid[]) AS u;
INSERT INTO nutrition_settings (user_id)
  SELECT u FROM unnest(ARRAY['00000000-0000-0000-0000-00000000000a',
                             '00000000-0000-0000-0000-00000000000b']::uuid[]) AS u;
INSERT INTO body_measurements (user_id, id, measured_on, data)
  SELECT u, 'm_1', CURRENT_DATE, '{}' FROM unnest(ARRAY['00000000-0000-0000-0000-00000000000a',
                                                       '00000000-0000-0000-0000-00000000000b']::uuid[]) AS u;
INSERT INTO readiness_entries (user_id, day, entry)
  SELECT u, CURRENT_DATE, '{}' FROM unnest(ARRAY['00000000-0000-0000-0000-00000000000a',
                                                '00000000-0000-0000-0000-00000000000b']::uuid[]) AS u;
INSERT INTO user_state (user_id)
  SELECT u FROM unnest(ARRAY['00000000-0000-0000-0000-00000000000a',
                             '00000000-0000-0000-0000-00000000000b']::uuid[]) AS u;

-- Every single-column FK in public that points at a user, as (table, column).
CREATE TEMP VIEW user_fk_columns AS
  SELECT con.conrelid::regclass AS tbl, att.attname AS col, con.confdeltype AS on_delete
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
  WHERE con.contype = 'f'
    AND con.connamespace = 'public'::regnamespace
    AND con.confrelid IN ('auth.users'::regclass, 'public.profiles'::regclass);
GRANT SELECT ON user_fk_columns TO PUBLIC;

-- --------------------------------------------
-- 1. Coverage: A is in every user column
-- --------------------------------------------
DO $$
DECLARE
  r record;
  n bigint;
  missing text := '';
  total int := 0;
BEGIN
  FOR r IN SELECT * FROM user_fk_columns LOOP
    total := total + 1;
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', r.tbl, r.col)
      INTO n USING '00000000-0000-0000-0000-00000000000a'::uuid;
    IF n = 0 THEN
      missing := missing || format('%s.%s ', r.tbl, r.col);
    END IF;
  END LOOP;
  IF total < 22 THEN
    RAISE EXCEPTION 'expected at least 22 user FK columns after 001–008, found %', total;
  END IF;
  IF missing <> '' THEN
    RAISE EXCEPTION 'cascade check does not seed these user columns (add them above): %', missing;
  END IF;
  RAISE NOTICE 'ok: user A seeded in all % user-linked columns', total;
END
$$;

-- Snapshot B's footprint for the "B untouched" check.
CREATE TEMP TABLE b_before AS
  SELECT tbl::text AS tbl, col::text AS col, 0::bigint AS n FROM user_fk_columns;
DO $$
DECLARE
  r record;
  cnt bigint;
BEGIN
  FOR r IN SELECT * FROM b_before LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', r.tbl, r.col)
      INTO cnt USING '00000000-0000-0000-0000-00000000000b'::uuid;
    UPDATE b_before SET n = cnt WHERE tbl = r.tbl AND col = r.col;
  END LOOP;
END
$$;
-- One expected change: B's reaction to A's activity goes with that activity.
UPDATE b_before SET n = n - 1 WHERE tbl = 'activity_reactions' AND col = 'user_id';
GRANT SELECT ON b_before TO PUBLIC;

-- --------------------------------------------
-- 2. A signed-in client cannot delete auth.users rows
-- --------------------------------------------
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
DO $$
BEGIN
  BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
    RAISE EXCEPTION 'authenticated was able to delete from auth.users';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RAISE NOTICE 'ok: a client cannot delete auth.users directly (only the Edge Function can)';
END
$$;
RESET ROLE;
RESET request.jwt.claim.sub;

-- --------------------------------------------
-- 3. Delete as a GoTrue-like role with no rights in public
-- --------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fw_auth_admin_stub') THEN
    CREATE ROLE fw_auth_admin_stub NOLOGIN NOINHERIT;
  END IF;
END
$$;
GRANT USAGE ON SCHEMA auth TO fw_auth_admin_stub;
GRANT SELECT, DELETE ON auth.users TO fw_auth_admin_stub;

SET ROLE fw_auth_admin_stub;
DO $$
DECLARE
  n int;
BEGIN
  DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-00000000000a';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'expected to delete 1 auth.users row, deleted %', n;
  END IF;
  RAISE NOTICE 'ok: auth.users delete succeeds for a role with no grants on public tables';
END
$$;
RESET ROLE;

-- --------------------------------------------
-- 4. Nothing points at A; shared rows survive; B untouched
-- --------------------------------------------
DO $$
DECLARE
  r record;
  n bigint;
  bad text := '';
BEGIN
  FOR r IN SELECT * FROM user_fk_columns LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', r.tbl, r.col)
      INTO n USING '00000000-0000-0000-0000-00000000000a'::uuid;
    IF n <> 0 THEN
      bad := bad || format('%s.%s=%s ', r.tbl, r.col, n);
    END IF;
  END LOOP;
  IF bad <> '' THEN
    RAISE EXCEPTION 'rows still point at deleted user A: %', bad;
  END IF;

  -- B's footprint is unchanged in every user column (apart from the one
  -- reaction on A's activity, adjusted in b_before).
  bad := '';
  FOR r IN SELECT * FROM b_before LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', r.tbl, r.col)
      INTO n USING '00000000-0000-0000-0000-00000000000b'::uuid;
    IF n <> r.n THEN
      bad := bad || format('%s.%s %s->%s ', r.tbl, r.col, r.n, n);
    END IF;
  END LOOP;
  IF bad <> '' THEN
    RAISE EXCEPTION 'deleting A changed B''s rows: %', bad;
  END IF;

  -- Circle A survives without a creator, and B is still in it (SET NULL, Day 2 decision).
  IF NOT EXISTS (SELECT 1 FROM circles WHERE id = 'c0000000-0000-0000-0000-0000000000ca' AND created_by IS NULL) THEN
    RAISE EXCEPTION 'circle CA should survive with created_by = NULL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM circle_members WHERE circle_id = 'c0000000-0000-0000-0000-0000000000ca'
                 AND user_id = '00000000-0000-0000-0000-00000000000b') THEN
    RAISE EXCEPTION 'B lost membership of CA';
  END IF;
  -- A's challenge survives without a creator; B's challenge loses its winner.
  IF NOT EXISTS (SELECT 1 FROM circle_challenges WHERE id = 'd0000000-0000-0000-0000-0000000000ca' AND created_by IS NULL) THEN
    RAISE EXCEPTION 'A''s challenge should survive with created_by = NULL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM circle_challenges WHERE id = 'd0000000-0000-0000-0000-0000000000cb'
                 AND winner_id IS NULL AND created_by = '00000000-0000-0000-0000-00000000000b') THEN
    RAISE EXCEPTION 'B''s challenge should survive with winner_id = NULL';
  END IF;
  -- A's activity is gone, and with it B's reaction to it; B's activity stays.
  IF EXISTS (SELECT 1 FROM circle_activities WHERE id = 'a0000000-0000-0000-0000-00000000000a') THEN
    RAISE EXCEPTION 'A''s activity survived';
  END IF;
  IF EXISTS (SELECT 1 FROM activity_reactions WHERE activity_id = 'a0000000-0000-0000-0000-00000000000a') THEN
    RAISE EXCEPTION 'reactions on A''s deleted activity survived';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM circle_activities WHERE id = 'a0000000-0000-0000-0000-00000000000b') THEN
    RAISE EXCEPTION 'B''s activity was removed';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-00000000000a') THEN
    RAISE EXCEPTION 'A''s profile survived';
  END IF;

  RAISE NOTICE 'ok: no row points at A; shared circles and challenges survive with A nulled; B is untouched';
END
$$;

-- B's rows are still readable by B under RLS (the cascade didn't break B's access).
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
DO $$
BEGIN
  IF (SELECT count(*) FROM workout_logs) <> 1 OR (SELECT count(*) FROM plans) <> 1
     OR (SELECT count(*) FROM circles) <> 2 THEN
    RAISE EXCEPTION 'B cannot read their own rows after A was deleted';
  END IF;
  RAISE NOTICE 'ok: B still reads their own logs, plans and both circles';
END
$$;
RESET ROLE;
RESET request.jwt.claim.sub;
