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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const currentFilePath = fileURLToPath(import.meta.url);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email?: string;
  };
  authToken?: string;
}

type VerifiedUser = NonNullable<AuthRequest['user']>;

type AppConfig = {
  port: number;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  allowedOrigins: string[];
};

type AppDependencies = {
  verifyAuthToken: (token: string, config: AppConfig) => Promise<VerifiedUser | null>;
  upsertPlanForUser: typeof upsertPlanForUserSupabase;
  listPlansForUser: typeof listPlansForUserSupabase;
  getPlanForUser: typeof getPlanForUserSupabase;
  deletePlanForUser: typeof deletePlanForUserSupabase;
  logger: Pick<Console, 'log' | 'warn' | 'error'>;
};

function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: Number(overrides.port ?? process.env.PORT ?? 3001),
    supabaseUrl: overrides.supabaseUrl ?? process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: overrides.supabaseAnonKey ?? process.env.VITE_SUPABASE_ANON_KEY,
    allowedOrigins:
      overrides.allowedOrigins ??
      process.env.ALLOWED_ORIGINS?.split(',') ?? [
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:3000',
      ],
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifySupabaseAuthToken(
  token: string,
  config: AppConfig
): Promise<VerifiedUser | null> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Server missing Supabase credentials');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  let response: Response;
  try {
    response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: config.supabaseAnonKey,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return { id: data.id, email: data.email };
}

function getDependencies(overrides: Partial<AppDependencies> = {}): AppDependencies {
  return {
    verifyAuthToken: overrides.verifyAuthToken ?? verifySupabaseAuthToken,
    upsertPlanForUser: overrides.upsertPlanForUser ?? upsertPlanForUserSupabase,
    listPlansForUser: overrides.listPlansForUser ?? listPlansForUserSupabase,
    getPlanForUser: overrides.getPlanForUser ?? getPlanForUserSupabase,
    deletePlanForUser: overrides.deletePlanForUser ?? deletePlanForUserSupabase,
    logger: overrides.logger ?? console,
  };
}

