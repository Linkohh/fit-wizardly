-- ============================================
-- FitWizardly: Access-rule fixes (roadmap 1.6)
-- ============================================
-- Re-runnable: every function is CREATE OR REPLACE, every policy is
-- DROP POLICY IF EXISTS + CREATE POLICY, every trigger is DROP TRIGGER IF EXISTS
-- + CREATE TRIGGER, and the foreign-key rewrites look the constraint up first.
--
-- Apply to STAGING first. Circles is flagged off in v1 (VITE_FEATURE_CIRCLES),
-- so the circle policies below only need to keep the feature working for later.
--
-- What it fixes:
--   1. circle_members SELECT policy queried circle_members from inside itself
--      (infinite recursion). Membership checks now go through
--      SECURITY DEFINER helpers: is_circle_member(), is_circle_admin().
--      Every 001/003/006 policy that repeated the subquery uses them now.
--      Circle policies are scoped TO authenticated; anon gets nothing.
--   2. Forgeable gamification: clients could insert/update their own streaks
--      and badges, and set any challenge score. Client write policies dropped;
--      a trigger pins challenge_participants.score for client roles.
--   3. profiles was readable by everyone, signed-out users included. Now: own
--      row, plus co-members of a shared circle (shares_circle_with()).
--   4. Missing DELETE policies (circles: admins only; circle_activities,
--      circle_challenges, profiles) and foreign keys to profiles that blocked
--      account deletion. Personal rows CASCADE; shared rows SET NULL.

-- ============================================
-- 1. Membership helpers
-- ============================================
-- SECURITY DEFINER runs as the owner, which bypasses RLS on circle_members,
-- so policies that call these never re-enter the circle_members policy.

CREATE OR REPLACE FUNCTION public.is_circle_member(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_admin(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_circle_with(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM circle_members mine
    JOIN circle_members theirs ON theirs.circle_id = mine.circle_id
    WHERE mine.user_id = auth.uid()
      AND theirs.user_id = p_user
  );
$$;

-- Supabase's default privileges also grant EXECUTE to anon directly, so revoke
-- from anon explicitly, not only from PUBLIC.
REVOKE ALL ON FUNCTION public.is_circle_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_circle_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.shares_circle_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_circle_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_circle_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.shares_circle_with(uuid) TO authenticated, service_role;

-- ============================================
-- 2. circles
-- ============================================
DROP POLICY IF EXISTS "Circle members can view circles" ON circles;
CREATE POLICY "Circle members can view circles"
  ON circles FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR created_by = auth.uid()          -- lets the creator read back a new private circle
    OR public.is_circle_member(id)
  );

DROP POLICY IF EXISTS "Authenticated users can create circles" ON circles;
CREATE POLICY "Authenticated users can create circles"
  ON circles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Circle admins can update circles" ON circles;
CREATE POLICY "Circle admins can update circles"
  ON circles FOR UPDATE
  TO authenticated
  USING (public.is_circle_admin(id))
  WITH CHECK (public.is_circle_admin(id));

DROP POLICY IF EXISTS "Circle admins can delete circles" ON circles;
CREATE POLICY "Circle admins can delete circles"
  ON circles FOR DELETE
  TO authenticated
  USING (public.is_circle_admin(id));

-- ============================================
-- 3. circle_members
-- ============================================
DROP POLICY IF EXISTS "Circle members can view memberships" ON circle_members;
CREATE POLICY "Circle members can view memberships"
  ON circle_members FOR SELECT
  TO authenticated
  USING (public.is_circle_member(circle_id));

-- 006's INSERT policy, unchanged in logic, now scoped TO authenticated.
DROP POLICY IF EXISTS "Users can join public circles as members or own circles as admin" ON circle_members;
CREATE POLICY "Users can join public circles as members or own circles as admin"
  ON circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (
        role = 'member'
        AND EXISTS (
          SELECT 1 FROM circles c
          WHERE c.id = circle_members.circle_id
            AND c.is_public = true
        )
      )
      OR (
        role = 'admin'
        AND EXISTS (
          SELECT 1 FROM circles c
          WHERE c.id = circle_members.circle_id
            AND c.created_by = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can leave circles" ON circle_members;
CREATE POLICY "Users can leave circles"
  ON circle_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 4. circle_activities
-- ============================================
DROP POLICY IF EXISTS "Circle members can view activities" ON circle_activities;
CREATE POLICY "Circle members can view activities"
  ON circle_activities FOR SELECT
  TO authenticated
  USING (public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "Circle members can create activities as themselves" ON circle_activities;
CREATE POLICY "Circle members can create activities as themselves"
  ON circle_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "Authors and admins can delete activities" ON circle_activities;
CREATE POLICY "Authors and admins can delete activities"
  ON circle_activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_circle_admin(circle_id));

-- ============================================
-- 5. circle_challenges
-- ============================================
DROP POLICY IF EXISTS "Circle members can view challenges" ON circle_challenges;
CREATE POLICY "Circle members can view challenges"
  ON circle_challenges FOR SELECT
  TO authenticated
  USING (public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "Circle members can create challenges as themselves" ON circle_challenges;
CREATE POLICY "Circle members can create challenges as themselves"
  ON circle_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "Creators and admins can delete challenges" ON circle_challenges;
CREATE POLICY "Creators and admins can delete challenges"
  ON circle_challenges FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR public.is_circle_admin(circle_id));

-- ============================================
-- 6. 003 social tables (reactions, comments, posts)
-- ============================================
DROP POLICY IF EXISTS "Users can view reactions in their circles" ON activity_reactions;
CREATE POLICY "Users can view reactions in their circles"
  ON activity_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_activities ca
      WHERE ca.id = activity_reactions.activity_id
        AND public.is_circle_member(ca.circle_id)
    )
  );

DROP POLICY IF EXISTS "Users can add reactions in their circles" ON activity_reactions;
CREATE POLICY "Users can add reactions in their circles"
  ON activity_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM circle_activities ca
      WHERE ca.id = activity_reactions.activity_id
        AND public.is_circle_member(ca.circle_id)
    )
  );

