import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Profile } from './Profile';

const mocks = vi.hoisted(() => ({
  updateSettings: vi.fn(),
  requestPermission: vi.fn(async () => ({
    available: true,
    permission: 'granted' as const,
    source: 'native' as const,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: () => ({
    mode: 'system',
    setMode: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUserPreferences', () => ({
  usePreferencesStore: () => ({
    settings: {
      sounds: true,
      haptics: true,
      motionTilt: true,
    },
    updateSettings: mocks.updateSettings,
  }),
}));

vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    shouldReduceMotion: false,
    prefersReducedMotion: false,
    reducedMotionEnabled: false,
  }),
}));

vi.mock('@/hooks/use-motion-tilt-status', () => ({
  useMotionTiltStatus: () => ({
    status: {
      available: true,
      permission: 'prompt',
      source: 'native',
    },
    isRefreshing: false,
    isRequestingPermission: false,
    refreshStatus: vi.fn(),
    requestPermission: mocks.requestPermission,
  }),
}));

vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: () => ({
    isTrainerMode: false,
    toggleTrainerMode: vi.fn(),
  }),
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: () => ({
    preferredWeightUnit: 'lbs',
    setPreferredWeightUnit: vi.fn(),
    planHistory: [],
    workoutLogs: [],
    personalRecords: [],
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      email: 'tester@example.com',
      user_metadata: {
        full_name: 'Test User',
      },
    },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/components/measurements/BodyTracker', () => ({
  BodyTracker: () => <div>Body tracker</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Profile motion tilt controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the motion tilt switch and shows the retry affordance outside the hero', () => {
    render(<Profile />);

    expect(screen.getByText('Motion Tilt')).toBeInTheDocument();
    expect(screen.getByText('Device motion access')).toBeInTheDocument();
    expect(screen.getByText('Needs device access')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));

    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);
  });
});
