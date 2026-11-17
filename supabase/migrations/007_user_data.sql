-- ============================================
-- FitWizardly: User data cloud tables (contract #3, roadmap 1.3)
-- ============================================
-- Gives every kind of per-user data a home in the cloud for the sync engine
-- (Lane E, contract #5). Same pattern as 004_plans_schema.sql:
--   * user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
--   * updated_at maintained by the existing set_updated_at() trigger (004)
--   * deleted_at is a tombstone; clients soft-delete instead of DELETE
--   * RLS on, four owner-only policies per table
--
-- Safe to run twice: CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
-- DROP TRIGGER/POLICY IF EXISTS before every CREATE.
-- Requires 004 (for plans and set_updated_at()).

-- ============================================
-- plans: tombstone column (used by Lane E, Day 7)
-- ============================================
ALTER TABLE plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS plans_user_updated_idx
  ON plans (user_id, updated_at);

-- ============================================
-- workout_logs
-- ============================================
CREATE TABLE IF NOT EXISTS workout_logs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  total_volume NUMERIC NOT NULL DEFAULT 0,
  log JSONB NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS workout_logs_user_completed_idx
  ON workout_logs (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS workout_logs_user_updated_idx
  ON workout_logs (user_id, updated_at);

-- ============================================
-- personal_records
-- ============================================
CREATE TABLE IF NOT EXISTS personal_records (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weight', 'reps', 'volume')),
  value NUMERIC NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL,
  record JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS personal_records_user_exercise_idx
  ON personal_records (user_id, exercise_id);
CREATE INDEX IF NOT EXISTS personal_records_user_updated_idx
  ON personal_records (user_id, updated_at);

-- ============================================
-- nutrition_days (one DailyNutritionLog per day)
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_days (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  log JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS nutrition_days_user_updated_idx
  ON nutrition_days (user_id, updated_at);

-- ============================================
-- nutrition_settings (one row per user)
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_settings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile JSONB,
  targets JSONB,
  custom_foods JSONB NOT NULL DEFAULT '[]',
  favorites JSONB NOT NULL DEFAULT '[]',
  saved_meals JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS nutrition_settings_user_updated_idx
  ON nutrition_settings (user_id, updated_at);

-- ============================================
-- body_measurements
-- ============================================
CREATE TABLE IF NOT EXISTS body_measurements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  measured_on DATE NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS body_measurements_user_updated_idx
  ON body_measurements (user_id, updated_at);

-- ============================================
-- readiness_entries (one ReadinessEntry per day)
-- ============================================
CREATE TABLE IF NOT EXISTS readiness_entries (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  entry JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS readiness_entries_user_updated_idx
  ON readiness_entries (user_id, updated_at);

-- ============================================
-- user_state (one row per user)
-- ============================================
CREATE TABLE IF NOT EXISTS user_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievements JSONB NOT NULL DEFAULT '{}',
  custom_exercises JSONB NOT NULL DEFAULT '[]',
  favorite_exercises JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS user_state_user_updated_idx
  ON user_state (user_id, updated_at);

-- ============================================
-- updated_at triggers (reuse set_updated_at() from 004)
-- ============================================
DROP TRIGGER IF EXISTS workout_logs_set_updated_at ON workout_logs;
CREATE TRIGGER workout_logs_set_updated_at
BEFORE UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS personal_records_set_updated_at ON personal_records;
CREATE TRIGGER personal_records_set_updated_at
BEFORE UPDATE ON personal_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS nutrition_days_set_updated_at ON nutrition_days;
CREATE TRIGGER nutrition_days_set_updated_at
BEFORE UPDATE ON nutrition_days
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS nutrition_settings_set_updated_at ON nutrition_settings;
CREATE TRIGGER nutrition_settings_set_updated_at
BEFORE UPDATE ON nutrition_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS body_measurements_set_updated_at ON body_measurements;
CREATE TRIGGER body_measurements_set_updated_at
BEFORE UPDATE ON body_measurements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS readiness_entries_set_updated_at ON readiness_entries;
CREATE TRIGGER readiness_entries_set_updated_at
BEFORE UPDATE ON readiness_entries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS user_state_set_updated_at ON user_state;
CREATE TRIGGER user_state_set_updated_at
BEFORE UPDATE ON user_state
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Row Level Security: owner-only, four policies per table
-- ============================================
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_state ENABLE ROW LEVEL SECURITY;

-- workout_logs
DROP POLICY IF EXISTS "Users can view own workout logs" ON workout_logs;
CREATE POLICY "Users can view own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workout logs" ON workout_logs;
CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workout logs" ON workout_logs;
CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workout logs" ON workout_logs;
CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- personal_records
DROP POLICY IF EXISTS "Users can view own personal records" ON personal_records;
CREATE POLICY "Users can view own personal records"
  ON personal_records FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own personal records" ON personal_records;
CREATE POLICY "Users can insert own personal records"
  ON personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own personal records" ON personal_records;
CREATE POLICY "Users can update own personal records"
  ON personal_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own personal records" ON personal_records;
CREATE POLICY "Users can delete own personal records"
  ON personal_records FOR DELETE
  USING (auth.uid() = user_id);

-- nutrition_days
DROP POLICY IF EXISTS "Users can view own nutrition days" ON nutrition_days;
CREATE POLICY "Users can view own nutrition days"
  ON nutrition_days FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own nutrition days" ON nutrition_days;
CREATE POLICY "Users can insert own nutrition days"
  ON nutrition_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own nutrition days" ON nutrition_days;
CREATE POLICY "Users can update own nutrition days"
  ON nutrition_days FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own nutrition days" ON nutrition_days;
CREATE POLICY "Users can delete own nutrition days"
  ON nutrition_days FOR DELETE
  USING (auth.uid() = user_id);

-- nutrition_settings
DROP POLICY IF EXISTS "Users can view own nutrition settings" ON nutrition_settings;
CREATE POLICY "Users can view own nutrition settings"
  ON nutrition_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own nutrition settings" ON nutrition_settings;
CREATE POLICY "Users can insert own nutrition settings"
  ON nutrition_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own nutrition settings" ON nutrition_settings;
CREATE POLICY "Users can update own nutrition settings"
  ON nutrition_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own nutrition settings" ON nutrition_settings;
CREATE POLICY "Users can delete own nutrition settings"
  ON nutrition_settings FOR DELETE
  USING (auth.uid() = user_id);

-- body_measurements
DROP POLICY IF EXISTS "Users can view own body measurements" ON body_measurements;
CREATE POLICY "Users can view own body measurements"
  ON body_measurements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own body measurements" ON body_measurements;
CREATE POLICY "Users can insert own body measurements"
  ON body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own body measurements" ON body_measurements;
CREATE POLICY "Users can update own body measurements"
  ON body_measurements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own body measurements" ON body_measurements;
CREATE POLICY "Users can delete own body measurements"
  ON body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- readiness_entries
DROP POLICY IF EXISTS "Users can view own readiness entries" ON readiness_entries;
CREATE POLICY "Users can view own readiness entries"
  ON readiness_entries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own readiness entries" ON readiness_entries;
CREATE POLICY "Users can insert own readiness entries"
  ON readiness_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own readiness entries" ON readiness_entries;
CREATE POLICY "Users can update own readiness entries"
  ON readiness_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own readiness entries" ON readiness_entries;
CREATE POLICY "Users can delete own readiness entries"
  ON readiness_entries FOR DELETE
  USING (auth.uid() = user_id);

-- user_state
DROP POLICY IF EXISTS "Users can view own user state" ON user_state;
CREATE POLICY "Users can view own user state"
  ON user_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user state" ON user_state;
CREATE POLICY "Users can insert own user state"
  ON user_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user state" ON user_state;
CREATE POLICY "Users can update own user state"
  ON user_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own user state" ON user_state;
CREATE POLICY "Users can delete own user state"
  ON user_state FOR DELETE
  USING (auth.uid() = user_id);
