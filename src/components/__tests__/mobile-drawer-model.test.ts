import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildDrawerProfileViewModel,
  buildMobileNavItems,
  isMobileNavPathActive,
} from '@/components/header/mobile-drawer-model';

const t = (key: string, fallback?: string) => fallback ?? key;

describe('mobile drawer model', () => {
  it('marks nested trainer routes as active for their parent drawer entry', () => {
    expect(isMobileNavPathActive('/clients/alex-rivers', '/clients')).toBe(true);
    expect(isMobileNavPathActive('/history/2026-03-01', '/history')).toBe(true);
    expect(isMobileNavPathActive('/client', '/clients')).toBe(false);
    expect(isMobileNavPathActive('/', '/')).toBe(true);
    expect(isMobileNavPathActive('/history', '/')).toBe(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds grouped mobile nav metadata and appends trainer rows only when trainer mode is on', () => {
    const features = { circles: true, coach: true };
    const baseItems = buildMobileNavItems({ isTrainerMode: false, t, features });
    const trainerItems = buildMobileNavItems({ isTrainerMode: true, t, features });

    expect(baseItems.map((item) => item.path)).toEqual([
      '/',
      '/wizard',
      '/plan',
      '/exercises',
      '/history',
      '/analytics',
      '/circles',
      '/nutrition',
    ]);
    expect(trainerItems.slice(-3).map((item) => item.path)).toEqual([
      '/clients',
      '/templates',
      '/revenue',
    ]);
    expect(trainerItems.filter((item) => item.section === 'trainer')).toHaveLength(3);
  });

  it('leaves out Circles and every trainer row when both flags are off, even in trainer mode', () => {
    const items = buildMobileNavItems({
      isTrainerMode: true,
      t,
      features: { circles: false, coach: false },
    });

    expect(items.map((item) => item.path)).toEqual([
      '/',
      '/wizard',
      '/plan',
      '/exercises',
      '/history',
      '/analytics',
      '/nutrition',
    ]);
    expect(items.some((item) => item.section === 'trainer')).toBe(false);
  });

  it('gates Circles and trainer rows independently', () => {
    const circlesOnly = buildMobileNavItems({
      isTrainerMode: true,
      t,
      features: { circles: true, coach: false },
    });
    const coachOnly = buildMobileNavItems({
      isTrainerMode: true,
      t,
      features: { circles: false, coach: true },
    });

    expect(circlesOnly.map((item) => item.path)).toContain('/circles');
    expect(circlesOnly.some((item) => item.section === 'trainer')).toBe(false);
    expect(coachOnly.map((item) => item.path)).not.toContain('/circles');
    expect(coachOnly.filter((item) => item.section === 'trainer')).toHaveLength(3);
  });

  it('reads the build-time flags when no features are passed', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'false');
    vi.stubEnv('VITE_FEATURE_COACH', 'false');

    const defaultPaths = buildMobileNavItems({ isTrainerMode: true, t }).map((item) => item.path);
    expect(defaultPaths).not.toContain('/circles');
    expect(defaultPaths).not.toContain('/clients');

    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');
    vi.stubEnv('VITE_FEATURE_COACH', 'true');

    const enabledPaths = buildMobileNavItems({ isTrainerMode: true, t }).map((item) => item.path);
    expect(enabledPaths).toContain('/circles');
    expect(enabledPaths).toContain('/clients');
  });

  it('builds the profile view model using auth, profile, onboarding, and guest fallbacks', () => {
    expect(
      buildDrawerProfileViewModel({
        t,
        isTrainerMode: true,
        user: {
          email: 'alex@fitwizard.test',
          user_metadata: {
            full_name: 'Alex Rivers',
            avatar_url: 'https://cdn.fitwizard.test/alex.png',
          },
        },
        profile: {
          display_name: 'Coach Alex',
          avatar_url: null,
          experience_level: 'elite_level',
          primary_goal: 'strength',
        },
        onboarding: {
          displayName: 'Fallback Alex',
          avatarEmoji: '🔥',
          role: 'coach',
        },
      }),
    ).toMatchObject({
      displayName: 'Alex Rivers',
      subtitle: 'Elite Level • Strength',
      avatarUrl: 'https://cdn.fitwizard.test/alex.png',
      badge: 'Coach Mode',
      modeChipLabel: 'Coach Mode',
      initials: 'AR',
      avatarEmoji: null,
    });

    expect(
      buildDrawerProfileViewModel({
        t,
        isTrainerMode: false,
        user: null,
        profile: null,
        onboarding: {
          displayName: 'Nova',
          avatarEmoji: '⚡',
          role: 'user',
        },
      }),
    ).toMatchObject({
      displayName: 'Nova',
      subtitle: 'Personal training mode',
      avatarUrl: null,
      badge: null,
      modeChipLabel: 'Personal Mode',
      initials: 'N',
      avatarEmoji: '⚡',
    });

    expect(
      buildDrawerProfileViewModel({
        t,
        isTrainerMode: false,
        user: null,
        profile: null,
        onboarding: {
          displayName: '',
          avatarEmoji: '💪',
          role: 'user',
        },
      }),
    ).toMatchObject({
      displayName: 'Guest User',
      subtitle: 'Local Account',
      badge: null,
      modeChipLabel: 'Personal Mode',
      initials: 'GU',
      avatarEmoji: '💪',
    });
  });
});
