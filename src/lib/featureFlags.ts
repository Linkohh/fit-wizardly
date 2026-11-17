/**
 * Feature flags for surfaces that are not part of the v1 store release.
 *
 * Contract (docs/project/CONTRACTS.md): lanes call `isFeatureEnabled(flag)`
 * and never read the env variables directly, so tests can mock one function.
 *
 * Both flags default to off. Set `VITE_FEATURE_CIRCLES=true` or
 * `VITE_FEATURE_COACH=true` in `.env.local` (or in Vercel) to turn a surface on.
 */

export type FeatureFlag = 'circles' | 'coach';

const FLAG_ENV_KEYS: Record<FeatureFlag, 'VITE_FEATURE_CIRCLES' | 'VITE_FEATURE_COACH'> = {
  circles: 'VITE_FEATURE_CIRCLES',
  coach: 'VITE_FEATURE_COACH',
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const rawValue: unknown = import.meta.env[FLAG_ENV_KEYS[flag]];
  return typeof rawValue === 'string' && rawValue.trim().toLowerCase() === 'true';
}
