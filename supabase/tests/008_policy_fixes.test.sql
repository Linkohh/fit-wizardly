-- ============================================
-- Tests for 008_policy_fixes.sql (roadmap 1.6)
-- ============================================
-- Run by supabase/tests/run.sh in a throwaway copy of the migrated database.
-- Each check raises an exception on failure, which makes psql exit non-zero.
--
-- Cast: A (admin of circles X and Y), B (member of X and Y), C (stranger).
--   1. structure: helpers are SECURITY DEFINER, anon can't run them, no circle
--      policy queries circle_members directly, every user FK cascades or nulls
--   2. circle_members SELECT works and does not recurse; members see their
--      circle, strangers see nothing
--   3. a new private circle can be created and read back by its creator;
--      only admins can update or delete a circle
--   4. clients can't insert/update streaks or badges or change a score;
--      the server-side paths still can
--   5. profiles: anon nothing, stranger only own row, co-member yes
--   6. deleting a user succeeds and leaves no row pointing at them

\set ON_ERROR_STOP 1
SET client_min_messages = notice;

-- --------------------------------------------
-- Fixtures (as superuser, which bypasses RLS)
-- --------------------------------------------
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c');

INSERT INTO profiles (id, username) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob'),
  ('00000000-0000-0000-0000-00000000000c', 'carol');

-- Circle X (private) and Y (private), both created by A, B is a member of both.
INSERT INTO circles (id, name, created_by, is_public, invite_code) VALUES
  ('10000000-0000-0000-0000-000000000001', 'X', '00000000-0000-0000-0000-00000000000a', false, 'XXXXXX'),
  ('10000000-0000-0000-0000-000000000002', 'Y', '00000000-0000-0000-0000-00000000000a', false, 'YYYYYY');

INSERT INTO circle_members (circle_id, user_id, role) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'member'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'member');

INSERT INTO circle_activities (id, circle_id, user_id, activity_type) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-00000000000a', 'workout_completed');

INSERT INTO circle_challenges (id, circle_id, title, start_date, end_date, created_by, winner_id) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
   'Most sets', CURRENT_DATE, CURRENT_DATE + 7,
   '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a');

INSERT INTO challenge_participants (challenge_id, user_id, score) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 10);

INSERT INTO activity_reactions (activity_id, user_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b');
INSERT INTO activity_comments (activity_id, user_id, content) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'nice');
INSERT INTO circle_posts (circle_id, user_id, content) VALUES
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'hello');

INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES ('00000000-0000-0000-0000-00000000000b', 2, 2, CURRENT_DATE - 1);

CREATE SCHEMA tests;
GRANT USAGE ON SCHEMA tests TO anon, authenticated;

CREATE FUNCTION tests.count_rows(p_table text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %I', p_table) INTO n;
  RETURN n;
END;
$$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO anon, authenticated;

-- --------------------------------------------
-- 1. Structure
-- --------------------------------------------
DO $$
DECLARE
  f text;
  n int;
  bad text;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.is_circle_member(uuid)',
                           'public.is_circle_admin(uuid)',
                           'public.shares_circle_with(uuid)'] LOOP
    IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = f::regprocedure) THEN
      RAISE EXCEPTION '%: not SECURITY DEFINER', f;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = f::regprocedure
                   AND proconfig @> ARRAY['search_path=public']) THEN
      RAISE EXCEPTION '%: search_path is not pinned to public', f;
    END IF;
    IF has_function_privilege('anon', f, 'EXECUTE') THEN
      RAISE EXCEPTION '%: anon can execute it', f;
    END IF;
    IF NOT has_function_privilege('authenticated', f, 'EXECUTE') THEN
      RAISE EXCEPTION '%: authenticated cannot execute it', f;
    END IF;
  END LOOP;

  -- No policy on a circle table may query circle_members directly any more.
  SELECT string_agg(tablename || ': ' || policyname, '; ') INTO bad
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (coalesce(qual, '') ~ '(FROM|JOIN) circle_members'
         OR coalesce(with_check, '') ~ '(FROM|JOIN) circle_members');
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'policies still query circle_members directly: %', bad;
  END IF;

  -- Circle and profile policies are for signed-in users only.
  SELECT string_agg(tablename || ': ' || policyname, '; ') INTO bad
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('profiles','circles','circle_members','circle_activities',
                      'circle_challenges','activity_reactions','activity_comments',
                      'circle_posts','challenge_participants')
    AND roles <> ARRAY['authenticated']::name[];
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'policies not scoped TO authenticated: %', bad;
  END IF;

  -- No client write policies on streaks or badges.
  SELECT count(*) INTO n FROM pg_policies
  WHERE schemaname = 'public' AND tablename IN ('user_streaks','exercise_badges')
    AND cmd <> 'SELECT';
  IF n <> 0 THEN
    RAISE EXCEPTION 'user_streaks/exercise_badges still have % client write policies', n;
  END IF;

  -- No client UPDATE policy on challenge_participants.
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
             AND tablename = 'challenge_participants' AND cmd = 'UPDATE') THEN
    RAISE EXCEPTION 'challenge_participants still has a client UPDATE policy';
  END IF;

  -- Every FK in public that points at a user (auth.users or profiles) must
  -- CASCADE or SET NULL, so deleting an account never fails.
  SELECT string_agg(conrelid::regclass || '.' || conname, '; ') INTO bad
  FROM pg_constraint
  WHERE contype = 'f'
    AND connamespace = 'public'::regnamespace
    AND confrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
    AND confdeltype NOT IN ('c', 'n');
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'user FKs that block account deletion: %', bad;
  END IF;

  -- Every table with RLS on that clients write to has a DELETE policy
  -- (streaks, badges, stats and user prefs are excluded on purpose:
  -- server-written, or cleared by the account cascade).
  SELECT string_agg(t, ', ') INTO bad
  FROM unnest(ARRAY['profiles','circles','circle_members','circle_activities',
                    'circle_challenges','activity_reactions','activity_comments',
                    'circle_posts','challenge_participants']) AS t
  WHERE NOT EXISTS (SELECT 1 FROM pg_policies
                    WHERE schemaname = 'public' AND tablename = t AND cmd = 'DELETE');
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'tables missing a DELETE policy: %', bad;
  END IF;

  RAISE NOTICE 'ok: structure (definer helpers, no direct circle_members subqueries, TO authenticated, FKs, DELETE policies)';
