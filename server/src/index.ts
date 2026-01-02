import express from 'express';
import cors from 'cors';
import {
    createPlan,
    getPlanById,
    getPlansByUserId,
    getAllPlans,
    updatePlan,
    deletePlan,
    type DbPlan
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    console.log(`[${requestId}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// PLANS API
// ============================================================================

// Create plan
app.post('/plans', (req, res) => {
    try {
        const { id, selections, splitType, workoutDays, weeklyVolume, rirProgression, notes, userId } = req.body;

        if (!id || !selections || !splitType || !workoutDays) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const dbPlan: Omit<DbPlan, 'updated_at'> = {
            id,
            user_id: userId || null,
            created_at: new Date().toISOString(),
            selections: JSON.stringify(selections),
            split_type: splitType,
            workout_days: JSON.stringify(workoutDays),
            weekly_volume: JSON.stringify(weeklyVolume || []),
            rir_progression: JSON.stringify(rirProgression || []),
            notes: JSON.stringify(notes || []),
            schema_version: 1,
        };

        const created = createPlan(dbPlan);
        res.status(201).json(parsePlan(created));
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Failed to create plan' });
    }
});

// Get plan by ID
app.get('/plans/:id', (req, res) => {
    try {
        const plan = getPlanById(req.params.id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        res.json(parsePlan(plan));
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
});

// Get plans by user ID
app.get('/plans', (req, res) => {
    try {
        const userId = req.query.userId as string | undefined;
        const plans = userId ? getPlansByUserId(userId) : getAllPlans();
        res.json(plans.map(parsePlan));
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// Update plan
app.patch('/plans/:id', (req, res) => {
    try {
        const { workoutDays, notes } = req.body;
        const updates: Partial<DbPlan> = {};

        if (workoutDays) updates.workout_days = JSON.stringify(workoutDays);
        if (notes) updates.notes = JSON.stringify(notes);

        const updated = updatePlan(req.params.id, updates);
        if (!updated) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        res.json(parsePlan(updated));
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
});

// Delete plan
app.delete('/plans/:id', (req, res) => {
    try {
        const deleted = deletePlan(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Plan not found' });
        }
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
});
