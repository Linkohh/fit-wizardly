import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    createPlan,
    getPlanById,
    getPlansByUserId,
    getAllPlans,
    updatePlan,
    deletePlan,
    type DbPlan
} from './db.js';

// Load environment variables from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Server missing Supabase credentials. Authentication will fail.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Type definition for authenticated request
interface AuthRequest extends express.Request {
    user?: {
        id: string;
        email?: string;
    };
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================
const requireAuth = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token with Supabase Auth API
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY || ''
            }
        });

        if (!response.ok) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const data = await response.json();
        req.user = { id: data.id, email: data.email };
        next();
    } catch (error) {
        console.error('Auth verification failed:', error);
        res.status(500).json({ error: 'Internal authentication error' });
    }
};

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================
const CreatePlanSchema = z.object({
    id: z.string().uuid().optional(), // Client might generate ID
    selections: z.record(z.any()), // Refine if possible
    splitType: z.string().min(1),
    workoutDays: z.array(z.any()),
    weeklyVolume: z.array(z.any()).default([]),
    rirProgression: z.array(z.any()).default([]),
    notes: z.array(z.any()).default([]),
    userId: z.string().uuid().optional() // Optional in body, forced from token
});

const UpdatePlanSchema = z.object({
    workoutDays: z.array(z.any()).optional(),
    notes: z.array(z.any()).optional()
});

// Request logging
app.use((req, _res, next) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // @ts-ignore
    req.id = requestId;
    console.log(`[${requestId}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// PLANS API
// ============================================================================

// Create plan
app.post('/plans', requireAuth, async (req: AuthRequest, res) => {
    try {
        const validation = CreatePlanSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input', details: validation.error.format() });
        }

        const data = validation.data;
        const userId = req.user!.id; // Guaranteed by requireAuth

        // Enforce user ownership
        if (data.userId && data.userId !== userId) {
            return res.status(403).json({ error: 'Cannot create plan for another user' });
        }

        const dbPlan: Omit<DbPlan, 'updated_at'> = {
            id: data.id || crypto.randomUUID(),
            user_id: userId,
            created_at: new Date().toISOString(),
            selections: JSON.stringify(data.selections),
            split_type: data.splitType,
            workout_days: JSON.stringify(data.workoutDays),
            weekly_volume: JSON.stringify(data.weeklyVolume),
            rir_progression: JSON.stringify(data.rirProgression),
            notes: JSON.stringify(data.notes),
            schema_version: 1,
        };

        const created = await createPlan(dbPlan);
        res.status(201).json(parsePlan(created));
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Failed to create plan' });
    }
});

// Get plans by user ID (Self only)
app.get('/plans', requireAuth, (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const requestedUserId = req.query.userId as string | undefined;

        // Only allow listing own plans
        if (requestedUserId && requestedUserId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to view these plans' });
        }

        const plans = getPlansByUserId(userId);
        res.json(plans.map(parsePlan));
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// Get plan by ID
app.get('/plans/:id', requireAuth, (req: AuthRequest, res) => {
    try {
        const plan = getPlanById(req.params.id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // Authorization check
        if (plan.user_id && plan.user_id !== req.user!.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(parsePlan(plan));
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
});

// Update plan
app.patch('/plans/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        // First check existence and ownership
        const plan = getPlanById(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        if (plan.user_id !== req.user!.id) return res.status(403).json({ error: 'Unauthorized' });

        const validation = UpdatePlanSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input', details: validation.error.format() });
        }

        const { workoutDays, notes } = validation.data;
        const updates: Partial<DbPlan> = {};

        if (workoutDays) updates.workout_days = JSON.stringify(workoutDays);
        if (notes) updates.notes = JSON.stringify(notes);

        const updated = await updatePlan(req.params.id, updates);
        res.json(parsePlan(updated!));
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
});

// Delete plan
app.delete('/plans/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        const plan = getPlanById(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        if (plan.user_id !== req.user!.id) return res.status(403).json({ error: 'Unauthorized' });

        const deleted = await deletePlan(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Failed to delete plan' });
    }
});

// Helper to parse DB plan to API format
function parsePlan(dbPlan: DbPlan) {
    return {
        id: dbPlan.id,
        userId: dbPlan.user_id,
        createdAt: dbPlan.created_at,
        updatedAt: dbPlan.updated_at,
        selections: JSON.parse(dbPlan.selections),
        splitType: dbPlan.split_type,
        workoutDays: JSON.parse(dbPlan.workout_days),
        weeklyVolume: JSON.parse(dbPlan.weekly_volume),
        rirProgression: JSON.parse(dbPlan.rir_progression),
        notes: JSON.parse(dbPlan.notes),
        schemaVersion: dbPlan.schema_version,
    };
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FitWizard API running on http://localhost:${PORT}`);
    console.log(`🔒 Security enabled: Auth & Validation active`);
});
