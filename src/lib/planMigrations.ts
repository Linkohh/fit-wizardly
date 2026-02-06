import type { Plan } from '@/types/fitness';

// Current schema version
export const CURRENT_SCHEMA_VERSION = 1;

type PlanLike = Record<string, unknown> & { schemaVersion?: number };

// Migration functions from version N to N+1
const migrations: Record<number, (plan: PlanLike) => PlanLike> = {
    // v0 -> v1: Add schemaVersion field
    0: (plan) => ({
        ...plan,
        schemaVersion: 1,
    }),

    // Future migrations go here
    // 1: (plan) => ({ ...plan, newField: 'defaultValue', schemaVersion: 2 }),
};

/**
 * Migrate a plan from any version to the current version
 */
export function migratePlan(plan: unknown): Plan {
    const inputPlan = (plan ?? {}) as PlanLike;
    let currentVersion = inputPlan.schemaVersion ?? 0;
    let migratedPlan: PlanLike = { ...inputPlan };

    // Apply each migration in sequence
    while (currentVersion < CURRENT_SCHEMA_VERSION) {
        const migration = migrations[currentVersion];
        if (!migration) {
            console.warn(`No migration found for version ${currentVersion}`);
            break;
        }

        migratedPlan = migration(migratedPlan);
        currentVersion++;

        console.log(`Migrated plan from v${currentVersion - 1} to v${currentVersion}`);
    }

    return migratedPlan as unknown as Plan;
}

/**
 * Check if a plan needs migration
 */
export function needsMigration(plan: unknown): boolean {
    const version = ((plan ?? {}) as PlanLike).schemaVersion ?? 0;
    return version < CURRENT_SCHEMA_VERSION;
}

/**
 * Validate that a plan has the correct schema version
 */
export function validateSchemaVersion(plan: unknown): { valid: boolean; version: number } {
    const version = ((plan ?? {}) as PlanLike).schemaVersion ?? 0;
    return {
        valid: version >= CURRENT_SCHEMA_VERSION,
        version,
    };
}

/**
 * Wrap plan store hydration with migration
 */
export function createMigrationMiddleware() {
    type SetState = (state: unknown, replace?: boolean) => unknown;
    type ApiLike = { setState: SetState };
    type MiddlewareConfig = (set: unknown, get: unknown, api: ApiLike) => unknown;
    type PlanStoreStateLike = { currentPlan?: unknown; planHistory?: unknown[] } & Record<string, unknown>;

    return (config: MiddlewareConfig) => (set: unknown, get: unknown, api: ApiLike) => {
        const origSetState = api.setState;

        api.setState = (state: unknown, replace?: boolean) => {
            const nextState = state as PlanStoreStateLike;

            // Migrate plans on state update if needed
            if (nextState.currentPlan && needsMigration(nextState.currentPlan)) {
                nextState.currentPlan = migratePlan(nextState.currentPlan);
            }
            if (Array.isArray(nextState.planHistory)) {
                nextState.planHistory = nextState.planHistory.map((plan) =>
                    needsMigration(plan) ? migratePlan(plan) : plan
                );
            }
            return origSetState(nextState, replace);
        };

        return config(set, get, api);
    };
}
