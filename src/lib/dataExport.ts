/**
 * Builds the JSON payload for the Profile "Export my data" action
 * (GDPR Art. 20 - data portability).
 *
 * Pure function so it can be unit-tested without rendering the Profile page.
 * Existing top-level keys are kept unchanged so older backups stay readable;
 * new sections are additive.
 *
 * Rule from docs/SESSION_LOG.md: any new stored data type must be disclosed in
 * Legal.tsx AND included here.
 */

export interface NutritionExportSource {
    profile: unknown;
    targets: unknown;
    history: unknown;
    customFoods: unknown;
    favorites: unknown;
    savedMeals: unknown;
}

export interface UserDataExportSources {
    settings: unknown;
    planHistory: unknown;
    workoutLogs: unknown;
    personalRecords: unknown;
    readinessLogs: unknown;
    nutrition: NutritionExportSource;
    bodyMeasurements: unknown;
}

export interface UserDataExport extends UserDataExportSources {
    exportVersion: number;
    exportedAt: string;
}

export const USER_DATA_EXPORT_VERSION = 2;

export function buildUserDataExport(
    sources: UserDataExportSources,
    now: Date = new Date()
): UserDataExport {
    return {
        exportVersion: USER_DATA_EXPORT_VERSION,
        exportedAt: now.toISOString(),
        settings: sources.settings,
        planHistory: sources.planHistory,
        workoutLogs: sources.workoutLogs,
        personalRecords: sources.personalRecords,
        readinessLogs: sources.readinessLogs,
        nutrition: {
            profile: sources.nutrition.profile,
            targets: sources.nutrition.targets,
            history: sources.nutrition.history,
            customFoods: sources.nutrition.customFoods,
            favorites: sources.nutrition.favorites,
            savedMeals: sources.nutrition.savedMeals,
        },
        bodyMeasurements: sources.bodyMeasurements,
    };
}
