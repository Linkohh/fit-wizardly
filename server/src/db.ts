import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
const db = new Database(path.join(__dirname, '../../data/fitwizard.db'));

// Enable foreign keys
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    selections TEXT NOT NULL,
    split_type TEXT NOT NULL,
    workout_days TEXT NOT NULL,
    weekly_volume TEXT NOT NULL,
    rir_progression TEXT NOT NULL,
    notes TEXT NOT NULL,
    schema_version INTEGER DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
  CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at);
`);

// Plan CRUD operations
export interface DbPlan {
    id: string;
    user_id: string | null;
    created_at: string;
    updated_at: string;
    selections: string;
    split_type: string;
    workout_days: string;
    weekly_volume: string;
    rir_progression: string;
    notes: string;
    schema_version: number;
}

export function createPlan(plan: Omit<DbPlan, 'updated_at'>): DbPlan {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
    INSERT INTO plans (id, user_id, created_at, updated_at, selections, split_type, workout_days, weekly_volume, rir_progression, notes, schema_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    stmt.run(
        plan.id,
        plan.user_id,
        plan.created_at,
        now,
        plan.selections,
        plan.split_type,
        plan.workout_days,
        plan.weekly_volume,
        plan.rir_progression,
        plan.notes,
        plan.schema_version
    );

    return { ...plan, updated_at: now };
}

export function getPlanById(id: string): DbPlan | undefined {
    const stmt = db.prepare('SELECT * FROM plans WHERE id = ?');
    return stmt.get(id) as DbPlan | undefined;
}

export function getPlansByUserId(userId: string): DbPlan[] {
    const stmt = db.prepare('SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as DbPlan[];
}

export function getAllPlans(limit = 50): DbPlan[] {
    const stmt = db.prepare('SELECT * FROM plans ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit) as DbPlan[];
}

export function updatePlan(id: string, updates: Partial<DbPlan>): DbPlan | undefined {
    const existing = getPlanById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const merged = { ...existing, ...updates, updated_at: now };

    const stmt = db.prepare(`
    UPDATE plans SET
      selections = ?,
      split_type = ?,
      workout_days = ?,
      weekly_volume = ?,
      rir_progression = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `);

    stmt.run(
        merged.selections,
        merged.split_type,
        merged.workout_days,
        merged.weekly_volume,
        merged.rir_progression,
        merged.notes,
        now,
        id
    );

    return merged;
}

export function deletePlan(id: string): boolean {
    const stmt = db.prepare('DELETE FROM plans WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

export { db };
