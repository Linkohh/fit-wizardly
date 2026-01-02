import type { Plan } from '@/types/fitness';

// Current schema version
export const CURRENT_SCHEMA_VERSION = 1;

// Migration functions from version N to N+1
const migrations: Record<number, (plan: any) => any> = {
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
export function migratePlan(plan: any): Plan {
    let currentVersion = plan.schemaVersion ?? 0;
    let migratedPlan = { ...plan };

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

    return migratedPlan as Plan;
}

/**
 * Check if a plan needs migration
 */
export function needsMigration(plan: any): boolean {
    const version = plan.schemaVersion ?? 0;
    return version < CURRENT_SCHEMA_VERSION;
}

/**
 * Validate that a plan has the correct schema version
 */
export function validateSchemaVersion(plan: any): { valid: boolean; version: number } {
    const version = plan.schemaVersion ?? 0;
    return {
        valid: version >= CURRENT_SCHEMA_VERSION,
        version,
    };
}

/**
 * Wrap plan store hydration with migration
 */
export function createMigrationMiddleware() {
    return (config: any) => (set: any, get: any, api: any) => {
        const origSetState = api.setState;

        api.setState = (state: any, replace?: boolean) => {
            // Migrate plans on state update if needed
            if (state.currentPlan && needsMigration(state.currentPlan)) {
                state.currentPlan = migratePlan(state.currentPlan);
            }
            if (state.planHistory) {
                state.planHistory = state.planHistory.map((plan: any) =>
                    needsMigration(plan) ? migratePlan(plan) : plan
                );
            }
            return origSetState(state, replace);
        };

        return config(set, get, api);
    };
}
