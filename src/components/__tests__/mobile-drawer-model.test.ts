import { describe, expect, it } from 'vitest';
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

  it('builds grouped mobile nav metadata and appends trainer rows only when trainer mode is on', () => {
    const baseItems = buildMobileNavItems({ isTrainerMode: false, t });
    const trainerItems = buildMobileNavItems({ isTrainerMode: true, t });

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
