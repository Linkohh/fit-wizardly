import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/Header';

const mocks = vi.hoisted(() => ({
  setMode: vi.fn(),
  setMotionTiltActivatedThisSession: vi.fn(),
  toggleTrainerMode: vi.fn(),
  requestPermission: vi.fn(async () => ({
    available: true,
    permission: 'granted' as const,
    source: 'web' as const,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => false,
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: () => ({
    mode: 'dark',
    setMode: mocks.setMode,
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: {
    user: {
      email: string | null;
      user_metadata?: {
        full_name?: string | null;
        avatar_url?: string | null;
      } | null;
    } | null;
    profile: {
      display_name: string | null;
      avatar_url: string | null;
      experience_level: string | null;
      primary_goal: string | null;
    } | null;
  }) => unknown) =>
    selector({
      user: null,
      profile: null,
    }),
}));

vi.mock('@/stores/onboardingStore', () => ({
  useOnboardingStore: (selector: (state: {
    userData: {
      displayName: string;
      avatarEmoji: string;
      role: 'user' | 'coach';
    };
  }) => unknown) =>
    selector({
      userData: {
        displayName: 'Coach Nova',
        avatarEmoji: '⚡',
        role: 'coach',
      },
    }),
}));

vi.mock('@/hooks/useUserPreferences', () => ({
  usePreferencesStore: Object.assign(
    (selector: (state: { settings: { motionTilt?: boolean } }) => unknown) =>
      selector({
        settings: {
          motionTilt: true,
        },
      }),
    {
      getState: () => ({
        setMotionTiltActivatedThisSession: mocks.setMotionTiltActivatedThisSession,
      }),
    },
  ),
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
      source: 'web',
    },
    isRefreshing: false,
    isRequestingPermission: false,
    refreshStatus: vi.fn(),
    requestPermission: mocks.requestPermission,
  }),
}));

vi.mock('@/stores/trainerStore', () => {
  const useTrainerStore = Object.assign(
    () => ({
      isTrainerMode: true,
    }),
    {
      getState: () => ({
        toggleTrainerMode: mocks.toggleTrainerMode,
      }),
    },
  );

  return { useTrainerStore };
});

vi.mock('@/components/ui/sheet', async () => {
  const React = await import('react');

  type SheetContextValue = {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  };

  const SheetContext = React.createContext<SheetContextValue>({ open: false });

  const Sheet = ({
    open = false,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }) => <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>;

  const SheetTrigger = ({ children }: { children: React.ReactNode }) => {
    const { onOpenChange } = React.useContext(SheetContext);
    return (
      <div data-testid="sheet-trigger" onClick={() => onOpenChange?.(true)}>
        {children}
      </div>
    );
  };

  const SheetContent = ({
    className,
    children,
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    const { open } = React.useContext(SheetContext);
    if (!open) return null;
    return (
      <div data-testid="mobile-sheet-content" className={className}>
        {children}
      </div>
    );
  };

  return {
    Sheet,
    SheetTrigger,
    SheetContent,
  };
});

describe('Header mobile menu layout', () => {
  it('tags the brand logo and menu trigger with explicit mobile feedback events', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByAltText('FitWizard Logo').closest('a')).toHaveAttribute(
      'data-click-feedback-event',
      'brandHome',
    );
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute(
      'data-click-feedback-event',
      'navigation',
    );
  });

  it('renders the aetheric drawer shell with profile header, trainer section, and sticky footer controls', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const sheetContent = screen.getByTestId('mobile-sheet-content');
    expect(sheetContent).toHaveClass('flex', 'flex-col', 'overflow-hidden');
    expect(sheetContent.className).toContain('h-[100svh]');
    expect(sheetContent.className).toContain('supports-[height:100dvh]:h-[100dvh]');
    expect(sheetContent.className).toContain('max-h-[100dvh]');
    expect(sheetContent.className).toContain('pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]');

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(mobileNav).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto', 'overscroll-contain');

    const profile = within(sheetContent).getByTestId('mobile-drawer-profile');
    expect(within(profile).getByText('Coach Nova')).toBeInTheDocument();
    expect(within(profile).getByText('Coach control surface')).toBeInTheDocument();
    expect(within(profile).getByText('Pro Trainer Mode')).toBeInTheDocument();
    expect(within(profile).getByText('⚡')).toBeInTheDocument();

    expect(within(sheetContent).getByText('Clients')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Trainer tools')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Motion Tilt')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Tap to enable motion tilt')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Theme')).toBeInTheDocument();

    const footer = within(sheetContent).getByTestId('mobile-drawer-footer');
    expect(within(footer).getByText('Settings & Profile')).toBeInTheDocument();
    expect(within(footer).getByText('Trainer Mode')).toBeInTheDocument();
    expect(within(footer).getByText('Aetheric controls')).toBeInTheDocument();
    expect(within(footer).getByRole('switch', { name: 'Trainer Mode' })).toBeChecked();

    const trainerLinks = ['Clients', 'Templates', 'Revenue'];
    for (const label of trainerLinks) {
      expect(within(mobileNav).getByRole('link', { name: label })).toBeInTheDocument();
    }

    fireEvent.click(within(footer).getByRole('button', { name: 'Enable motion tilt' }));
    await waitFor(() => {
      expect(mocks.setMotionTiltActivatedThisSession).toHaveBeenNthCalledWith(1, false);
      expect(mocks.setMotionTiltActivatedThisSession).toHaveBeenNthCalledWith(2, true);
    });
    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
  });
});
