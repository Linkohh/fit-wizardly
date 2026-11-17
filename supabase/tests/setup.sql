-- ============================================
-- Local test harness: minimal Supabase stand-ins
-- ============================================
-- Runs on a throwaway plain-Postgres database BEFORE supabase/migrations/*.sql.
-- It recreates just enough of what a hosted Supabase project provides for the
-- migrations and RLS tests to behave the same way:
--   * schema `auth`, table `auth.users (id uuid primary key)`
--   * `auth.uid()` / `auth.role()` read from the `request.jwt.claim.*` settings
--   * roles `anon`, `authenticated`, `service_role`
--   * Supabase's default grants, so RLS (not missing GRANTs) is what blocks access
-- This is NOT a full Supabase emulation. Anything that depends on GoTrue,
-- storage, realtime or pg_net is out of scope.

-- Roles ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    -- Hosted Supabase gives service_role BYPASSRLS. Creating that attribute
    -- needs superuser, which the harness runs as.
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- auth schema -----------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY
);

-- Same contract as Supabase's auth.uid(): the JWT `sub` claim, or NULL when
-- there is no signed-in user. NULLIF guards against '' after RESET.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '')::text;
$$;

-- Realtime publication (001 adds tables to it) --------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Grants (mirror a fresh Supabase project) ------------------------------------
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
