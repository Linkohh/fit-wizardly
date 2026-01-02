/**
 * Authentication & Authorization middleware
 * Stub implementation - to be replaced with real auth (JWT, OAuth, etc.)
 */

import { Request, Response, NextFunction } from 'express';

// User roles
export type UserRole = 'client' | 'trainer' | 'admin';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRole;
                email?: string;
            };
        }
    }
}

/**
 * Extract and validate auth token from request
 * Currently a stub - accepts any Bearer token as valid
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Allow unauthenticated requests for now (MVP)
        req.user = undefined;
        return next();
    }

    const token = authHeader.substring(7);

    // TODO: Validate JWT token
    // For MVP, just extract user info from a simple format
    try {
        // Stub: token format is "userId:role"
        const [userId, role] = token.split(':');

        if (userId && role && ['client', 'trainer', 'admin'].includes(role)) {
            req.user = {
                id: userId,
                role: role as UserRole,
            };
        }
    } catch {
        // Invalid token format
    }

    next();
}

/**
 * Require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: roles,
                current: req.user.role,
            });
        }

        next();
    };
}

/**
 * RBAC permission checks
 */
export const permissions = {
    // Plan permissions
    canViewPlan: (user: Request['user'], planOwnerId?: string) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.role === 'trainer') return true; // Trainers can view all plans
        return user.id === planOwnerId; // Clients can only view their own
    },

    canEditPlan: (user: Request['user'], planOwnerId?: string) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.id === planOwnerId; // Only owner or admin can edit
    },

    canDeletePlan: (user: Request['user'], planOwnerId?: string) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.id === planOwnerId;
    },

    // Client management (trainer-only)
    canManageClients: (user: Request['user']) => {
        if (!user) return false;
        return user.role === 'trainer' || user.role === 'admin';
    },

    // Admin-only
    canAccessAdmin: (user: Request['user']) => {
        return user?.role === 'admin';
    },
};

/**
 * Middleware to check plan access
 */
export function checkPlanAccess(action: 'view' | 'edit' | 'delete') {
    return (req: Request, res: Response, next: NextFunction) => {
        const planOwnerId = req.body?.userId || req.query?.userId as string;

        const checkFn = action === 'view'
            ? permissions.canViewPlan
            : action === 'edit'
                ? permissions.canEditPlan
                : permissions.canDeletePlan;

        if (!checkFn(req.user, planOwnerId)) {
            return res.status(403).json({ error: `Cannot ${action} this plan` });
        }

        next();
    };
}
