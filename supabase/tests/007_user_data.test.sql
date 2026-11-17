-- ============================================
-- Tests for 007_user_data.sql (contract #3)
-- ============================================
-- Run by supabase/tests/run.sh in a throwaway copy of the migrated database.
-- Each check raises an exception on failure, which makes psql exit non-zero.
--
-- Covers, for all seven new tables plus plans:
--   * structure: RLS on, four owner-only policies, cascade FK, indexes,
--     plans.deleted_at, updated_at trigger
--   * user A can insert, select, update and delete their own rows
--   * user A cannot write rows owned by someone else
--   * user B cannot see, change or delete A's rows, or hand a row to A
--   * anon can't select or insert anything
--   * deleting A from auth.users removes all of A's rows (and none of B's)

\set ON_ERROR_STOP 1
SET client_min_messages = notice;

-- --------------------------------------------
-- Fixtures (as superuser)
-- --------------------------------------------
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');

CREATE SCHEMA tests;
GRANT USAGE ON SCHEMA tests TO anon, authenticated;

CREATE FUNCTION tests.user_a() RETURNS uuid LANGUAGE sql IMMUTABLE
  AS $$ SELECT '00000000-0000-0000-0000-00000000000a'::uuid $$;
CREATE FUNCTION tests.user_b() RETURNS uuid LANGUAGE sql IMMUTABLE
  AS $$ SELECT '00000000-0000-0000-0000-00000000000b'::uuid $$;

CREATE FUNCTION tests.new_tables() RETURNS text[] LANGUAGE sql IMMUTABLE
  AS $$ SELECT ARRAY['workout_logs','personal_records','nutrition_days',
                     'nutrition_settings','body_measurements',
                     'readiness_entries','user_state'] $$;

CREATE FUNCTION tests.all_tables() RETURNS text[] LANGUAGE sql IMMUTABLE
  AS $$ SELECT tests.new_tables() || ARRAY['plans'] $$;

