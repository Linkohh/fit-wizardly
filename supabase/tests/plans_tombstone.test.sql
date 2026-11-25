-- ============================================
-- Plans tombstones under RLS (Lane E Day 7, #81)
-- ============================================
-- Run by supabase/tests/run.sh in a throwaway copy of the migrated database.
--
-- Plans sync through the engine (plansCollection, src/lib/sync/collections/
-- training.ts). The two write shapes it sends are replayed here exactly:
--   * push:   INSERT ... ON CONFLICT (user_id, id) DO UPDATE   (supabase-js upsert,
--             onConflict 'user_id,id'), including a row that carries deleted_at
--   * delete: UPDATE plans SET deleted_at = $at WHERE user_id = $me AND id = $key
-- and the pull: SELECT * WHERE user_id = $me AND updated_at >= $cursor.
--
-- Checks:
--   1. the owner can upsert a tombstone (insert path and update path), read it
--      back through the pull query, and revive it with a later upsert
--   2. the owner's UPDATE-style delete works and moves updated_at
--   3. another user can't read the tombstone, can't upsert onto it (as either
--      owner id), and can't tombstone or revive it with UPDATE

\set ON_ERROR_STOP 1
SET client_min_messages = notice;

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');

SET ROLE authenticated;

-- --------------------------------------------
-- 1. Owner: upsert a tombstone, read it back, revive it
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

DO $$
DECLARE
  r plans%ROWTYPE;
BEGIN
  -- Insert path of the upsert: a tombstone for a plan the cloud never saw.
  INSERT INTO plans (user_id, id, plan, schema_version, deleted_at)
  VALUES (auth.uid(), 'plan_gone', '{"id":"plan_gone"}', 1, '2026-11-20T10:00:00Z')
  ON CONFLICT (user_id, id) DO UPDATE
    SET plan = EXCLUDED.plan, schema_version = EXCLUDED.schema_version,
        deleted_at = EXCLUDED.deleted_at;

  -- Pull query shape (cursor before the row).
  SELECT * INTO r FROM plans
  WHERE user_id = auth.uid() AND updated_at >= '2000-01-01'
  ORDER BY updated_at ASC LIMIT 1;
  IF r.id IS DISTINCT FROM 'plan_gone' OR r.deleted_at IS DISTINCT FROM '2026-11-20T10:00:00Z' THEN
    RAISE EXCEPTION 'owner could not read back an inserted tombstone (got id %, deleted_at %)', r.id, r.deleted_at;
  END IF;

  RAISE NOTICE 'ok: owner upserts a tombstone for a plan the cloud never saw and pulls it back';
END
$$;

-- Update path of the upsert: a live plan first. Separate statements, so each
-- runs in its own transaction and NOW() (used by set_updated_at) moves on.
INSERT INTO plans (user_id, id, plan, deleted_at, updated_at)
VALUES (auth.uid(), 'plan_live', '{"id":"plan_live"}', NULL, '2000-01-01');

CREATE TEMP TABLE before_upsert AS
  SELECT updated_at FROM plans WHERE user_id = auth.uid() AND id = 'plan_live';

DO $$
DECLARE
  r plans%ROWTYPE;
  first_updated timestamptz := (SELECT updated_at FROM before_upsert);
BEGIN
  INSERT INTO plans (user_id, id, plan, deleted_at)
  VALUES (auth.uid(), 'plan_live', '{"id":"plan_live"}', '2026-11-21T10:00:00Z')
  ON CONFLICT (user_id, id) DO UPDATE SET plan = EXCLUDED.plan, deleted_at = EXCLUDED.deleted_at;

  SELECT * INTO r FROM plans WHERE user_id = auth.uid() AND id = 'plan_live';
  IF r.deleted_at IS DISTINCT FROM '2026-11-21T10:00:00Z' THEN
    RAISE EXCEPTION 'upsert over a live plan did not set deleted_at (got %)', r.deleted_at;
  END IF;
  IF r.updated_at <= first_updated THEN
    RAISE EXCEPTION 'upsert did not move updated_at, so a pull cursor would miss the tombstone';
  END IF;

  -- A later edit (engine push, deleted_at: null) brings it back.
  INSERT INTO plans (user_id, id, plan, deleted_at)
  VALUES (auth.uid(), 'plan_live', '{"id":"plan_live","v":2}', NULL)
  ON CONFLICT (user_id, id) DO UPDATE SET plan = EXCLUDED.plan, deleted_at = EXCLUDED.deleted_at;
  IF (SELECT deleted_at FROM plans WHERE user_id = auth.uid() AND id = 'plan_live') IS NOT NULL THEN
    RAISE EXCEPTION 'a later upsert with deleted_at null did not revive the plan';
  END IF;

  RAISE NOTICE 'ok: owner upserts a tombstone over a live plan (update path) and revives it';
END
$$;

-- --------------------------------------------
-- 2. Owner: the engine's UPDATE-style delete
-- --------------------------------------------
DO $$
DECLARE
  n bigint;
BEGIN
  UPDATE plans SET deleted_at = '2026-11-22T10:00:00Z'
  WHERE user_id = auth.uid() AND id = 'plan_live';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'owner UPDATE-style delete touched % rows, expected 1', n;
  END IF;
  IF (SELECT deleted_at FROM plans WHERE user_id = auth.uid() AND id = 'plan_live')
     IS DISTINCT FROM '2026-11-22T10:00:00Z' THEN
    RAISE EXCEPTION 'owner UPDATE-style delete did not stick';
  END IF;
  RAISE NOTICE 'ok: owner tombstones a plan with UPDATE ... SET deleted_at';
END
$$;

-- --------------------------------------------
-- 3. Another user: no read, no upsert, no update
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

DO $$
DECLARE
  n bigint;
BEGIN
  -- Pull with B's own id, and a raw read of A's rows.
  SELECT count(*) INTO n FROM plans WHERE user_id = auth.uid();
  IF n <> 0 THEN
    RAISE EXCEPTION 'B pulled % plans without owning any', n;
  END IF;
  SELECT count(*) INTO n FROM plans WHERE user_id = '00000000-0000-0000-0000-00000000000a';
  IF n <> 0 THEN
    RAISE EXCEPTION 'B can read % of A''s plans (tombstones included)', n;
  END IF;

  -- Upsert naming A as the owner: rejected by the INSERT WITH CHECK.
  BEGIN
    INSERT INTO plans (user_id, id, plan, deleted_at)
    VALUES ('00000000-0000-0000-0000-00000000000a', 'plan_gone', '{}', NULL)
    ON CONFLICT (user_id, id) DO UPDATE SET plan = EXCLUDED.plan, deleted_at = EXCLUDED.deleted_at;
    RAISE EXCEPTION 'B upserted onto A''s tombstone';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- expected: new row violates row-level security policy
  END;

  -- Upsert with B's own id and the same plan id: lands in B's own key space.
  INSERT INTO plans (user_id, id, plan, deleted_at)
  VALUES (auth.uid(), 'plan_gone', '{"id":"plan_gone","owner":"b"}', '2026-11-23T10:00:00Z')
  ON CONFLICT (user_id, id) DO UPDATE SET plan = EXCLUDED.plan, deleted_at = EXCLUDED.deleted_at;

  -- UPDATE-style delete / revive aimed at A's rows: matches nothing.
  UPDATE plans SET deleted_at = NULL WHERE user_id = '00000000-0000-0000-0000-00000000000a';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'B revived % of A''s plans', n;
  END IF;
  UPDATE plans SET deleted_at = NOW() WHERE user_id = '00000000-0000-0000-0000-00000000000a';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'B tombstoned % of A''s plans', n;
  END IF;

  RAISE NOTICE 'ok: B cannot read, upsert onto, tombstone or revive A''s plans';
END
$$;

-- A's rows are unchanged by B, and B's same-id plan did not touch A's.
RESET ROLE;
DO $$
BEGIN
  IF (SELECT deleted_at FROM plans WHERE user_id = '00000000-0000-0000-0000-00000000000a' AND id = 'plan_gone')
     IS DISTINCT FROM '2026-11-20T10:00:00Z'
  OR (SELECT deleted_at FROM plans WHERE user_id = '00000000-0000-0000-0000-00000000000a' AND id = 'plan_live')
     IS DISTINCT FROM '2026-11-22T10:00:00Z'
  OR (SELECT plan->>'owner' FROM plans WHERE user_id = '00000000-0000-0000-0000-00000000000a' AND id = 'plan_gone')
     IS NOT NULL THEN
    RAISE EXCEPTION 'A''s plans changed after B''s attempts';
  END IF;
  IF (SELECT count(*) FROM plans WHERE user_id = '00000000-0000-0000-0000-00000000000b') <> 1 THEN
    RAISE EXCEPTION 'B''s own same-id plan was not stored separately';
  END IF;
  RAISE NOTICE 'ok: A''s tombstones are untouched; plan ids are scoped per user';
END
$$;