END
$$;

-- --------------------------------------------
-- 2. circle_members: no recursion; members vs strangers
-- --------------------------------------------
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

DO $$
BEGIN
  -- Before 008 this raised 42P17 "infinite recursion detected in policy".
  IF tests.count_rows('circle_members') <> 4 THEN
    RAISE EXCEPTION 'A should see 4 memberships (X and Y), saw %', tests.count_rows('circle_members');
  END IF;
  IF tests.count_rows('circles') <> 2 THEN
    RAISE EXCEPTION 'A should see circles X and Y';
  END IF;
  IF tests.count_rows('circle_activities') <> 1
     OR tests.count_rows('circle_challenges') <> 1
     OR tests.count_rows('challenge_participants') <> 1
     OR tests.count_rows('activity_reactions') <> 1
     OR tests.count_rows('activity_comments') <> 1
     OR tests.count_rows('circle_posts') <> 1 THEN
    RAISE EXCEPTION 'A cannot see the feed, challenge, reactions, comments or posts of own circle';
  END IF;
  RAISE NOTICE 'ok: selecting circle_members works without recursion; members see their circle data';
END
$$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['circle_members','circles','circle_activities','circle_challenges',
                           'challenge_participants','activity_reactions','activity_comments',
                           'circle_posts'] LOOP
    IF tests.count_rows(t) <> 0 THEN
      RAISE EXCEPTION 'stranger C can see % row(s) of %', tests.count_rows(t), t;
    END IF;
  END LOOP;

  -- C can't join a private circle directly or post into it.
  BEGIN
    INSERT INTO circle_members (circle_id, user_id, role)
    VALUES ('10000000-0000-0000-0000-000000000001', auth.uid(), 'member');
    RAISE EXCEPTION 'C joined a private circle without an invite';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO circle_activities (circle_id, user_id, activity_type)
    VALUES ('10000000-0000-0000-0000-000000000001', auth.uid(), 'spam');
    RAISE EXCEPTION 'C posted into a circle it is not in';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'ok: a stranger sees nothing in, and cannot join or post into, a private circle';
END
$$;

-- --------------------------------------------
-- 3. Creating a private circle; admin-only update and delete
-- --------------------------------------------
DO $$
DECLARE v_id uuid;
BEGIN
  -- Mirrors src/stores/circles/membership.ts createCircle(): insert ... select().
  INSERT INTO circles (name, created_by, invite_code)
  VALUES ('C private', auth.uid(), 'CCCCCC')
  RETURNING id INTO v_id;

  INSERT INTO circle_members (circle_id, user_id, role) VALUES (v_id, auth.uid(), 'admin');

  IF NOT public.is_circle_admin(v_id) THEN
    RAISE EXCEPTION 'creator did not become admin of the new circle';
  END IF;

  -- Can't create a circle in someone else's name.
  BEGIN
    INSERT INTO circles (name, created_by) VALUES ('forged', '00000000-0000-0000-0000-00000000000a');
    RAISE EXCEPTION 'C created a circle with created_by = A';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'ok: creator can create and read back a private circle and become its admin';
