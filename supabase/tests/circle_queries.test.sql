-- ============================================
-- Circle client queries under 008 (Lane F Day 6)
-- ============================================
-- Run by supabase/tests/run.sh in a throwaway copy of the migrated database.
--
-- Circles is off in v1 (VITE_FEATURE_CIRCLES), but 008 must not break it for
-- later. Each block below replays one query shape from src/stores/circles/*.ts
-- as the signed-in role, the way PostgREST would run it (an embed such as
-- `profile:profiles (*)` is a separate RLS-filtered read of that table, so it
-- is written here as a LEFT JOIN LATERAL / correlated subquery).
--
--   Q1  createCircle      circles INSERT ... RETURNING (.select().single()),
--                         then circle_members INSERT role 'admin'
--   Q2  fetchUserCircles  circle_members SELECT circle_id WHERE user_id = me,
--                         then circles IN (...) with circle_members(*, profiles(*))
--   Q3  joinCircle        rpc join_circle_by_invite, then postActivity
--   Q4  fetchCircleById   circles WHERE id = ... .single() with the same embed
--   Q5  fetchActivities   circle_activities WHERE circle_id ORDER BY created_at
--                         DESC LIMIT 50, with profile:profiles(*)  (the feed)
--   Q6  realtime refetch  circle_activities WHERE id = ... .single() with profile
--   Q7  leaderboard       buildLeaderboard() = Q4 members + Q5 'workout_logged'
--   Q8  reactions         activity_reactions SELECT IN (...); addReaction
--                         (DELETE own, then INSERT); removeReaction (DELETE)
--   Q9  comments          activity_comments SELECT with profile; INSERT ...
--                         RETURNING with profile; DELETE WHERE id = ...
--   Q10 challenges        circle_challenges SELECT ORDER BY start_date DESC;
--                         INSERT created_by = me
--   Q11 leaveCircle       circle_members DELETE own row
--   Q12 profile bootstrap authStore: profiles SELECT own .maybeSingle(), INSERT
--                         own (every circle FK points at profiles, so a circle
--                         can't be created without it)
--
-- Cast: A creates private circle P; B joins P by invite code; C is a stranger.
-- Not covered (no harness for it): realtime delivery itself. Supabase Realtime
-- checks the subscriber's SELECT policy per row, which Q5/Q6 exercise.

\set ON_ERROR_STOP 1
SET client_min_messages = notice;

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c');

-- Shared scratch space for ids the client would hold in memory.
CREATE TABLE public.test_ids (name text PRIMARY KEY, id uuid NOT NULL);
GRANT ALL ON public.test_ids TO authenticated;

CREATE FUNCTION public.test_id(p_name text) RETURNS uuid LANGUAGE sql STABLE
  AS $$ SELECT id FROM public.test_ids WHERE name = p_name $$;
GRANT EXECUTE ON FUNCTION public.test_id(text) TO authenticated;

SET ROLE authenticated;

-- --------------------------------------------
-- Q12. Profile bootstrap (each user signs in once)
-- --------------------------------------------
DO $$
DECLARE
  u record;
  n bigint;
BEGIN
  FOR u IN SELECT * FROM (VALUES
      ('00000000-0000-0000-0000-00000000000a'::uuid, 'Alice'),
      ('00000000-0000-0000-0000-00000000000b'::uuid, 'Bob'),
      ('00000000-0000-0000-0000-00000000000c'::uuid, 'Carol')) AS t(id, name)
  LOOP
    PERFORM set_config('request.jwt.claim.sub', u.id::text, true);
    SELECT count(*) INTO n FROM profiles WHERE id = auth.uid();
    IF n <> 0 THEN
      RAISE EXCEPTION 'Q12: % already has a profile before sign-in', u.name;
    END IF;
    INSERT INTO profiles (id, display_name, username, avatar_url, experience_level,
                          primary_goal, timezone, role, is_trainer)
    VALUES (auth.uid(), u.name, NULL, NULL, NULL, NULL, 'America/New_York', 'client', false);
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND display_name = u.name) THEN
      RAISE EXCEPTION 'Q12: % cannot read back their new profile', u.name;
    END IF;
  END LOOP;
  RAISE NOTICE 'ok: Q12 each user can create and read their own profile';
END
$$;

-- --------------------------------------------
-- Q1. createCircle (A)
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

DO $$
DECLARE
  v_circle circles%ROWTYPE;
BEGIN
  -- .insert({...}).select().single(): RETURNING needs the SELECT policy too.
  INSERT INTO circles (name, description, created_by, invite_code)
  VALUES ('Lifters', 'Private by default', auth.uid(), 'INVITE88')
  RETURNING * INTO v_circle;
  IF v_circle.id IS NULL OR v_circle.is_public THEN
    RAISE EXCEPTION 'Q1: expected a private circle back from INSERT ... RETURNING';
  END IF;
  INSERT INTO public.test_ids VALUES ('P', v_circle.id);

  INSERT INTO circle_members (circle_id, user_id, role)
  VALUES (v_circle.id, auth.uid(), 'admin');

  RAISE NOTICE 'ok: Q1 creator inserts a private circle, reads it back, and becomes admin';
END
$$;

-- A public circle B is not in, for Q4.
INSERT INTO circles (name, created_by, invite_code, is_public)
VALUES ('Open gym', auth.uid(), 'OPENGYM1', true);
INSERT INTO public.test_ids SELECT 'PUB', id FROM circles WHERE invite_code = 'OPENGYM1';
INSERT INTO circle_members (circle_id, user_id, role)
VALUES (public.test_id('PUB'), auth.uid(), 'admin');

-- A posts a workout into P (postActivity), for the feed and leaderboard.
INSERT INTO circle_activities (circle_id, user_id, activity_type, payload)
VALUES (public.test_id('P'), auth.uid(), 'workout_logged', '{"totalVolume": 5000}');

-- --------------------------------------------
-- Q3. joinCircle (B, by invite code, lower case like a typed code)
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

DO $$
DECLARE
  r record;
BEGIN
  -- Before joining, B can't see the private circle at all.
  IF EXISTS (SELECT 1 FROM circles WHERE id = public.test_id('P')) THEN
    RAISE EXCEPTION 'Q3: B sees private circle P before joining';
  END IF;

  -- The client upper-cases the code; the RPC also trims and upper-cases.
  SELECT * INTO r FROM public.join_circle_by_invite(upper(' invite88 '));
  IF r.circle_id IS DISTINCT FROM public.test_id('P') OR r.circle_name <> 'Lifters' THEN
    RAISE EXCEPTION 'Q3: join_circle_by_invite returned %', r;
  END IF;

  -- postActivity('member_joined') right after the RPC.
  INSERT INTO circle_activities (circle_id, user_id, activity_type, payload)
  VALUES (r.circle_id, auth.uid(), 'member_joined', '{"memberName":"Bob"}');
  INSERT INTO circle_activities (circle_id, user_id, activity_type, payload)
  VALUES (r.circle_id, auth.uid(), 'workout_logged', '{"totalVolume": 1000}');

  -- Joining twice is refused by the RPC with a readable message.
  BEGIN
    PERFORM public.join_circle_by_invite('INVITE88');
    RAISE EXCEPTION 'Q3: second join did not fail';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Already a member of this circle' THEN
      RAISE;
    END IF;
  END;

  RAISE NOTICE 'ok: Q3 invite join works for a private circle, then the joiner can post';
END
$$;

-- --------------------------------------------
-- Q2. fetchUserCircles (B)
-- --------------------------------------------
DO $$
DECLARE
  v_ids uuid[];
  v_circles jsonb;
BEGIN
  SELECT array_agg(circle_id) INTO v_ids FROM circle_members WHERE user_id = auth.uid();
  IF v_ids IS DISTINCT FROM ARRAY[public.test_id('P')] THEN
    RAISE EXCEPTION 'Q2: B''s memberships are %, expected only P', v_ids;
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
           'id', c.id,
           'members', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                                'user_id', cm.user_id, 'role', cm.role,
                                'profile', (SELECT to_jsonb(p) FROM profiles p WHERE p.id = cm.user_id))), '[]')
                       FROM circle_members cm WHERE cm.circle_id = c.id)))
    INTO v_circles
  FROM circles c WHERE c.id = ANY (v_ids);

  IF jsonb_array_length(v_circles) <> 1 THEN
    RAISE EXCEPTION 'Q2: expected 1 circle, got %', v_circles;
  END IF;
  IF jsonb_array_length(v_circles->0->'members') <> 2 THEN
    RAISE EXCEPTION 'Q2: expected 2 members with the embed, got %', v_circles->0->'members';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_circles->0->'members') m
             WHERE m->'profile' = 'null'::jsonb) THEN
    RAISE EXCEPTION 'Q2: a co-member''s profile came back null: %', v_circles->0->'members';
  END IF;

  RAISE NOTICE 'ok: Q2 my circles list with members and their profiles';
END
$$;

-- --------------------------------------------
-- Q4. fetchCircleById (B): own circle, a public circle, nothing else
-- --------------------------------------------
DO $$
DECLARE
  n bigint;
BEGIN
  SELECT count(*) INTO n FROM circle_members WHERE circle_id = public.test_id('P');
  IF n <> 2 THEN
    RAISE EXCEPTION 'Q4: B sees % members of P, expected 2', n;
  END IF;

  -- A public circle B is not in: the circle row is readable, its member list
  -- (and so member profiles) is not. The UI shows a circle with 0 members.
  IF NOT EXISTS (SELECT 1 FROM circles WHERE id = public.test_id('PUB')) THEN
    RAISE EXCEPTION 'Q4: B cannot read a public circle';
  END IF;
  SELECT count(*) INTO n FROM circle_members WHERE circle_id = public.test_id('PUB');
  IF n <> 0 THEN
    RAISE EXCEPTION 'Q4: B (non-member) sees % members of the public circle', n;
  END IF;

  RAISE NOTICE 'ok: Q4 circle by id: full detail for members, row only for a public circle';
END
$$;

-- --------------------------------------------
-- Q5 + Q6 + Q7. Feed, realtime refetch, leaderboard (B)
-- --------------------------------------------
DO $$
DECLARE
  v_feed jsonb;
  v_one jsonb;
  v_board jsonb;
BEGIN
  SELECT jsonb_agg(row ORDER BY (row->>'created_at') DESC) INTO v_feed
  FROM (
    SELECT to_jsonb(a) || jsonb_build_object('profile', (SELECT to_jsonb(p) FROM profiles p WHERE p.id = a.user_id)) AS row
    FROM circle_activities a
    WHERE a.circle_id = public.test_id('P')
    ORDER BY a.created_at DESC
    LIMIT 50
  ) feed;
  IF jsonb_array_length(v_feed) <> 3 THEN
    RAISE EXCEPTION 'Q5: B sees % activities in P, expected 3', jsonb_array_length(v_feed);
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_feed) e WHERE e->'profile' = 'null'::jsonb) THEN
    RAISE EXCEPTION 'Q5: an author profile came back null in the feed';
  END IF;

  -- Realtime handler refetches the new row by id with its profile.
  SELECT to_jsonb(a) || jsonb_build_object('profile', (SELECT to_jsonb(p) FROM profiles p WHERE p.id = a.user_id))
    INTO v_one
  FROM circle_activities a
  WHERE a.id = (SELECT id FROM circle_activities WHERE user_id = '00000000-0000-0000-0000-00000000000a' LIMIT 1);
  IF v_one IS NULL OR v_one->'profile'->>'display_name' <> 'Alice' THEN
    RAISE EXCEPTION 'Q6: single activity refetch failed: %', v_one;
  END IF;

  -- buildLeaderboard(): members (with profiles) x 'workout_logged' activities.
  SELECT jsonb_agg(jsonb_build_object('name', p.display_name, 'workouts', w.n) ORDER BY w.n DESC, p.display_name)
    INTO v_board
  FROM circle_members cm
  LEFT JOIN profiles p ON p.id = cm.user_id
  CROSS JOIN LATERAL (
    SELECT count(*) AS n FROM circle_activities a
    WHERE a.circle_id = cm.circle_id AND a.user_id = cm.user_id AND a.activity_type = 'workout_logged'
  ) w
  WHERE cm.circle_id = public.test_id('P');
  IF v_board IS DISTINCT FROM '[{"name":"Alice","workouts":1},{"name":"Bob","workouts":1}]'::jsonb THEN
    RAISE EXCEPTION 'Q7: leaderboard inputs wrong: %', v_board;
  END IF;

  RAISE NOTICE 'ok: Q5 feed, Q6 realtime refetch and Q7 leaderboard inputs for a member';
END
$$;

-- --------------------------------------------
-- Q8. Reactions (B on A's workout)
-- --------------------------------------------
DO $$
DECLARE
  v_activity uuid := (SELECT id FROM circle_activities
                      WHERE user_id = '00000000-0000-0000-0000-00000000000a' LIMIT 1);
  n bigint;
BEGIN
  INSERT INTO public.test_ids VALUES ('A_WORKOUT', v_activity);

  -- addReaction: delete my reactions on the activity, then insert one.
  DELETE FROM activity_reactions WHERE activity_id = v_activity AND user_id = auth.uid();
  INSERT INTO activity_reactions (activity_id, user_id, reaction_type) VALUES (v_activity, auth.uid(), 'fire');
  -- Switch reaction (same two calls).
  DELETE FROM activity_reactions WHERE activity_id = v_activity AND user_id = auth.uid();
  INSERT INTO activity_reactions (activity_id, user_id, reaction_type) VALUES (v_activity, auth.uid(), 'strong');

  -- fetchReactions(activityIds)
  SELECT count(*) INTO n FROM activity_reactions WHERE activity_id IN (v_activity);
  IF n <> 1 THEN
    RAISE EXCEPTION 'Q8: expected 1 reaction after switching, found %', n;
  END IF;

  -- removeReaction
  DELETE FROM activity_reactions
  WHERE activity_id = v_activity AND user_id = auth.uid() AND reaction_type = 'strong';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'Q8: removeReaction deleted % rows', n;
  END IF;

  INSERT INTO activity_reactions (activity_id, user_id, reaction_type) VALUES (v_activity, auth.uid(), 'clap');
  RAISE NOTICE 'ok: Q8 add, switch, list and remove reactions';
END
$$;

-- --------------------------------------------
-- Q9. Comments (B comments on A's workout; A tries to delete it)
-- --------------------------------------------
DO $$
DECLARE
  v_comment jsonb;
BEGIN
  -- .insert({...}).select('*, profile:profiles (*)').single()
  WITH inserted AS (
    INSERT INTO activity_comments (activity_id, user_id, content)
    VALUES (public.test_id('A_WORKOUT'), auth.uid(), 'Nice lift')
    RETURNING *
  )
  SELECT to_jsonb(i) || jsonb_build_object('profile', (SELECT to_jsonb(p) FROM profiles p WHERE p.id = i.user_id))
    INTO v_comment FROM inserted i;
  IF v_comment->'profile'->>'display_name' IS DISTINCT FROM 'Bob' THEN
    RAISE EXCEPTION 'Q9: comment insert did not return the author profile: %', v_comment;
  END IF;
  INSERT INTO public.test_ids VALUES ('B_COMMENT', (v_comment->>'id')::uuid);
  RAISE NOTICE 'ok: Q9 a member comments and gets the row back with their profile';
END
$$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

DO $$
DECLARE
  n bigint;
BEGIN
  -- fetchComments(activityId) with profile embed.
  SELECT count(*) INTO n
  FROM activity_comments c
  JOIN profiles p ON p.id = c.user_id
  WHERE c.activity_id = public.test_id('A_WORKOUT');
  IF n <> 1 THEN
    RAISE EXCEPTION 'Q9: A sees % comments with profiles, expected 1', n;
  END IF;

  -- deleteComment(commentId) on someone else's comment: no error, 0 rows.
  DELETE FROM activity_comments WHERE id = public.test_id('B_COMMENT');
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'Q9: A deleted B''s comment';
  END IF;
  RAISE NOTICE 'ok: Q9 comments list with profiles; deleting another''s comment is a silent no-op';
END
$$;

-- --------------------------------------------
-- Q10. Challenges (B creates one; both list them)
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

DO $$
DECLARE
  n bigint;
BEGIN
  INSERT INTO circle_challenges (circle_id, title, description, challenge_type, start_date, end_date, created_by)
  VALUES (public.test_id('P'), 'Most workouts', NULL, 'workouts', CURRENT_DATE, CURRENT_DATE + 7, auth.uid());
  -- createChallenge then calls postActivity('challenge_created').
  INSERT INTO circle_activities (circle_id, user_id, activity_type, payload)
  VALUES (public.test_id('P'), auth.uid(), 'challenge_created', '{"title":"Most workouts"}');

  SELECT count(*) INTO n FROM (
    SELECT * FROM circle_challenges WHERE circle_id = public.test_id('P') ORDER BY start_date DESC
  ) s;
  IF n <> 1 THEN
    RAISE EXCEPTION 'Q10: B lists % challenges, expected 1', n;
  END IF;
  RAISE NOTICE 'ok: Q10 a member creates and lists challenges';
END
$$;

-- --------------------------------------------
-- Stranger C: every read shape returns nothing; every write is refused
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM circle_members WHERE circle_id = public.test_id('P'))
     OR EXISTS (SELECT 1 FROM circles WHERE id = public.test_id('P'))
     OR EXISTS (SELECT 1 FROM circle_activities WHERE circle_id = public.test_id('P'))
     OR EXISTS (SELECT 1 FROM activity_reactions WHERE activity_id = public.test_id('A_WORKOUT'))
     OR EXISTS (SELECT 1 FROM activity_comments WHERE activity_id = public.test_id('A_WORKOUT'))
     OR EXISTS (SELECT 1 FROM circle_challenges WHERE circle_id = public.test_id('P'))
     OR EXISTS (SELECT 1 FROM profiles WHERE id <> auth.uid()) THEN
    RAISE EXCEPTION 'stranger C can read something in private circle P';
  END IF;

  BEGIN
    INSERT INTO circle_activities (circle_id, user_id, activity_type)
    VALUES (public.test_id('P'), auth.uid(), 'workout_logged');
    RAISE EXCEPTION 'stranger C posted into P';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO activity_comments (activity_id, user_id, content)
    VALUES (public.test_id('A_WORKOUT'), auth.uid(), 'spam');
    RAISE EXCEPTION 'stranger C commented in P';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO circle_challenges (circle_id, title, start_date, end_date, created_by)
    VALUES (public.test_id('P'), 'x', CURRENT_DATE, CURRENT_DATE, auth.uid());
    RAISE EXCEPTION 'stranger C created a challenge in P';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO circle_members (circle_id, user_id, role) VALUES (public.test_id('P'), auth.uid(), 'member');
    RAISE EXCEPTION 'stranger C joined private P without the code';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.join_circle_by_invite('WRONGCODE');
    RAISE EXCEPTION 'a wrong invite code was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Invalid invite code' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'ok: a stranger reads nothing in, and cannot write into, a private circle';
END
$$;

-- --------------------------------------------
-- Q11. leaveCircle (B), then what A sees
-- --------------------------------------------
SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

DO $$
DECLARE
  n bigint;
BEGIN
  DELETE FROM circle_members WHERE circle_id = public.test_id('P') AND user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'Q11: leaveCircle deleted % rows', n;
  END IF;
  IF EXISTS (SELECT 1 FROM circles WHERE id = public.test_id('P'))
     OR EXISTS (SELECT 1 FROM circle_activities WHERE circle_id = public.test_id('P')) THEN
    RAISE EXCEPTION 'Q11: B still sees P after leaving';
  END IF;
  RAISE NOTICE 'ok: Q11 a member leaves and loses access';
END
$$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

DO $$
DECLARE
  n_total bigint;
  n_no_profile bigint;
BEGIN
  -- B's old posts stay in A's feed, but B's profile is no longer shared, so
  -- the profile embed is null. The feed UI must cope with that (see handoff).
  SELECT count(*), count(*) FILTER (WHERE p.id IS NULL)
    INTO n_total, n_no_profile
  FROM circle_activities a
  LEFT JOIN profiles p ON p.id = a.user_id
  WHERE a.circle_id = public.test_id('P');
  IF n_total <> 4 OR n_no_profile <> 3 THEN
    RAISE EXCEPTION 'Q11: expected 4 activities with 3 missing profiles, got % / %', n_total, n_no_profile;
  END IF;
  RAISE NOTICE 'ok: Q11 after B leaves, A keeps B''s posts with the author profile hidden';
END
$$;

RESET ROLE;
DROP FUNCTION public.test_id(text);
DROP TABLE public.test_ids;
