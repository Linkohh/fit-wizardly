import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define database schema
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

interface DbSchema {
  plans: DbPlan[];
}

// Initialize database
const defaultData: DbSchema = { plans: [] };
const dbPath = path.join(__dirname, '../data/db.json');
const adapter = new JSONFile<DbSchema>(dbPath);
const db = new Low<DbSchema>(adapter, defaultData);

// Read database on startup
await db.read();

// Helper to save after mutations
async function save() {
  await db.write();
}

// Plan CRUD operations
export async function createPlan(plan: Omit<DbPlan, 'updated_at'>): Promise<DbPlan> {
  const now = new Date().toISOString();
  const fullPlan: DbPlan = { ...plan, updated_at: now };

  db.data.plans.push(fullPlan);
  await save();

  return fullPlan;
}

export function getPlanById(id: string): DbPlan | undefined {
  return db.data.plans.find(p => p.id === id);
}

export function getPlansByUserId(userId: string): DbPlan[] {
  return db.data.plans
    .filter(p => p.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getAllPlans(limit = 50): DbPlan[] {
  return db.data.plans
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function updatePlan(id: string, updates: Partial<DbPlan>): Promise<DbPlan | undefined> {
  const index = db.data.plans.findIndex(p => p.id === id);
  if (index === -1) return undefined;

  const now = new Date().toISOString();
  db.data.plans[index] = { ...db.data.plans[index], ...updates, updated_at: now };
  await save();

  return db.data.plans[index];
}

export async function deletePlan(id: string): Promise<boolean> {
  const initialLength = db.data.plans.length;
  db.data.plans = db.data.plans.filter(p => p.id !== id);

  if (db.data.plans.length < initialLength) {
    await save();
    return true;
  }
  return false;
}

export { db };
