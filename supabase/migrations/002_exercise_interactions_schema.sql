-- ============================================
-- FitWizardly: Exercise Interactions Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Exercise interactions tracking
-- Tracks views, favorites, performs, workout additions
CREATE TABLE IF NOT EXISTS exercise_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'favorite', 'unfavorite', 'perform', 'add_to_workout', 'add_to_collection')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User exercise preferences (synced from client)
-- Stores favorites, collections, filter presets, and settings
CREATE TABLE IF NOT EXISTS user_exercise_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorites TEXT[] DEFAULT '{}',
  collections JSONB DEFAULT '{}'::jsonb,
  filter_presets JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{"haptics": true, "sounds": false}'::jsonb,
  recently_viewed TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise community stats (aggregated data for "Community Pulse")
-- Stores daily/weekly exercise popularity
CREATE TABLE IF NOT EXISTS exercise_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id TEXT NOT NULL,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INT DEFAULT 0,
  perform_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  UNIQUE(exercise_id, stat_date)
);

-- User streaks tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  streak_started_at DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise badges earned
CREATE TABLE IF NOT EXISTS exercise_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_type)
);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE exercise_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercise_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_badges ENABLE ROW LEVEL SECURITY;

-- Exercise Interactions: Users can read/write their own
CREATE POLICY "Users can view own interactions"
  ON exercise_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interactions"
  ON exercise_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
  ON exercise_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- User Preferences: Users can read/write their own
CREATE POLICY "Users can view own preferences"
  ON user_exercise_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_exercise_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_exercise_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Exercise Stats: Public read (for community pulse)
CREATE POLICY "Exercise stats are public"
  ON exercise_stats FOR SELECT
  USING (true);

-- User Streaks: Users can read/write their own
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Exercise Badges: Users can read their own, public read for leaderboards
CREATE POLICY "Users can view own badges"
  ON exercise_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON exercise_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Functions for aggregating stats
-- ============================================

-- Function to increment exercise stat
CREATE OR REPLACE FUNCTION increment_exercise_stat(
  p_exercise_id TEXT,
  p_stat_type TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO exercise_stats (exercise_id, stat_date, view_count, perform_count, favorite_count)
  VALUES (
    p_exercise_id,
    CURRENT_DATE,
    CASE WHEN p_stat_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_stat_type = 'perform' THEN 1 ELSE 0 END,
    CASE WHEN p_stat_type = 'favorite' THEN 1 ELSE 0 END
  )
  ON CONFLICT (exercise_id, stat_date) DO UPDATE SET
    view_count = exercise_stats.view_count + CASE WHEN p_stat_type = 'view' THEN 1 ELSE 0 END,
    perform_count = exercise_stats.perform_count + CASE WHEN p_stat_type = 'perform' THEN 1 ELSE 0 END,
    favorite_count = exercise_stats.favorite_count + CASE WHEN p_stat_type = 'favorite' THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Function to get trending exercises (last 7 days)
CREATE OR REPLACE FUNCTION get_trending_exercises(p_limit INT DEFAULT 10)
RETURNS TABLE (
  exercise_id TEXT,
  total_views BIGINT,
  total_performs BIGINT,
  total_favorites BIGINT,
  trend_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    es.exercise_id,
    SUM(es.view_count)::BIGINT as total_views,
    SUM(es.perform_count)::BIGINT as total_performs,
    SUM(es.favorite_count)::BIGINT as total_favorites,
    (SUM(es.view_count) + SUM(es.perform_count) * 5 + SUM(es.favorite_count) * 3)::BIGINT as trend_score
  FROM exercise_stats es
  WHERE es.stat_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY es.exercise_id
  ORDER BY trend_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INT;
  v_longest_streak INT;
BEGIN
  -- Get current streak data
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM user_streaks WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- First activity
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_started_at)
    VALUES (p_user_id, 1, 1, CURRENT_DATE, CURRENT_DATE);
  ELSIF v_last_date = CURRENT_DATE THEN
    -- Already logged today, do nothing
    NULL;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
    UPDATE user_streaks SET
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_activity_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken, reset
    UPDATE user_streaks SET
      current_streak = 1,
      last_activity_date = CURRENT_DATE,
      streak_started_at = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_exercise_interactions_user ON exercise_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_interactions_exercise ON exercise_interactions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_interactions_type ON exercise_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_exercise_interactions_created ON exercise_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_stats_exercise ON exercise_stats(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_stats_date ON exercise_stats(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_badges_user ON exercise_badges(user_id);

-- ============================================
-- Trigger to update stats on interaction
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_exercise_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.interaction_type IN ('view', 'perform', 'favorite') THEN
    PERFORM increment_exercise_stat(NEW.exercise_id, NEW.interaction_type);
  END IF;

  -- Update streak on perform
  IF NEW.interaction_type = 'perform' THEN
    PERFORM update_user_streak(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER on_exercise_interaction
  AFTER INSERT ON exercise_interactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_exercise_stats();
