-- ============================================
-- FitWizardly: Security hardening
-- ============================================
-- Tightens circle membership/social RLS while preserving the existing app flows:
-- - circle creators can still become admins for their own circles
-- - invite-code joins still work through join_circle_by_invite()
-- - members can still post activities and create challenges as themselves

ALTER TABLE circle_members
  DROP CONSTRAINT IF EXISTS circle_members_role_check;

ALTER TABLE circle_members
  ADD CONSTRAINT circle_members_role_check
  CHECK (role IN ('admin', 'member'));

DROP POLICY IF EXISTS "Users can join circles" ON circle_members;

CREATE POLICY "Users can join public circles as members or own circles as admin"
  ON circle_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (
        role = 'member'
        AND EXISTS (
          SELECT 1
          FROM circles c
          WHERE c.id = circle_members.circle_id
          AND c.is_public = true
        )
      )
      OR (
        role = 'admin'
        AND EXISTS (
          SELECT 1
          FROM circles c
          WHERE c.id = circle_members.circle_id
          AND c.created_by = auth.uid()
        )
      )
    )
  );

CREATE OR REPLACE FUNCTION public.join_circle_by_invite(p_invite_code TEXT)
RETURNS TABLE (
  circle_id UUID,
  circle_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_circle circles%ROWTYPE;
  v_member_count INT;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_circle
  FROM circles
  WHERE invite_code = UPPER(TRIM(p_invite_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM circle_members cm
    WHERE cm.circle_id = v_circle.id
    AND cm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Already a member of this circle';
  END IF;

  SELECT COUNT(*)
  INTO v_member_count
  FROM circle_members cm
  WHERE cm.circle_id = v_circle.id;

  IF v_circle.max_members IS NOT NULL AND v_member_count >= v_circle.max_members THEN
    RAISE EXCEPTION 'Circle is full';
  END IF;

  INSERT INTO circle_members (circle_id, user_id, role)
  VALUES (v_circle.id, v_user_id, 'member');

  RETURN QUERY
  SELECT v_circle.id, v_circle.name;
END;
$$;

REVOKE ALL ON FUNCTION public.join_circle_by_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_circle_by_invite(TEXT) TO authenticated;

DROP POLICY IF EXISTS "Circle members can create activities" ON circle_activities;

CREATE POLICY "Circle members can create activities as themselves"
  ON circle_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND circle_id IN (
      SELECT circle_id
      FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Circle members can create challenges" ON circle_challenges;

CREATE POLICY "Circle members can create challenges as themselves"
  ON circle_challenges FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND circle_id IN (
      SELECT circle_id
      FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own comments" ON activity_comments;

CREATE POLICY "Current members can update their own comments"
  ON activity_comments FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM circle_activities ca
      JOIN circle_members cm ON ca.circle_id = cm.circle_id
      WHERE ca.id = activity_comments.activity_id
      AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM circle_activities ca
      JOIN circle_members cm ON ca.circle_id = cm.circle_id
      WHERE ca.id = activity_comments.activity_id
      AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own posts" ON circle_posts;

CREATE POLICY "Current members can update their own posts"
  ON circle_posts FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM circle_members cm
      WHERE cm.circle_id = circle_posts.circle_id
      AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM circle_members cm
      WHERE cm.circle_id = circle_posts.circle_id
      AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own participation" ON challenge_participants;

CREATE POLICY "Current members can update their own participation"
  ON challenge_participants FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM circle_challenges cc
      JOIN circle_members cm ON cc.circle_id = cm.circle_id
      WHERE cc.id = challenge_participants.challenge_id
      AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM circle_challenges cc
      JOIN circle_members cm ON cc.circle_id = cm.circle_id
      WHERE cc.id = challenge_participants.challenge_id
      AND cm.user_id = auth.uid()
    )
  );

REVOKE EXECUTE ON FUNCTION public.increment_exercise_stat(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_exercise_stat(TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(UUID) FROM authenticated;
