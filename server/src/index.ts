import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PlanPayloadSchema, type PlanPayload } from './schemas/plan.js';
import {
    upsertPlanForUser as upsertPlanForUserSupabase,
    listPlansForUser as listPlansForUserSupabase,
    getPlanForUser as getPlanForUserSupabase,
    deletePlanForUser as deletePlanForUserSupabase,
} from './supabasePlansRepo.js';

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
// const authLimiter = rateLimit({ ... }); // Reserved for future /auth endpoints

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
    authToken?: string;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================
const requireAuth = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ error: 'Server missing Supabase credentials' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    req.authToken = token;

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

// Request logging
app.use((req, _res, next) => {
    const requestId = `req_${crypto.randomUUID()}`;
    (req as express.Request & { id: string }).id = requestId;
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

// Create/Upsert plan
app.post('/plans', requireAuth, async (req: AuthRequest, res) => {
    try {
        const validation = PlanPayloadSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input', details: validation.error.format() });
        }

        const data = validation.data;
        const userId = req.user!.id; // Guaranteed by requireAuth
        const userToken = req.authToken!;

        // Enforce user ownership
        if (data.userId && data.userId !== userId) {
            return res.status(403).json({ error: 'Cannot create plan for another user' });
        }

        const now = new Date().toISOString();
        const { userId: _ignoreUserId, updatedAt: _ignoreUpdatedAt, ...planPayload } = data;
        const storedPlan = { ...planPayload, createdAt: data.createdAt || now };

	        const upserted = await upsertPlanForUserSupabase({
	            supabaseUrl: SUPABASE_URL!,
	            supabaseAnonKey: SUPABASE_ANON_KEY!,
	            userToken,
	            userId,
	            planId: data.id,
	            plan: storedPlan,
            schemaVersion: data.schemaVersion,
        });

        res.status(201).json(upserted);
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Failed to create plan' });
    }
});

// Get plans by user ID (Self only)
app.get('/plans', requireAuth, (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const userToken = req.authToken!;
        const requestedUserId = req.query.userId as string | undefined;

        // Only allow listing own plans
        if (requestedUserId && requestedUserId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to view these plans' });
        }

        listPlansForUserSupabase({
            supabaseUrl: SUPABASE_URL!,
            supabaseAnonKey: SUPABASE_ANON_KEY!,
            userToken,
            limit: 20,
        })
            .then((plans) => res.json(plans))
            .catch((error) => {
                console.error('Error fetching plans:', error);
                res.status(500).json({ error: 'Failed to fetch plans' });
            });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// Get plan by ID
app.get('/plans/:id', requireAuth, (req: AuthRequest, res) => {
    try {
        getPlanForUserSupabase({
            supabaseUrl: SUPABASE_URL!,
            supabaseAnonKey: SUPABASE_ANON_KEY!,
            userToken: req.authToken!,
            planId: req.params.id,
        })
            .then((plan) => {
                if (!plan) return res.status(404).json({ error: 'Plan not found' });
                res.json(plan);
            })
            .catch((error) => {
                console.error('Error fetching plan:', error);
                res.status(500).json({ error: 'Failed to fetch plan' });
            });
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
});

// Update plan
app.patch('/plans/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        // Accept partial updates by validating a partial payload
        const UpdateSchema = PlanPayloadSchema.pick({
            selections: true,
            splitType: true,
            workoutDays: true,
            weeklyVolume: true,
            rirProgression: true,
            notes: true,
            schemaVersion: true,
        }).partial();

        const validation = UpdateSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input', details: validation.error.format() });
        }

        const data = validation.data;

        const existing = await getPlanForUserSupabase({
            supabaseUrl: SUPABASE_URL!,
            supabaseAnonKey: SUPABASE_ANON_KEY!,
            userToken: req.authToken!,
            planId: req.params.id,
        });
        if (!existing) return res.status(404).json({ error: 'Plan not found' });

        const existingPlan = existing as unknown as Partial<PlanPayload>;
        const { userId: _ignoreUserId, updatedAt: _ignoreUpdatedAt, ...existingPayload } = existingPlan;
        const now = new Date().toISOString();
        const merged = {
            ...existingPayload,
            ...data,
            id: req.params.id,
            createdAt: existingPlan.createdAt || now,
        };

        const updated = await upsertPlanForUserSupabase({
            supabaseUrl: SUPABASE_URL!,
            supabaseAnonKey: SUPABASE_ANON_KEY!,
            userToken: req.authToken!,
            userId: req.user!.id,
            planId: req.params.id,
            plan: merged,
            schemaVersion: data.schemaVersion ?? existingPlan.schemaVersion ?? 1,
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
});

// Delete plan
app.delete('/plans/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        const deleted = await deletePlanForUserSupabase({
            supabaseUrl: SUPABASE_URL!,
            supabaseAnonKey: SUPABASE_ANON_KEY!,
            userToken: req.authToken!,
            planId: req.params.id,
        });
        if (!deleted) return res.status(404).json({ error: 'Plan not found' });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Failed to delete plan' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FitWizard API running on http://localhost:${PORT}`);
    console.log(`🔒 Security enabled: Auth & Validation active`);
});
