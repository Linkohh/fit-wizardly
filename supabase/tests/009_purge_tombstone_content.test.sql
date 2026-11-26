-- ============================================
-- Tests for 009_purge_tombstone_content.sql (DEBT-097)
-- ============================================
-- Run by supabase/tests/run.sh in a throwaway copy of the migrated database.
-- Each check raises an exception on failure, which makes psql exit non-zero.
--
-- For each of the eight synced tables (plans + the seven from 007), as the
-- signed-in owner, replaying the sync engine's write shapes:
--   1. a live row keeps its content (the trigger only acts on tombstones)
--   2. UPDATE ... SET deleted_at (the engine's delete): content is wiped,
--      key, deleted_at and updated_at survive, updated_at moves on
--   3. revive: upsert with full content and deleted_at NULL restores it
--   4. upsert that carries deleted_at, update path (row exists): wiped
--   5. upsert that carries deleted_at, insert path (new key): wiped
--   6. revive after that works again
--   7. another user can't read, update, tombstone, revive or upsert onto
--      the owner's row, and the owner's row is unchanged afterwards
-- Plus a catalog guard: every column of every synced table is either kept
-- or cleared, so a new content column fails here until 009 covers it.

\set ON_ERROR_STOP 1
SET client_min_messages = notice;

-- --------------------------------------------
-- Fixtures (as superuser)
-- --------------------------------------------
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');

CREATE SCHEMA tests;
GRANT USAGE ON SCHEMA tests TO authenticated;

-- One row per synced table:
--   key_cols   the columns after user_id that identify a row
--   kept_cols  every column the trigger must leave alone
--   full_row   a live row with real-looking content (user_id added at run time)
--   other_key  a second key for the insert-path tombstone
--   wiped      what the cleared columns must hold on a tombstone
CREATE TABLE tests.spec (
  tbl text PRIMARY KEY,
  key_cols text[] NOT NULL,
  kept_cols text[] NOT NULL,
  full_row jsonb NOT NULL,
  other_key jsonb NOT NULL,
  wiped jsonb NOT NULL
);
GRANT SELECT ON tests.spec TO authenticated;

INSERT INTO tests.spec VALUES
('plans', '{id}', '{user_id,id,created_at,updated_at,deleted_at}',
 '{"id":"plan_1","plan":{"id":"plan_1","name":"Push Pull Legs"},"schema_version":2}',
 '{"id":"plan_2"}',
 '{"plan":{},"schema_version":1}'),
('workout_logs', '{id}', '{user_id,id,updated_at,deleted_at}',
 '{"id":"log_1","plan_id":"plan_1","completed_at":"2026-11-20T10:00:00+00:00","total_volume":12345,"log":{"id":"log_1","notes":"felt strong"},"schema_version":1}',
 '{"id":"log_2"}',
 '{"plan_id":"","completed_at":"1970-01-01T00:00:00+00:00","total_volume":0,"log":{},"schema_version":1}'),
('personal_records', '{id}', '{user_id,id,updated_at,deleted_at}',
 '{"id":"pr_1","exercise_id":"bench_press","type":"reps","value":120,"achieved_at":"2026-11-20T10:00:00+00:00","record":{"id":"pr_1","newValue":120}}',
 '{"id":"pr_2"}',
 '{"exercise_id":"","type":"weight","value":0,"achieved_at":"1970-01-01T00:00:00+00:00","record":{}}'),
('nutrition_days', '{day}', '{user_id,day,updated_at,deleted_at}',
 '{"day":"2026-11-20","log":{"meals":[{"name":"oats","kcal":400}]}}',
 '{"day":"2026-11-21"}',
 '{"log":{}}'),
('nutrition_settings', '{}', '{user_id,updated_at,deleted_at}',
 '{"profile":{"weightKg":80},"targets":{"kcal":2500},"custom_foods":[{"name":"shake"}],"favorites":["oats"],"saved_meals":[{"name":"breakfast"}]}',
 '{}',
 '{"profile":null,"targets":null,"custom_foods":[],"favorites":[],"saved_meals":[]}'),
('body_measurements', '{id}', '{user_id,id,updated_at,deleted_at}',
 '{"id":"m_1","measured_on":"2026-11-20","data":{"weightKg":80,"waistCm":84}}',
 '{"id":"m_2"}',
 '{"measured_on":"1970-01-01","data":{}}'),
('readiness_entries', '{day}', '{user_id,day,updated_at,deleted_at}',
 '{"day":"2026-11-20","entry":{"sleep":7,"soreness":2}}',
 '{"day":"2026-11-21"}',
 '{"entry":{}}'),
('user_state', '{}', '{user_id,updated_at,deleted_at}',
 '{"achievements":{"first_workout":"2026-11-01"},"custom_exercises":[{"id":"cx_1"}],"favorite_exercises":["bench_press"]}',
 '{}',
 '{"achievements":{},"custom_exercises":[],"favorite_exercises":[]}');

-- The content columns (everything not kept) of one row, as jsonb.
CREATE FUNCTION tests.content(p_tbl text, p_user uuid, p_key jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  s tests.spec%ROWTYPE;
  result jsonb;
  k text;
  cond text := format('user_id = %L', p_user);
BEGIN
  SELECT * INTO s FROM tests.spec WHERE tbl = p_tbl;
  FOREACH k IN ARRAY s.key_cols LOOP
    cond := cond || format(' AND %I::text = %L', k, p_key->>k);
  END LOOP;
  EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE %s', p_tbl, cond) INTO result;
  IF result IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN result - s.kept_cols;
END $$;

-- The whole row, as jsonb.
CREATE FUNCTION tests.row_of(p_tbl text, p_user uuid, p_key jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  s tests.spec%ROWTYPE;
  result jsonb;
  k text;
  cond text := format('user_id = %L', p_user);
BEGIN
  SELECT * INTO s FROM tests.spec WHERE tbl = p_tbl;
  FOREACH k IN ARRAY s.key_cols LOOP
    cond := cond || format(' AND %I::text = %L', k, p_key->>k);
  END LOOP;
  EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE %s', p_tbl, cond) INTO result;
  RETURN result;
END $$;

-- The engine's push: supabase-js upsert, i.e. INSERT ... ON CONFLICT DO UPDATE
-- SET every sent column = EXCLUDED. p_row holds the columns sent.
CREATE FUNCTION tests.upsert(p_tbl text, p_row jsonb) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  s tests.spec%ROWTYPE;
  cols text;
  sets text;
  conflict text;
BEGIN
  SELECT * INTO s FROM tests.spec WHERE tbl = p_tbl;
  SELECT string_agg(format('%I', c), ', ') INTO cols FROM jsonb_object_keys(p_row) c;
  SELECT string_agg(format('%1$I = EXCLUDED.%1$I', c), ', ') INTO sets
    FROM jsonb_object_keys(p_row) c
    WHERE c <> 'user_id' AND NOT (c = ANY (s.key_cols));
  conflict := array_to_string(ARRAY['user_id'] || s.key_cols, ', ');
  EXECUTE format(
    'INSERT INTO %1$I (%2$s) SELECT %2$s FROM jsonb_populate_record(NULL::%1$I, $1) '
    'ON CONFLICT (%3$s) DO UPDATE SET %4$s',
    p_tbl, cols, conflict, sets) USING p_row;
END $$;

-- The engine's delete: UPDATE <table> SET deleted_at WHERE user_id [AND key].
CREATE FUNCTION tests.tombstone(p_tbl text, p_user uuid, p_key jsonb, p_at timestamptz) RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE
  s tests.spec%ROWTYPE;
  k text;
  cond text := format('user_id = %L', p_user);
  n bigint;
BEGIN
  SELECT * INTO s FROM tests.spec WHERE tbl = p_tbl;
  FOREACH k IN ARRAY s.key_cols LOOP
    cond := cond || format(' AND %I::text = %L', k, p_key->>k);
  END LOOP;
  EXECUTE format('UPDATE %I SET deleted_at = $1 WHERE %s', p_tbl, cond) USING p_at;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- The full row's key, as jsonb (empty for one-row-per-user tables).
CREATE FUNCTION tests.key_of(p_tbl text) RETURNS jsonb
LANGUAGE sql AS $$
  SELECT COALESCE(jsonb_object_agg(k, s.full_row->k), '{}'::jsonb)
  FROM tests.spec s, unnest(s.key_cols) k WHERE s.tbl = p_tbl
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO authenticated;

-- --------------------------------------------
-- 0. Catalog guard: kept + cleared = every column
-- --------------------------------------------
DO $$
DECLARE
  s tests.spec%ROWTYPE;
  actual text[];
  expected text[];
  trigger_count int;
BEGIN
  FOR s IN SELECT * FROM tests.spec ORDER BY tbl LOOP
    SELECT array_agg(column_name::text ORDER BY column_name::text) INTO actual
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = s.tbl;

    SELECT array_agg(c ORDER BY c) INTO expected
    FROM (SELECT unnest(s.kept_cols) AS c UNION SELECT jsonb_object_keys(s.wiped)) x;

    IF actual IS DISTINCT FROM expected THEN
      RAISE EXCEPTION '%: columns % but kept + cleared covers % (add the new column to 009 and this spec)',
        s.tbl, actual, expected;
    END IF;

    SELECT count(*) INTO trigger_count
    FROM pg_trigger tg JOIN pg_proc p ON p.oid = tg.tgfoid
    WHERE tg.tgrelid = ('public.' || s.tbl)::regclass
      AND p.proname = 'purge_tombstone_content' AND NOT tg.tgisinternal;
    IF trigger_count <> 1 THEN
      RAISE EXCEPTION '%: expected 1 purge_tombstone_content trigger, found %', s.tbl, trigger_count;
    END IF;
  END LOOP;
  RAISE NOTICE 'ok: every column of the 8 synced tables is kept or cleared, and each has the trigger';
END
$$;

SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

-- --------------------------------------------
-- 1. Live rows keep their content
-- --------------------------------------------
DO $$
DECLARE
  s tests.spec%ROWTYPE;
  got jsonb;
BEGIN
  FOR s IN SELECT * FROM tests.spec ORDER BY tbl LOOP
    PERFORM tests.upsert(s.tbl, s.full_row || jsonb_build_object('user_id', auth.uid(), 'deleted_at', NULL));
    got := tests.content(s.tbl, auth.uid(), tests.key_of(s.tbl));
    IF got IS DISTINCT FROM (s.full_row - s.kept_cols) THEN
      RAISE EXCEPTION '%: a live row lost content: got %', s.tbl, got;
    END IF;
  END LOOP;
  RAISE NOTICE 'ok: live rows keep their content in all 8 tables';
END
$$;

-- Snapshot updated_at so step 2 can check it moves (separate transaction, so
-- NOW() in set_updated_at() is later in the next statement).
RESET ROLE;
CREATE TABLE tests.before_tombstone AS
  SELECT s.tbl, (tests.row_of(s.tbl, '00000000-0000-0000-0000-00000000000a', tests.key_of(s.tbl))->>'updated_at')::timestamptz AS updated_at
  FROM tests.spec s;
GRANT SELECT ON tests.before_tombstone TO authenticated;
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

-- --------------------------------------------
-- 2. UPDATE-style delete wipes content, keeps key/deleted_at/updated_at
-- --------------------------------------------
DO $$
DECLARE
  s tests.spec%ROWTYPE;
  r jsonb;
  k text;
  n bigint;
BEGIN
  FOR s IN SELECT * FROM tests.spec ORDER BY tbl LOOP
    n := tests.tombstone(s.tbl, auth.uid(), tests.key_of(s.tbl), '2026-11-22T10:00:00Z');
    IF n <> 1 THEN
      RAISE EXCEPTION '%: UPDATE-style delete touched % rows, expected 1', s.tbl, n;
    END IF;

    r := tests.row_of(s.tbl, auth.uid(), tests.key_of(s.tbl));
    IF (r - s.kept_cols) IS DISTINCT FROM s.wiped THEN
      RAISE EXCEPTION '%: UPDATE tombstone kept content: got %, expected %', s.tbl, r - s.kept_cols, s.wiped;
    END IF;
    IF (r->>'user_id')::uuid IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION '%: user_id did not survive the tombstone', s.tbl;
    END IF;
    FOREACH k IN ARRAY s.key_cols LOOP
      IF r->>k IS DISTINCT FROM s.full_row->>k THEN
        RAISE EXCEPTION '%: key % did not survive the tombstone (got %)', s.tbl, k, r->>k;
      END IF;
    END LOOP;
    IF (r->>'deleted_at')::timestamptz IS DISTINCT FROM '2026-11-22T10:00:00Z' THEN
      RAISE EXCEPTION '%: deleted_at did not survive (got %)', s.tbl, r->>'deleted_at';
    END IF;
    IF (r->>'updated_at')::timestamptz <= (SELECT updated_at FROM tests.before_tombstone b WHERE b.tbl = s.tbl) THEN
      RAISE EXCEPTION '%: updated_at did not move, so a pull cursor would miss the tombstone', s.tbl;
    END IF;
  END LOOP;
  RAISE NOTICE 'ok: UPDATE ... SET deleted_at wipes content in all 8 tables; key, user_id, deleted_at survive; updated_at moves';
END
$$;

-- plans.created_at is deliberately kept: check it really is.
DO $$
BEGIN
  IF (SELECT created_at FROM plans WHERE user_id = auth.uid() AND id = 'plan_1') IS NULL THEN
    RAISE EXCEPTION 'plans: created_at was lost on the tombstone';
  END IF;
  RAISE NOTICE 'ok: plans.created_at is kept on a tombstone';
END
$$;

-- --------------------------------------------
-- 3. Revive with full content
-- --------------------------------------------
DO $$
DECLARE
  s tests.spec%ROWTYPE;
  r jsonb;
BEGIN
  FOR s IN SELECT * FROM tests.spec ORDER BY tbl LOOP
    PERFORM tests.upsert(s.tbl, s.full_row || jsonb_build_object('user_id', auth.uid(), 'deleted_at', NULL));
    r := tests.row_of(s.tbl, auth.uid(), tests.key_of(s.tbl));
    IF r->'deleted_at' <> 'null'::jsonb THEN
      RAISE EXCEPTION '%: revive left deleted_at = %', s.tbl, r->'deleted_at';
    END IF;
    IF (r - s.kept_cols) IS DISTINCT FROM (s.full_row - s.kept_cols) THEN
      RAISE EXCEPTION '%: revive did not restore content: got %', s.tbl, r - s.kept_cols;
    END IF;
  END LOOP;
  RAISE NOTICE 'ok: a revive (upsert with full content, deleted_at null) restores all 8 tables';
END
$$;

-- --------------------------------------------
-- 4–6. Upsert that carries deleted_at (update and insert paths), then revive
-- --------------------------------------------
DO $$
DECLARE
  s tests.spec%ROWTYPE;
  r jsonb;
  other jsonb;
BEGIN
  FOR s IN SELECT * FROM tests.spec ORDER BY tbl LOOP
    -- 4. Update path: the row exists and is live.
    PERFORM tests.upsert(s.tbl, s.full_row || jsonb_build_object('user_id', auth.uid(), 'deleted_at', '2026-11-23T10:00:00Z'));
    r := tests.row_of(s.tbl, auth.uid(), tests.key_of(s.tbl));
    IF (r - s.kept_cols) IS DISTINCT FROM s.wiped THEN
      RAISE EXCEPTION '%: upsert tombstone (update path) kept content: got %', s.tbl, r - s.kept_cols;
    END IF;
    IF (r->>'deleted_at')::timestamptz IS DISTINCT FROM '2026-11-23T10:00:00Z' THEN
      RAISE EXCEPTION '%: upsert tombstone (update path) lost deleted_at', s.tbl;
    END IF;

    -- 5. Insert path: a key the cloud has never seen. One-row-per-user tables
    --    have no second key, so they are covered by the update path only.
    IF array_length(s.key_cols, 1) IS NOT NULL THEN
      other := s.full_row || s.other_key;
      PERFORM tests.upsert(s.tbl, other || jsonb_build_object('user_id', auth.uid(), 'deleted_at', '2026-11-23T11:00:00Z'));
      r := tests.row_of(s.tbl, auth.uid(), s.other_key);
      IF r IS NULL THEN
        RAISE EXCEPTION '%: upsert tombstone (insert path) stored no row', s.tbl;
      END IF;
      IF (r - s.kept_cols) IS DISTINCT FROM s.wiped THEN
        RAISE EXCEPTION '%: upsert tombstone (insert path) kept content: got %', s.tbl, r - s.kept_cols;
      END IF;
      IF (r->>'deleted_at')::timestamptz IS DISTINCT FROM '2026-11-23T11:00:00Z' THEN
        RAISE EXCEPTION '%: upsert tombstone (insert path) lost deleted_at', s.tbl;
      END IF;
    END IF;

    -- 6. Revive again.
    PERFORM tests.upsert(s.tbl, s.full_row || jsonb_build_object('user_id', auth.uid(), 'deleted_at', NULL));
    r := tests.row_of(s.tbl, auth.uid(), tests.key_of(s.tbl));
    IF (r - s.kept_cols) IS DISTINCT FROM (s.full_row - s.kept_cols) OR r->'deleted_at' <> 'null'::jsonb THEN
      RAISE EXCEPTION '%: second revive did not restore content: got %', s.tbl, r;
    END IF;
  END LOOP;
  RAISE NOTICE 'ok: upserts carrying deleted_at (update and insert paths) wipe content, and a revive restores it';
END
$$;

-- Leave A with one tombstone per table for the cross-user checks.
DO $$
DECLARE
  s tests.spec%ROWTYPE;
BEGIN
  FOR s IN SELECT * FROM tests.spec LOOP
    PERFORM tests.tombstone(s.tbl, auth.uid(), tests.key_of(s.tbl), '2026-11-24T10:00:00Z');
  END LOOP;
END
$$;

RESET ROLE;
CREATE TABLE tests.a_snapshot AS
  SELECT s.tbl, tests.row_of(s.tbl, '00000000-0000-0000-0000-00000000000a', tests.key_of(s.tbl)) AS r
  FROM tests.spec s;

-- --------------------------------------------
-- 7. Another user can't touch A's rows
-- --------------------------------------------
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

DO $$
DECLARE
  s tests.spec%ROWTYPE;
  a uuid := '00000000-0000-0000-0000-00000000000a';
  n bigint;
BEGIN
  FOR s IN SELECT * FROM tests.spec ORDER BY tbl LOOP
    IF tests.row_of(s.tbl, a, tests.key_of(s.tbl)) IS NOT NULL THEN
      RAISE EXCEPTION '%: B can read A''s tombstone', s.tbl;
    END IF;

    n := tests.tombstone(s.tbl, a, tests.key_of(s.tbl), '2026-11-25T10:00:00Z');
    IF n <> 0 THEN
      RAISE EXCEPTION '%: B tombstoned % of A''s rows', s.tbl, n;
    END IF;
    EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE user_id = $1', s.tbl) USING a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN
      RAISE EXCEPTION '%: B revived % of A''s rows', s.tbl, n;
    END IF;

    BEGIN
      PERFORM tests.upsert(s.tbl, s.full_row || jsonb_build_object('user_id', a, 'deleted_at', NULL));
      RAISE EXCEPTION '%: B upserted onto A''s row', s.tbl;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL; -- expected: new row violates row-level security policy
    END;
  END LOOP;
  RAISE NOTICE 'ok: B cannot read, tombstone, revive or upsert onto A''s rows in all 8 tables';
END
$$;

RESET ROLE;
DO $$
DECLARE
  snap record;
BEGIN
  FOR snap IN SELECT * FROM tests.a_snapshot ORDER BY tbl LOOP
    IF tests.row_of(snap.tbl, '00000000-0000-0000-0000-00000000000a', tests.key_of(snap.tbl)) IS DISTINCT FROM snap.r THEN
      RAISE EXCEPTION '%: A''s row changed after B''s attempts', snap.tbl;
    END IF;
  END LOOP;
  RAISE NOTICE 'ok: A''s rows are unchanged by B';
END
$$;