-- Inserts one sample row owned by p_owner. updated_at is backdated so the
-- update test can prove the trigger moved it. SECURITY INVOKER: RLS applies.
CREATE FUNCTION tests.insert_sample(p_table text, p_owner uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CASE p_table
    WHEN 'plans' THEN
      INSERT INTO plans (user_id, id, plan, updated_at)
      VALUES (p_owner, 'plan_1', '{"name":"Test"}', '2000-01-01');
    WHEN 'workout_logs' THEN
      INSERT INTO workout_logs (user_id, id, plan_id, completed_at, total_volume, log, updated_at)
      VALUES (p_owner, 'log_1', 'plan_1', NOW(), 1200, '{"sets":[]}', '2000-01-01');
    WHEN 'personal_records' THEN
      INSERT INTO personal_records (user_id, id, exercise_id, type, value, achieved_at, record, updated_at)
      VALUES (p_owner, 'pr_1', 'bench_press', 'weight', 100, NOW(), '{}', '2000-01-01');
    WHEN 'nutrition_days' THEN
      INSERT INTO nutrition_days (user_id, day, log, updated_at)
      VALUES (p_owner, '2026-11-17', '{"meals":[]}', '2000-01-01');
    WHEN 'nutrition_settings' THEN
      INSERT INTO nutrition_settings (user_id, profile, targets, updated_at)
      VALUES (p_owner, '{}', '{"calories":2000}', '2000-01-01');
    WHEN 'body_measurements' THEN
      INSERT INTO body_measurements (user_id, id, measured_on, data, updated_at)
      VALUES (p_owner, 'bm_1', '2026-11-17', '{"weightKg":80}', '2000-01-01');
    WHEN 'readiness_entries' THEN
      INSERT INTO readiness_entries (user_id, day, entry, updated_at)
      VALUES (p_owner, '2026-11-17', '{"score":7}', '2000-01-01');
    WHEN 'user_state' THEN
      INSERT INTO user_state (user_id, updated_at)
      VALUES (p_owner, '2000-01-01');
    ELSE
      RAISE EXCEPTION 'insert_sample: unknown table %', p_table;
  END CASE;
END;
$$;

CREATE FUNCTION tests.visible_rows(p_table text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %I', p_table) INTO n;
  RETURN n;
END;
$$;

CREATE FUNCTION tests.soft_delete(p_table text, p_owner uuid) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE user_id = $1', p_table) USING p_owner;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE FUNCTION tests.hard_delete(p_table text, p_owner uuid) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('DELETE FROM %I WHERE user_id = $1', p_table) USING p_owner;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- Moves every row p_from owns to p_to. Used to prove WITH CHECK on UPDATE.
CREATE FUNCTION tests.reassign(p_table text, p_from uuid, p_to uuid) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('UPDATE %I SET user_id = $2 WHERE user_id = $1', p_table) USING p_from, p_to;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE FUNCTION tests.oldest_updated_at(p_table text, p_owner uuid) RETURNS timestamptz LANGUAGE plpgsql AS $$
DECLARE ts timestamptz;
BEGIN
  EXECUTE format('SELECT min(updated_at) FROM %I WHERE user_id = $1', p_table) INTO ts USING p_owner;
  RETURN ts;
END;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO anon, authenticated;

-- --------------------------------------------
-- 1. Structure
-- --------------------------------------------
DO $$
DECLARE
  t text;
  n int;
  cmds text[];
BEGIN
  FOREACH t IN ARRAY tests.all_tables() LOOP
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = format('public.%I', t)::regclass) THEN
      RAISE EXCEPTION '%: RLS is not enabled', t;
    END IF;

    SELECT count(*) INTO n
    FROM pg_constraint
    WHERE conrelid = format('public.%I', t)::regclass
      AND contype = 'f'
      AND confrelid = 'auth.users'::regclass
      AND confdeltype = 'c';
    IF n <> 1 THEN
      RAISE EXCEPTION '%: expected 1 ON DELETE CASCADE FK to auth.users, found %', t, n;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t
        AND column_name = 'deleted_at' AND is_nullable = 'YES'
        AND data_type = 'timestamp with time zone'
    ) THEN
      RAISE EXCEPTION '%: missing nullable deleted_at timestamptz', t;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = t
        AND indexdef LIKE '%(user_id, updated_at)%'
    ) THEN
      RAISE EXCEPTION '%: missing (user_id, updated_at) index', t;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = format('public.%I', t)::regclass
        AND tgfoid = 'public.set_updated_at()'::regprocedure
        AND NOT tgisinternal
    ) THEN
      RAISE EXCEPTION '%: missing set_updated_at trigger', t;
    END IF;
  END LOOP;

  FOREACH t IN ARRAY tests.new_tables() LOOP
    SELECT array_agg(cmd ORDER BY cmd) INTO cmds
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = t;
    IF cmds IS DISTINCT FROM ARRAY['DELETE','INSERT','SELECT','UPDATE']::text[] THEN
      RAISE EXCEPTION '%: expected exactly one policy per command, found %', t, cmds;
    END IF;

    SELECT count(*) INTO n
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = t
      AND coalesce(qual, '') NOT IN ('', '(auth.uid() = user_id)')
       OR (schemaname = 'public' AND tablename = t
           AND coalesce(with_check, '') NOT IN ('', '(auth.uid() = user_id)'));
    IF n <> 0 THEN
      RAISE EXCEPTION '%: % policies are not plain owner-only checks', t, n;
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'workout_logs'
                 AND indexdef LIKE '%(user_id, completed_at DESC)%') THEN
    RAISE EXCEPTION 'workout_logs: missing (user_id, completed_at DESC) index';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'personal_records'
                 AND indexdef LIKE '%(user_id, exercise_id)%') THEN
    RAISE EXCEPTION 'personal_records: missing (user_id, exercise_id) index';
  END IF;

  RAISE NOTICE 'ok: structure (RLS, policies, cascade FKs, indexes, triggers, deleted_at)';
END
$$;

-- --------------------------------------------
-- 2. User A: full CRUD on own rows
-- --------------------------------------------
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY tests.all_tables() LOOP
    PERFORM tests.insert_sample(t, tests.user_a());
    IF tests.visible_rows(t) <> 1 THEN
      RAISE EXCEPTION '%: A cannot see own inserted row', t;
    END IF;

    IF tests.soft_delete(t, tests.user_a()) <> 1 THEN
      RAISE EXCEPTION '%: A cannot update own row', t;
    END IF;
    IF tests.oldest_updated_at(t, tests.user_a()) < '2001-01-01' THEN
      RAISE EXCEPTION '%: updated_at trigger did not fire', t;
    END IF;

    IF tests.hard_delete(t, tests.user_a()) <> 1 THEN
      RAISE EXCEPTION '%: A cannot delete own row', t;
    END IF;
    IF tests.visible_rows(t) <> 0 THEN
      RAISE EXCEPTION '%: row still visible after delete', t;
    END IF;

    -- Re-create for the isolation and cascade checks below.
    PERFORM tests.insert_sample(t, tests.user_a());
  END LOOP;
  RAISE NOTICE 'ok: A can insert, select, update and delete own rows in every table';
