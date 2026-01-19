import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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

// CORS configuration - specify allowed origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
];

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Server missing Supabase credentials. Authentication will fail.');
}

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limit for auth-related endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(limiter);
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

// Schema for exercise sets
const ExerciseSetSchema = z.object({
    reps: z.number().int().min(0).max(1000),
    weight: z.number().min(0).max(10000).optional(),
    rir: z.number().int().min(0).max(10).optional(),
    completed: z.boolean().optional(),
}).strict();

// Schema for exercises in a workout
const WorkoutExerciseSchema = z.object({
    exerciseId: z.string().min(1).max(100),
    name: z.string().min(1).max(200),
    sets: z.array(ExerciseSetSchema).max(20),
    notes: z.string().max(1000).optional(),
    muscleGroup: z.string().max(50).optional(),
}).strict();

// Schema for workout days
const WorkoutDaySchema = z.object({
    name: z.string().min(1).max(100),
    exercises: z.array(WorkoutExerciseSchema).max(50),
    notes: z.string().max(2000).optional(),
    dayIndex: z.number().int().min(0).max(6).optional(),
}).strict();

// Schema for weekly volume tracking
const WeeklyVolumeSchema = z.object({
    muscleGroup: z.string().min(1).max(50),
    sets: z.number().int().min(0).max(100),
    targetSets: z.number().int().min(0).max(100).optional(),
}).strict();

// Schema for RIR progression
const RirProgressionSchema = z.object({
    week: z.number().int().min(1).max(52),
    targetRir: z.number().int().min(0).max(10),
}).strict();

// Schema for plan notes
const PlanNoteSchema = z.object({
    id: z.string().max(100).optional(),
    content: z.string().max(5000),
    createdAt: z.string().datetime().optional(),
}).strict();

// Schema for plan selections (wizard choices)
const SelectionsSchema = z.object({
    goal: z.string().max(50).optional(),
    experienceLevel: z.string().max(50).optional(),
    equipment: z.array(z.string().max(50)).max(20).optional(),
    daysPerWeek: z.number().int().min(1).max(7).optional(),
    sessionDuration: z.number().int().min(15).max(240).optional(),
    muscleTargets: z.record(z.number().min(0).max(100)).optional(),
}).passthrough(); // Allow additional fields for flexibility

const CreatePlanSchema = z.object({
    id: z.string().uuid().optional(), // Client might generate ID
    selections: SelectionsSchema,
    splitType: z.string().min(1).max(50),
    workoutDays: z.array(WorkoutDaySchema).min(1).max(7),
    weeklyVolume: z.array(WeeklyVolumeSchema).max(50).default([]),
    rirProgression: z.array(RirProgressionSchema).max(52).default([]),
    notes: z.array(PlanNoteSchema).max(100).default([]),
    userId: z.string().uuid().optional() // Optional in body, forced from token
});

const UpdatePlanSchema = z.object({
    workoutDays: z.array(WorkoutDaySchema).min(1).max(7).optional(),
    notes: z.array(PlanNoteSchema).max(100).optional()
});

// Request logging
app.use((req, _res, next) => {
    const requestId = `req_${crypto.randomUUID()}`;
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
