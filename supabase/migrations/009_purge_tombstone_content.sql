-- ============================================
-- FitWizardly: Wipe the content of deleted rows (DEBT-097)
-- ============================================
-- A signed-in delete is a tombstone: the sync engine sends
--   UPDATE <table> SET deleted_at = $at WHERE user_id = $me [AND <key> = $key]
-- (src/lib/sync/engine.ts, pushChanges), and a pushed row can also arrive as
-- an upsert that already carries deleted_at. Until this migration the row's
-- content stayed in the cloud until the account was deleted.
--
-- Decision (Lincoln, Day 7): wipe it. One BEFORE INSERT OR UPDATE trigger on
-- every synced table: when NEW.deleted_at IS NOT NULL, every content column is
-- replaced with an empty or neutral value that still satisfies the table's
-- NOT NULL and CHECK constraints. What stays:
--   * the key columns (user_id + id / day): the pull needs them to delete the
--     right local record, and the upsert needs them to find the row on revive
--   * deleted_at: it is the tombstone itself
--   * updated_at: the pull cursor (updated_at >= $cursor) finds the tombstone by it
--   * plans.created_at only: row metadata the client never re-sends (planToRow
--     omits it), so wiping it would leave a revived plan with a fake date.
--
-- Undelete still works: the client re-upserts full content with
-- deleted_at = NULL, the trigger does nothing for that row, and the upsert's
-- DO UPDATE writes the content back.
--
-- ORDER: apply to production only AFTER the client change that accepts pulled
-- tombstones with empty content has shipped (see docs/SUPABASE_MIGRATIONS.md).
--
-- Safe to run twice: CREATE OR REPLACE FUNCTION, DROP TRIGGER IF EXISTS before
-- every CREATE TRIGGER. It does not wipe tombstones that already exist; the
-- optional backfill is in docs/SUPABASE_MIGRATIONS.md.
-- Requires 004 and 007.

CREATE OR REPLACE FUNCTION public.purge_tombstone_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.deleted_at IS NULL THEN
    RETURN NEW;
  END IF;

  CASE TG_TABLE_NAME
    WHEN 'plans' THEN
      NEW.plan := '{}'::jsonb;
      NEW.schema_version := 1;
    WHEN 'workout_logs' THEN
      NEW.plan_id := '';
      NEW.completed_at := 'epoch'::timestamptz;
      NEW.total_volume := 0;
      NEW.log := '{}'::jsonb;
      NEW.schema_version := 1;
    WHEN 'personal_records' THEN
      NEW.exercise_id := '';
      NEW.type := 'weight';          -- CHECK allows only weight/reps/volume
      NEW.value := 0;
      NEW.achieved_at := 'epoch'::timestamptz;
      NEW.record := '{}'::jsonb;
    WHEN 'nutrition_days' THEN
      NEW.log := '{}'::jsonb;
    WHEN 'nutrition_settings' THEN
      NEW.profile := NULL;
      NEW.targets := NULL;
      NEW.custom_foods := '[]'::jsonb;
      NEW.favorites := '[]'::jsonb;
      NEW.saved_meals := '[]'::jsonb;
    WHEN 'body_measurements' THEN
      NEW.measured_on := 'epoch'::date;
      NEW.data := '{}'::jsonb;
    WHEN 'readiness_entries' THEN
      NEW.entry := '{}'::jsonb;
    WHEN 'user_state' THEN
      NEW.achievements := '{}'::jsonb;
      NEW.custom_exercises := '[]'::jsonb;
      NEW.favorite_exercises := '[]'::jsonb;
    ELSE
      -- Attached to a table this function doesn't know: fail loudly rather
      -- than keep content the caller expects to be wiped.
      RAISE EXCEPTION 'purge_tombstone_content: no column list for table %', TG_TABLE_NAME;
  END CASE;

  RETURN NEW;
END;
$$;

-- One trigger per synced table.
DROP TRIGGER IF EXISTS plans_purge_tombstone_content ON plans;
CREATE TRIGGER plans_purge_tombstone_content
BEFORE INSERT OR UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION public.purge_tombstone_content();

DROP TRIGGER IF EXISTS workout_logs_purge_tombstone_content ON workout_logs;
CREATE TRIGGER workout_logs_purge_tombstone_content
BEFORE INSERT OR UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION public.purge_tombstone_content();

DROP TRIGGER IF EXISTS personal_records_purge_tombstone_content ON personal_records;
CREATE TRIGGER personal_records_purge_tombstone_content
BEFORE INSERT OR UPDATE ON personal_records
FOR EACH ROW
EXECUTE FUNCTION public.purge_tombstone_content();

DROP TRIGGER IF EXISTS nutrition_days_purge_tombstone_content ON nutrition_days;
CREATE TRIGGER nutrition_days_purge_tombstone_content
BEFORE INSERT OR UPDATE ON nutrition_days
FOR EACH ROW
EXECUTE FUNCTION public.purge_tombstone_content();

DROP TRIGGER IF EXISTS nutrition_settings_purge_tombstone_content ON nutrition_settings;
CREATE TRIGGER nutrition_settings_purge_tombstone_content
BEFORE INSERT OR UPDATE ON nutrition_settings
FOR EACH ROW
EXECUTE FUNCTION public.purge_tombstone_content();

DROP TRIGGER IF EXISTS body_measurements_purge_tombstone_content ON body_measurements;
CREATE TRIGGER body_measurements_purge_tombstone_content
BEFORE INSERT OR UPDATE ON body_measurements
FOR EACH ROW
EXECUTE FUNCTION public.purge_tombstone_content();

DROP TRIGGER IF EXISTS readiness_entries_purge_tombstone_content ON readiness_entries;
CREATE TRIGGER readiness_entries_purge_tombstone_content
BEFORE INSERT OR UPDATE ON readiness_entries
FOR EACH ROW
EXECUTE FUNCTION public.purge_tombstone_content();

DROP TRIGGER IF EXISTS user_state_purge_tombstone_content ON user_state;
CREATE TRIGGER user_state_purge_tombstone_content
BEFORE INSERT OR UPDATE ON user_state
FOR EACH ROW
EXECUTE FUNCTION public.purge_tombstone_content();