END
$$;

-- A cannot create rows owned by B.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY tests.all_tables() LOOP
    BEGIN
      PERFORM tests.insert_sample(t, tests.user_b());
      RAISE EXCEPTION '%: A inserted a row owned by B', t;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL; -- expected: new row violates row-level security policy
    END;
  END LOOP;
  RAISE NOTICE 'ok: A cannot insert rows for another user';
END
$$;

-- personal_records.type CHECK constraint.
DO $$
BEGIN
  INSERT INTO personal_records (user_id, id, exercise_id, type, value, achieved_at, record)
  VALUES (tests.user_a(), 'pr_bad', 'squat', 'speed', 1, NOW(), '{}');
  RAISE EXCEPTION 'personal_records accepted type = speed';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'ok: personal_records.type rejects unknown values';
END
$$;

-- --------------------------------------------
-- 3. User B: cannot see or change A's rows
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY tests.all_tables() LOOP
    IF tests.visible_rows(t) <> 0 THEN
      RAISE EXCEPTION '%: B can see A''s rows', t;
    END IF;
    IF tests.soft_delete(t, tests.user_a()) <> 0 THEN
      RAISE EXCEPTION '%: B updated A''s rows', t;
    END IF;
    IF tests.hard_delete(t, tests.user_a()) <> 0 THEN
      RAISE EXCEPTION '%: B deleted A''s rows', t;
    END IF;

    -- B's own row, which B must not be able to hand over to A.
    PERFORM tests.insert_sample(t, tests.user_b());
    BEGIN
      PERFORM tests.reassign(t, tests.user_b(), tests.user_a());
      RAISE EXCEPTION '%: B reassigned own row to A', t;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL; -- expected: UPDATE ... WITH CHECK runs before the unique index
    END;
  END LOOP;
  RAISE NOTICE 'ok: B cannot see, update, delete or take over A''s rows';
END
$$;

-- --------------------------------------------
-- 4. anon: nothing
-- --------------------------------------------
RESET ROLE;
RESET request.jwt.claim.sub;
SET ROLE anon;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY tests.all_tables() LOOP
    IF tests.visible_rows(t) <> 0 THEN
      RAISE EXCEPTION '%: anon can see rows', t;
    END IF;
    BEGIN
      PERFORM tests.insert_sample(t, tests.user_a());
      RAISE EXCEPTION '%: anon inserted a row', t;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END LOOP;
  RAISE NOTICE 'ok: anon cannot select or insert';
END
$$;

-- --------------------------------------------
-- 5. Deleting A from auth.users cascades
-- --------------------------------------------
RESET ROLE;

DO $$
DECLARE
  t text;
  n bigint;
BEGIN
  FOREACH t IN ARRAY tests.all_tables() LOOP
    EXECUTE format('SELECT count(*) FROM %I WHERE user_id = $1', t) INTO n USING tests.user_a();
    IF n <> 1 THEN
      RAISE EXCEPTION '%: expected 1 row for A before cascade, found %', t, n;
    END IF;
  END LOOP;

  DELETE FROM auth.users WHERE id = tests.user_a();

  FOREACH t IN ARRAY tests.all_tables() LOOP
    EXECUTE format('SELECT count(*) FROM %I WHERE user_id = $1', t) INTO n USING tests.user_a();
    IF n <> 0 THEN
      RAISE EXCEPTION '%: % rows for A survived account deletion', t, n;
    END IF;
    EXECUTE format('SELECT count(*) FROM %I WHERE user_id = $1', t) INTO n USING tests.user_b();
    IF n <> 1 THEN
      RAISE EXCEPTION '%: B''s rows were affected by deleting A (found %)', t, n;
    END IF;
  END LOOP;
  RAISE NOTICE 'ok: deleting A from auth.users removes all of A''s rows and none of B''s';
END
$$;
