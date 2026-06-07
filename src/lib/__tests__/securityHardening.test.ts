import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), 'utf8');
}

describe('security hardening migrations and local config', () => {
  it('does not commit a concrete ngrok authtoken', () => {
    const ngrokConfig = readRepoFile('ngrok.yml');

    expect(ngrokConfig).not.toMatch(/^authtoken:/m);
  });

  it('adds a migration that blocks circle admin self-assignment and arbitrary private joins', () => {
    const migrationPath = 'supabase/migrations/006_security_hardening.sql';

    expect(existsSync(join(repoRoot, migrationPath))).toBe(true);

    const migration = readRepoFile(migrationPath);

    expect(migration).toMatch(/circle_members_role_check/);
    expect(migration).toMatch(/role\s*=\s*'member'/);
    expect(migration).toMatch(/role\s*=\s*'admin'/);
    expect(migration).toMatch(/c\.created_by\s*=\s*auth\.uid\(\)/);
    expect(migration).toMatch(/c\.is_public\s*=\s*true/);
    expect(migration).toMatch(/join_circle_by_invite/);
  });

  it('binds social write attribution to the authenticated user', () => {
    const migration = readRepoFile('supabase/migrations/006_security_hardening.sql');

    expect(migration).toMatch(/circle_activities[\s\S]+auth\.uid\(\)\s*=\s*user_id/);
    expect(migration).toMatch(/circle_challenges[\s\S]+auth\.uid\(\)\s*=\s*created_by/);
  });

  it('removes direct execution of security definer mutation RPCs', () => {
    const migration = readRepoFile('supabase/migrations/006_security_hardening.sql');

    expect(migration).toMatch(/REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.increment_exercise_stat/i);
    expect(migration).toMatch(/REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.update_user_streak/i);
  });
});
