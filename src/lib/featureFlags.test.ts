import { afterEach, describe, expect, it, vi } from 'vitest';
import { isFeatureEnabled } from './featureFlags';

describe('isFeatureEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is off when the variable is not set', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', '');
    vi.stubEnv('VITE_FEATURE_COACH', '');

    expect(isFeatureEnabled('circles')).toBe(false);
    expect(isFeatureEnabled('coach')).toBe(false);
  });

  it('is on only for the value "true"', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');
    vi.stubEnv('VITE_FEATURE_COACH', ' TRUE ');

    expect(isFeatureEnabled('circles')).toBe(true);
    expect(isFeatureEnabled('coach')).toBe(true);
  });

  it('treats any other value as off', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', '1');
    vi.stubEnv('VITE_FEATURE_COACH', 'yes');

    expect(isFeatureEnabled('circles')).toBe(false);
    expect(isFeatureEnabled('coach')).toBe(false);
  });

  it('reads each flag independently', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');
    vi.stubEnv('VITE_FEATURE_COACH', 'false');

    expect(isFeatureEnabled('circles')).toBe(true);
    expect(isFeatureEnabled('coach')).toBe(false);
  });
});