DROP POLICY IF EXISTS "Users can remove their own reactions" ON activity_reactions;
CREATE POLICY "Users can remove their own reactions"
  ON activity_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view comments in their circles" ON activity_comments;
CREATE POLICY "Users can view comments in their circles"
  ON activity_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_activities ca
      WHERE ca.id = activity_comments.activity_id
        AND public.is_circle_member(ca.circle_id)
    )
  );

DROP POLICY IF EXISTS "Users can add comments in their circles" ON activity_comments;
CREATE POLICY "Users can add comments in their circles"
  ON activity_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM circle_activities ca
      WHERE ca.id = activity_comments.activity_id
        AND public.is_circle_member(ca.circle_id)
    )
  );

DROP POLICY IF EXISTS "Current members can update their own comments" ON activity_comments;
CREATE POLICY "Current members can update their own comments"
  ON activity_comments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM circle_activities ca
      WHERE ca.id = activity_comments.activity_id
        AND public.is_circle_member(ca.circle_id)
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM circle_activities ca
      WHERE ca.id = activity_comments.activity_id
        AND public.is_circle_member(ca.circle_id)
    )
  );

DROP POLICY IF EXISTS "Users can delete their own comments" ON activity_comments;
CREATE POLICY "Users can delete their own comments"
  ON activity_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view posts in their circles" ON circle_posts;
CREATE POLICY "Users can view posts in their circles"
  ON circle_posts FOR SELECT
  TO authenticated
  USING (public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "Users can create posts in their circles" ON circle_posts;
CREATE POLICY "Users can create posts in their circles"
  ON circle_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "Current members can update their own posts" ON circle_posts;
CREATE POLICY "Current members can update their own posts"
  ON circle_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.is_circle_member(circle_id))
  WITH CHECK (auth.uid() = user_id AND public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "Users can delete their own posts" ON circle_posts;
CREATE POLICY "Users can delete their own posts"
  ON circle_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 7. challenge_participants (membership + score)
-- ============================================
DROP POLICY IF EXISTS "Users can view challenge participants in their circles" ON challenge_participants;
CREATE POLICY "Users can view challenge participants in their circles"
  ON challenge_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_challenges cc
      WHERE cc.id = challenge_participants.challenge_id
        AND public.is_circle_member(cc.circle_id)
    )
  );

