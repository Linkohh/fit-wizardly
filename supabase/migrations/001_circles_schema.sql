-- ============================================
-- FitWizardly: Accountability Circles Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Users profile (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  experience_level TEXT,
  primary_goal TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circles (accountability groups)
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  max_members INT DEFAULT 5,
  is_public BOOLEAN DEFAULT false,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle memberships
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Activity feed
CREATE TABLE IF NOT EXISTS circle_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly challenges
CREATE TABLE IF NOT EXISTS circle_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_challenges ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Circles: Members can read their circles
CREATE POLICY "Circle members can view circles"
  ON circles FOR SELECT
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
    OR is_public = true
  );

CREATE POLICY "Authenticated users can create circles"
  ON circles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Circle admins can update circles"
  ON circles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_id = circles.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Circle Members: Read access for members
CREATE POLICY "Circle members can view memberships"
  ON circle_members FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join circles"
  ON circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave circles"
  ON circle_members FOR DELETE
  USING (user_id = auth.uid());

-- Activities: Members can read and create
CREATE POLICY "Circle members can view activities"
  ON circle_activities FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Circle members can create activities"
  ON circle_activities FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

-- Challenges: Members can read, admins can create
CREATE POLICY "Circle members can view challenges"
  ON circle_challenges FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Circle members can create challenges"
  ON circle_challenges FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Enable Real-time for activities
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE circle_activities;

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_activities_circle ON circle_activities(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_activities_created ON circle_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_circles_invite_code ON circles(invite_code);
