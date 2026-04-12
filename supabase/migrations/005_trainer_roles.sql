-- ============================================
-- FitWizardly: Trainer role hardening
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_trainer BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'trainer'));

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_trainer_consistency_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_trainer_consistency_check
  CHECK (is_trainer = (role = 'trainer'));

CREATE OR REPLACE FUNCTION public.sync_profile_trainer_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.role() = 'service_role' THEN
      NEW.role := COALESCE(NEW.role, 'client');
      NEW.is_trainer := NEW.role = 'trainer';
    ELSE
      NEW.role := 'client';
      NEW.is_trainer := FALSE;
    END IF;

    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role' THEN
    NEW.role := COALESCE(NEW.role, OLD.role);
    NEW.is_trainer := NEW.role = 'trainer';
  ELSE
    NEW.role := OLD.role;
    NEW.is_trainer := OLD.is_trainer;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_sync_trainer_flags ON profiles;

CREATE TRIGGER trg_profiles_sync_trainer_flags
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_trainer_flags();
