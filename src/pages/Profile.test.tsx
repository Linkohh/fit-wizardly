import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Profile } from './Profile';

const mocks = vi.hoisted(() => ({
  themeMode: 'system' as 'light' | 'dark' | 'system',
  setMode: vi.fn(),
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
  useThemeStore: (selector?: (state: {
    mode: 'light' | 'dark' | 'system';
    setMode: (mode: 'light' | 'dark' | 'system') => void;
  }) => unknown) => {
    const state = {
      mode: mocks.themeMode,
      setMode: mocks.setMode,
    };

    return selector ? selector(state) : state;
  },
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
    mocks.themeMode = 'system';
  });

  it('keeps the motion tilt switch and shows the enable affordance outside the hero', () => {
    render(<Profile />);

    expect(screen.getByText('Motion Tilt')).toBeInTheDocument();
    expect(screen.getByText('Motion tilt access')).toBeInTheDocument();
    expect(screen.getByText('Tap to enable motion tilt')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));

    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('uses the shared aetheric theme icon pill in app settings and dispatches theme changes', () => {
    render(<Profile />);

    const themeToggle = screen.getByTestId('profile-theme-toggle');
    const [lightButton, systemButton, darkButton] = within(themeToggle).getAllByRole('button');

    expect(themeToggle).toHaveClass('profile-theme-toggle');
    expect([lightButton, systemButton, darkButton].map((button) => button.getAttribute('aria-label'))).toEqual([
      'Light',
      'System',
      'Dark',
    ]);
    expect(lightButton).toHaveClass('profile-theme-button');
    expect(systemButton).toHaveClass('profile-theme-button');
    expect(darkButton).toHaveClass('profile-theme-button');
    expect(systemButton).toHaveAttribute('data-selected', 'true');
    expect(lightButton).toHaveAttribute('data-selected', 'false');
    expect(darkButton).toHaveAttribute('data-selected', 'false');

    fireEvent.click(lightButton);
    fireEvent.click(systemButton);
    fireEvent.click(darkButton);

    expect(mocks.setMode).toHaveBeenNthCalledWith(1, 'light');
    expect(mocks.setMode).toHaveBeenNthCalledWith(2, 'system');
    expect(mocks.setMode).toHaveBeenNthCalledWith(3, 'dark');
  });
});