END
$$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

DO $$
DECLARE n int;
BEGIN
  UPDATE circles SET name = 'hijacked' WHERE id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'member B updated circle X'; END IF;

  DELETE FROM circles WHERE id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'member B deleted circle X'; END IF;

  -- B can delete their own reaction but not A's activity.
  DELETE FROM circle_activities WHERE id = '20000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'member B deleted A''s activity'; END IF;
  RAISE NOTICE 'ok: a plain member cannot update or delete the circle or others'' activities';
END
$$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

DO $$
DECLARE n int;
BEGIN
  UPDATE circles SET name = 'X renamed' WHERE id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'admin A could not update circle X'; END IF;

  DELETE FROM circles WHERE id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'admin A could not delete circle X'; END IF;
  RAISE NOTICE 'ok: an admin can update and delete their circle';
END
$$;

-- --------------------------------------------
-- 4. Forgeable gamification
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

DO $$
DECLARE
  n int;
  v_score numeric;
BEGIN
  -- Streaks: B can read but not write.
  IF tests.count_rows('user_streaks') <> 1 THEN
    RAISE EXCEPTION 'B cannot read own streak';
  END IF;
  UPDATE user_streaks SET current_streak = 999, longest_streak = 999 WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'B updated own streak directly'; END IF;
  DELETE FROM user_streaks WHERE user_id = auth.uid();
  BEGIN
    INSERT INTO user_streaks (user_id, current_streak) VALUES (auth.uid(), 999);
    RAISE EXCEPTION 'B inserted own streak';
  EXCEPTION WHEN insufficient_privilege OR unique_violation THEN NULL;
  END;

  -- Badges.
  BEGIN
    INSERT INTO exercise_badges (user_id, badge_type, badge_name)
    VALUES (auth.uid(), 'legend', 'Legend');
    RAISE EXCEPTION 'B inserted own badge';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- Score: joining starts at 0 whatever the client sends ...
  INSERT INTO challenge_participants (challenge_id, user_id, score)
  VALUES ('30000000-0000-0000-0000-000000000001', auth.uid(), 999);
  SELECT score INTO v_score FROM challenge_participants
  WHERE challenge_id = '30000000-0000-0000-0000-000000000001' AND user_id = auth.uid();
  IF v_score <> 0 THEN RAISE EXCEPTION 'B joined a challenge with score %', v_score; END IF;

  -- ... and can't be changed afterwards.
  UPDATE challenge_participants SET score = 999 WHERE user_id = auth.uid();
  SELECT score INTO v_score FROM challenge_participants
  WHERE challenge_id = '30000000-0000-0000-0000-000000000001' AND user_id = auth.uid();
  IF v_score <> 0 THEN RAISE EXCEPTION 'B changed own score to %', v_score; END IF;

  -- B can still leave the challenge.
  DELETE FROM challenge_participants WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'B could not leave the challenge'; END IF;

  RAISE NOTICE 'ok: a client cannot insert/update streaks or badges or set a challenge score';
END
$$;

-- The legitimate path still works: a 'perform' interaction runs the SECURITY
-- DEFINER trigger, which advances the streak.
DO $$
DECLARE v_streak int;
BEGIN
  INSERT INTO exercise_interactions (user_id, exercise_id, interaction_type)
  VALUES (auth.uid(), 'bench_press', 'perform');
  SELECT current_streak INTO v_streak FROM user_streaks WHERE user_id = auth.uid();
  IF v_streak IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'perform interaction did not advance the streak (got %)', v_streak;
  END IF;
  RAISE NOTICE 'ok: update_user_streak() still writes streaks through the interaction trigger';
END
$$;

-- The trigger leaves the score alone for the service role.
RESET ROLE;
SET ROLE service_role;
SET request.jwt.claim.role = 'service_role';
DO $$
DECLARE v_score numeric;
BEGIN
  UPDATE challenge_participants SET score = 42
  WHERE challenge_id = '30000000-0000-0000-0000-000000000001'
    AND user_id = '00000000-0000-0000-0000-00000000000a';
  SELECT score INTO v_score FROM challenge_participants
  WHERE challenge_id = '30000000-0000-0000-0000-000000000001'
    AND user_id = '00000000-0000-0000-0000-00000000000a';
  IF v_score <> 42 THEN RAISE EXCEPTION 'service role could not set a score (got %)', v_score; END IF;
  RAISE NOTICE 'ok: the service role can still set challenge scores';