export function createApp(
  configOverrides: Partial<AppConfig> = {},
  dependencyOverrides: Partial<AppDependencies> = {}
) {
  const {
    config,
    deps,
    requireAuth,
    createPlan,
    listPlans,
    getPlan,
    updatePlan,
    deletePlan,
  } = createRouteHandlers(configOverrides, dependencyOverrides);
  const app = express();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (config.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(limiter);
  app.use(express.json());

  app.use((req, _res, next) => {
    const requestId = `req_${crypto.randomUUID()}`;
    (req as express.Request & { id: string }).id = requestId;
    deps.logger.log(`[${requestId}] ${req.method} ${req.path}`);
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/plans', requireAuth, createPlan);
  app.get('/plans', requireAuth, listPlans);
  app.get('/plans/:id', requireAuth, getPlan);
  app.patch('/plans/:id', requireAuth, updatePlan);
  app.delete('/plans/:id', requireAuth, deletePlan);

  return app;
}

export function createRouteHandlers(
  configOverrides: Partial<AppConfig> = {},
  dependencyOverrides: Partial<AppDependencies> = {}
) {
  const config = loadConfig(configOverrides);
  const deps = getDependencies(dependencyOverrides);

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    deps.logger.warn('Server missing Supabase credentials. Authentication will fail.');
  }

  const requireAuth = async (
    req: AuthRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return res.status(500).json({ error: 'Server missing Supabase credentials' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    req.authToken = token;

    try {
      const verifiedUser = await deps.verifyAuthToken(token, config);

      if (!verifiedUser) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = verifiedUser;
      next();
    } catch (error) {
      deps.logger.error('Auth verification failed:', error);
      res.status(500).json({ error: 'Internal authentication error' });
    }
  };

  const createPlan = async (req: AuthRequest, res: express.Response) => {
    try {
      const validation = PlanPayloadSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid input', details: validation.error.format() });
      }

      const data = validation.data;
      const userId = req.user!.id;
      const userToken = req.authToken!;

      if (data.userId && data.userId !== userId) {
        return res.status(403).json({ error: 'Cannot create plan for another user' });
      }

      const now = new Date().toISOString();
      // Strip all server-controlled timestamps from client payload — never trust client time
      const { userId: _ignoreUserId, updatedAt: _ignoreUpdatedAt, createdAt: _ignoreCreatedAt, ...planPayload } = data;
      const storedPlan = { ...planPayload, createdAt: now };

      const upserted = await deps.upsertPlanForUser({
        supabaseUrl: config.supabaseUrl!,
        supabaseAnonKey: config.supabaseAnonKey!,
        userToken,
        userId,
        planId: data.id,
        plan: storedPlan,
        schemaVersion: data.schemaVersion,
      });

      res.status(201).json(upserted);
    } catch (error) {
      deps.logger.error('Error creating plan:', error);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  };

  const listPlans = async (req: AuthRequest, res: express.Response) => {
    try {
      const userId = req.user!.id;
      const userToken = req.authToken!;
      const requestedUserId = req.query.userId as string | undefined;

      if (requestedUserId && requestedUserId !== userId) {
        return res.status(403).json({ error: 'Unauthorized to view these plans' });
      }

      const plans = await deps.listPlansForUser({
        supabaseUrl: config.supabaseUrl!,
        supabaseAnonKey: config.supabaseAnonKey!,
        userToken,
        limit: 20,
      });
      res.json(plans);
    } catch (error) {
      deps.logger.error('Error fetching plans:', error);
      res.status(500).json({ error: 'Failed to fetch plans' });
    }
  };

  const getPlan = async (req: AuthRequest, res: express.Response) => {
    try {
      const planId = req.params.id;
      if (!UUID_REGEX.test(planId)) {
        return res.status(400).json({ error: 'Invalid plan ID format' });
      }

      const userId = req.user!.id;
      const plan = await deps.getPlanForUser({
        supabaseUrl: config.supabaseUrl!,
        supabaseAnonKey: config.supabaseAnonKey!,
        userToken: req.authToken!,
        planId,
      });

      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      // Defense-in-depth: verify ownership even though RLS should already scope by auth.uid()
      const planData = plan as unknown as Partial<PlanPayload>;
      if (planData.userId && planData.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(plan);
    } catch (error) {
      deps.logger.error('Error fetching plan:', error);
      res.status(500).json({ error: 'Failed to fetch plan' });
    }
  };

  const updatePlan = async (req: AuthRequest, res: express.Response) => {
    try {
      const planId = req.params.id;
      if (!UUID_REGEX.test(planId)) {
        return res.status(400).json({ error: 'Invalid plan ID format' });
      }

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

      const existing = await deps.getPlanForUser({
        supabaseUrl: config.supabaseUrl!,
        supabaseAnonKey: config.supabaseAnonKey!,
        userToken: req.authToken!,
        planId,
      });
      if (!existing) return res.status(404).json({ error: 'Plan not found' });

      const existingPlan = existing as unknown as Partial<PlanPayload>;

      // Defense-in-depth: verify ownership even though RLS should already scope by auth.uid()
      if (existingPlan.userId && existingPlan.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { userId: _ignoreUserId, updatedAt: _ignoreUpdatedAt, ...existingPayload } = existingPlan;
      const now = new Date().toISOString();
      const merged = {
        ...existingPayload,
        ...data,
        id: planId,
        createdAt: existingPlan.createdAt || now,
      };

      const updated = await deps.upsertPlanForUser({
        supabaseUrl: config.supabaseUrl!,
        supabaseAnonKey: config.supabaseAnonKey!,
        userToken: req.authToken!,
        userId: req.user!.id,
        planId,
        plan: merged,
        schemaVersion: data.schemaVersion ?? existingPlan.schemaVersion ?? 1,
      });

      res.json(updated);
    } catch (error) {
      deps.logger.error('Error updating plan:', error);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  };

  const deletePlan = async (req: AuthRequest, res: express.Response) => {
    try {
      const planId = req.params.id;
      if (!UUID_REGEX.test(planId)) {
        return res.status(400).json({ error: 'Invalid plan ID format' });
      }

      const userId = req.user!.id;

      // Verify plan exists and belongs to this user before deleting
      const existing = await deps.getPlanForUser({
        supabaseUrl: config.supabaseUrl!,
        supabaseAnonKey: config.supabaseAnonKey!,
        userToken: req.authToken!,
        planId,
      });
      if (!existing) return res.status(404).json({ error: 'Plan not found' });

      const existingPlan = existing as unknown as Partial<PlanPayload>;
      if (existingPlan.userId && existingPlan.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const deleted = await deps.deletePlanForUser({
        supabaseUrl: config.supabaseUrl!,
        supabaseAnonKey: config.supabaseAnonKey!,
        userToken: req.authToken!,
        planId,
      });
      if (!deleted) return res.status(404).json({ error: 'Plan not found' });
      res.status(204).send();
    } catch (error) {
      deps.logger.error('Error deleting plan:', error);
      res.status(500).json({ error: 'Failed to delete plan' });
    }
  };

  return {
    config,
    deps,
    requireAuth,
    createPlan,
    listPlans,
    getPlan,
    updatePlan,
    deletePlan,
  };
}

export function startServer(
  configOverrides: Partial<AppConfig> = {},
  dependencyOverrides: Partial<AppDependencies> = {}
) {
  const config = loadConfig(configOverrides);
  const deps = getDependencies(dependencyOverrides);
  const app = createApp(config, deps);

  return app.listen(config.port, () => {
    deps.logger.log(`FitWizard API running on http://localhost:${config.port}`);
    deps.logger.log('Security enabled: Auth & Validation active');
  });
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === currentFilePath;

if (isDirectExecution) {
  startServer();
}

export default createApp;
