import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import i18n, { LANGUAGE_STORAGE_KEY, getInitialLanguage } from '@/lib/i18n';
import { Profile } from './Profile';

/**
 * Uses the real i18n instance (no react-i18next mock) so the picker, the saved
 * choice and the translated labels are all exercised together.
 */

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
  useTrainerStore: (selector?: (state: {
    isTrainerMode: boolean;
    setTrainerMode: (enabled: boolean) => void;
  }) => unknown) => {
    const state = {
      isTrainerMode: false,
      setTrainerMode: vi.fn(),
    };

    return selector ? selector(state) : state;
  },
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: (selector?: (state: {
    preferredWeightUnit: 'lbs' | 'kg';
    setPreferredWeightUnit: (unit: 'lbs' | 'kg') => void;
    planHistory: unknown[];
    workoutLogs: unknown[];
    personalRecords: unknown[];
  }) => unknown) => {
    const state = {
      preferredWeightUnit: 'lbs' as const,
      setPreferredWeightUnit: vi.fn(),
      planHistory: [],
      workoutLogs: [],
      personalRecords: [],
    };

    return selector ? selector(state) : state;
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector?: (state: {
    user: {
      email: string;
      user_metadata: {
        full_name: string;
      };
    };
    profile: {
      is_trainer: boolean;
    };
    signOut: () => void;
  }) => unknown) => {
    const state = {
      user: {
        email: 'tester@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      },
      profile: {
        is_trainer: false,
      },
      signOut: vi.fn(),
    };

    return selector ? selector(state) : state;
  },
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

function openLanguagePicker() {
  const trigger = screen.getByTestId('profile-language-select');
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
  return trigger;
}

describe('Profile language picker', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  const originalHasPointerCapture = Element.prototype.hasPointerCapture;
  const originalReleasePointerCapture = Element.prototype.releasePointerCapture;

  beforeAll(() => {
    // Radix Select uses pointer capture and scrollIntoView, which jsdom does not implement.
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.releasePointerCapture = vi.fn();
  });

  afterAll(async () => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
    Element.prototype.hasPointerCapture = originalHasPointerCapture;
    Element.prototype.releasePointerCapture = originalReleasePointerCapture;
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    await i18n.changeLanguage('en');
  });

  beforeEach(async () => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('offers English and Español only', () => {
    render(<Profile />, { wrapper: MemoryRouter });

    openLanguagePicker();

    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['English', 'Español']);
  });

  it('saves Spanish, and after a re-render the Profile labels are in Spanish', async () => {
    const { unmount } = render(<Profile />, { wrapper: MemoryRouter });

    expect(screen.getByText('Language')).toBeInTheDocument();

    openLanguagePicker();
    await act(async () => {
      fireEvent.click(screen.getByRole('option', { name: 'Español' }));
    });

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');

    // Simulate a reload: start from the saved choice and render again.
    unmount();
    await act(async () => {
      await i18n.changeLanguage(getInitialLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY), 'en-US'));
    });
    render(<Profile />, { wrapper: MemoryRouter });

    expect(screen.getByText('Idioma')).toBeInTheDocument();
    expect(screen.getByText('Tema')).toBeInTheDocument();
    expect(screen.getByText('Unidad de peso')).toBeInTheDocument();
    expect(screen.getByText('Ajustes de la app')).toBeInTheDocument();
    expect(screen.queryByText('Language')).not.toBeInTheDocument();
  });
});