END
$$;
RESET request.jwt.claim.role;
RESET ROLE;

-- --------------------------------------------
-- 5. profiles exposure
-- --------------------------------------------
SET ROLE anon;
RESET request.jwt.claim.sub;
DO $$
BEGIN
  IF tests.count_rows('profiles') <> 0 THEN
    RAISE EXCEPTION 'anon can read % profile(s)', tests.count_rows('profiles');
  END IF;
  IF tests.count_rows('circles') <> 0 OR tests.count_rows('circle_members') <> 0 THEN
    RAISE EXCEPTION 'anon can read circles or memberships';
  END IF;
  RAISE NOTICE 'ok: anon reads no profiles, circles or memberships';
END
$$;

SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
DO $$
BEGIN
  IF tests.count_rows('profiles') <> 1
     OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'stranger C should see only own profile, saw %', tests.count_rows('profiles');
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE username = 'alice') THEN
    RAISE EXCEPTION 'stranger C can read A''s profile';
  END IF;
  RAISE NOTICE 'ok: a stranger reads only their own profile';
END
$$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
DO $$
DECLARE n int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = 'alice') THEN
    RAISE EXCEPTION 'co-member B cannot read A''s profile';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE username = 'carol') THEN
    RAISE EXCEPTION 'B can read stranger C''s profile';
  END IF;

  -- Read access to A's profile does not mean write access.
  UPDATE profiles SET display_name = 'pwned' WHERE username = 'alice';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'B updated A''s profile'; END IF;
  DELETE FROM profiles WHERE username = 'alice';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'B deleted A''s profile'; END IF;

  UPDATE profiles SET display_name = 'Bob' WHERE id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'B cannot update own profile'; END IF;
  RAISE NOTICE 'ok: a co-member reads (not writes) profiles in a shared circle';
END
$$;

-- --------------------------------------------
-- 6. Account deletion leaves no orphans
-- --------------------------------------------
RESET ROLE;
RESET request.jwt.claim.sub;

-- Give A a row in every other user-linked table too.
INSERT INTO exercise_interactions (user_id, exercise_id, interaction_type)
  VALUES ('00000000-0000-0000-0000-00000000000a', 'squat', 'view');
INSERT INTO user_exercise_preferences (user_id) VALUES ('00000000-0000-0000-0000-00000000000a');
INSERT INTO exercise_badges (user_id, badge_type, badge_name)
  VALUES ('00000000-0000-0000-0000-00000000000a', 'first', 'First');
INSERT INTO plans (user_id, id, plan) VALUES ('00000000-0000-0000-0000-00000000000a', 'plan_1', '{}');

DO $$
DECLARE
  r record;
  n bigint;
  bad text := '';
BEGIN
  -- Before 008 this failed: circles.created_by and friends were NO ACTION.
  DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-00000000000a';

  -- Every single-column FK in public that points at a user.
  FOR r IN
    SELECT con.conrelid::regclass AS tbl, att.attname AS col
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND con.connamespace = 'public'::regnamespace
      AND con.confrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', r.tbl, r.col)
      INTO n USING '00000000-0000-0000-0000-00000000000a'::uuid;
    IF n <> 0 THEN
      bad := bad || format('%s.%s=%s ', r.tbl, r.col, n);
    END IF;
  END LOOP;
  IF bad <> '' THEN
    RAISE EXCEPTION 'orphan rows still point at deleted user A: %', bad;
  END IF;

  -- Shared rows survive with the creator nulled; B's own rows survive.
  IF NOT EXISTS (SELECT 1 FROM circles WHERE id = '10000000-0000-0000-0000-000000000002'
                 AND created_by IS NULL) THEN
    RAISE EXCEPTION 'circle Y should survive with created_by = NULL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM circle_challenges WHERE id = '30000000-0000-0000-0000-000000000001'
                 AND created_by IS NULL AND winner_id IS NULL) THEN
    RAISE EXCEPTION 'challenge should survive with created_by and winner_id = NULL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM circle_members
                 WHERE circle_id = '10000000-0000-0000-0000-000000000002'
                   AND user_id = '00000000-0000-0000-0000-00000000000b') THEN
    RAISE EXCEPTION 'B''s membership of Y was removed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-00000000000b') THEN
    RAISE EXCEPTION 'B''s profile was removed';
  END IF;
  RAISE NOTICE 'ok: deleting a user succeeds and leaves no orphan rows; shared circle rows survive';
END
$$;