DROP POLICY IF EXISTS "Users can join challenges in their circles" ON challenge_participants;
CREATE POLICY "Users can join challenges in their circles"
  ON challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM circle_challenges cc
      WHERE cc.id = challenge_participants.challenge_id
        AND public.is_circle_member(cc.circle_id)
    )
  );

-- No client UPDATE: score and last_updated are the only mutable columns, and
-- the score must come from the server (service role or a SECURITY DEFINER
-- function). Nothing in src/ updates this table today.
DROP POLICY IF EXISTS "Users can update their own participation" ON challenge_participants;
DROP POLICY IF EXISTS "Current members can update their own participation" ON challenge_participants;

DROP POLICY IF EXISTS "Users can leave challenges" ON challenge_participants;
CREATE POLICY "Users can leave challenges"
  ON challenge_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Defence in depth: even with an INSERT policy (and any UPDATE policy added
-- later), a client role can't set a score. Joining starts at 0; an update keeps
-- the old score. The service role and SECURITY DEFINER functions (which run as
-- the table owner, so current_user is not anon/authenticated) may set it.
CREATE OR REPLACE FUNCTION public.protect_challenge_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND coalesce(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.score := 0;
    ELSE
      NEW.score := OLD.score;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_challenge_score ON challenge_participants;
CREATE TRIGGER trg_protect_challenge_score
BEFORE INSERT OR UPDATE ON challenge_participants
FOR EACH ROW
EXECUTE FUNCTION public.protect_challenge_score();

-- ============================================
-- 8. Streaks and badges: read-only for clients
-- ============================================
-- Written only by update_user_streak() (SECURITY DEFINER, fired from the
-- exercise_interactions trigger) or the service role.
DROP POLICY IF EXISTS "Users can insert own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can insert own badges" ON exercise_badges;

-- ============================================
-- 9. profiles
-- ============================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Signed-in users can read profiles of people they share a circle with" ON profiles;
CREATE POLICY "Signed-in users can read profiles of people they share a circle with"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.shares_circle_with(id));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- 10. Foreign keys: deleting a user must not fail or leave orphans
-- ============================================
-- profiles.id already cascades from auth.users. These 001 columns pointed at
-- profiles(id) with NO ACTION, so deleting an account that had created a
-- circle, posted an activity or created/won a challenge failed outright.
--   circle_activities.user_id   -> CASCADE  (the user's own feed items)
--   circles.created_by          -> SET NULL (shared: the circle survives for
--                                            its other members)
--   circle_challenges.created_by-> SET NULL (shared)
--   circle_challenges.winner_id -> SET NULL (shared)
CREATE OR REPLACE FUNCTION pg_temp.reset_profile_fk(
  p_table text, p_column text, p_action text
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_name text;
BEGIN
  FOR v_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.contype = 'f'
      AND con.conrelid = format('public.%I', p_table)::regclass
      AND array_length(con.conkey, 1) = 1
      AND att.attname = p_column
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', p_table, v_name);
  END LOOP;

  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE %s',
    p_table, p_table || '_' || p_column || '_fkey', p_column, p_action
  );
END;
$$;

DO $$
BEGIN
  PERFORM pg_temp.reset_profile_fk('circle_activities', 'user_id', 'CASCADE');
  PERFORM pg_temp.reset_profile_fk('circles', 'created_by', 'SET NULL');
  PERFORM pg_temp.reset_profile_fk('circle_challenges', 'created_by', 'SET NULL');
  PERFORM pg_temp.reset_profile_fk('circle_challenges', 'winner_id', 'SET NULL');
END
$$;

DROP FUNCTION pg_temp.reset_profile_fk(text, text, text);
