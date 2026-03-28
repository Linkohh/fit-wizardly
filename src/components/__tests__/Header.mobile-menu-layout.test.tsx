import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/Header';

const mocks = vi.hoisted(() => ({
  themeMode: 'system' as 'light' | 'dark' | 'system',
  resolvedTheme: 'light' as 'light' | 'dark',
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
  useThemeStore: (selector?: (state: {
    mode: 'light' | 'dark' | 'system';
    setMode: (mode: 'light' | 'dark' | 'system') => void;
    getEffectiveTheme: () => 'light' | 'dark';
  }) => unknown) => {
    const state = {
      mode: mocks.themeMode,
      setMode: mocks.setMode,
      getEffectiveTheme: () => mocks.resolvedTheme,
    };

    return selector ? selector(state) : state;
  },
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
    glassEffect: _glassEffect,
    enableGestures: _enableGestures,
    showDragHandle: _showDragHandle,
    onGestureClose: _onGestureClose,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
    glassEffect?: boolean;
    enableGestures?: boolean;
    showDragHandle?: boolean;
    onGestureClose?: () => void;
    [key: string]: unknown;
  }) => {
    const { open } = React.useContext(SheetContext);
    if (!open) return null;
    return (
      <div data-testid="mobile-sheet-content" className={className} {...props}>
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
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.themeMode = 'system';
    mocks.resolvedTheme = 'light';
  });

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
    expect(sheetContent).toHaveClass('aetheric-drawer--scooped', 'flex', 'flex-col', 'overflow-hidden');
    expect(sheetContent.className).toContain('overflow-x-hidden');
    expect(sheetContent.className).toContain('h-[100svh]');
    expect(sheetContent.className).toContain('supports-[height:100dvh]:h-[100dvh]');
    expect(sheetContent.className).toContain('max-h-[100dvh]');
    expect(sheetContent.className).toContain('pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]');
    expect(sheetContent).toHaveAttribute('data-theme-mode', 'system');
    expect(sheetContent).toHaveAttribute('data-resolved-theme', 'light');

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(mobileNav).toHaveClass('overscroll-contain', 'overflow-x-hidden');
    expect(screen.getByTestId('mobile-drawer-scroll-area')).toHaveClass(
      'flex-1',
      'min-h-0',
      'overflow-hidden',
    );

    const profile = within(sheetContent).getByTestId('mobile-drawer-profile');
    const profileLayout = profile.firstElementChild as HTMLElement | null;
    expect(profileLayout).not.toBeNull();
    expect(profileLayout).toHaveClass('aetheric-drawer__profile-layout');
    const profileBody = profileLayout?.lastElementChild as HTMLElement | null;
    expect(profileBody).not.toBeNull();
    expect(profileBody).toHaveClass('aetheric-drawer__profile-body');
    expect(within(profile).getByText('Coach Nova')).toBeInTheDocument();
    expect(within(profile).getByText('Coach workspace')).toBeInTheDocument();
    expect(within(profile).getByText('Coach Mode')).toBeInTheDocument();
    expect(within(profile).getByText('⚡')).toBeInTheDocument();
    expect(within(profile).queryByText('System • Light')).not.toBeInTheDocument();

    expect(within(sheetContent).getByText('Clients')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Coach Tools')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Motion Tilt')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Tap to enable motion tilt')).toBeInTheDocument();

    const footer = within(sheetContent).getByTestId('mobile-drawer-footer');
    const utilityCard = within(footer).getByTestId('mobile-drawer-utility-card');
    expect(utilityCard).toHaveClass('aetheric-drawer__utility-card');

    const utilityTopRow = within(utilityCard).getByTestId('mobile-drawer-utility-top-row');
    expect(utilityTopRow).toHaveClass('aetheric-drawer__utility-top-row');

    const utilityActions = within(utilityTopRow).getByTestId('mobile-drawer-utility-actions');
    expect(utilityActions).toHaveClass('aetheric-drawer__utility-actions');

    const trainerCluster = within(utilityActions).getByTestId('mobile-drawer-trainer-cluster');
    expect(trainerCluster).toHaveClass('aetheric-drawer__trainer-switch-cluster');

    expect(within(footer).getByText('Settings & Profile')).toBeInTheDocument();
    expect(within(footer).getByText('Coach Mode')).toBeInTheDocument();
    expect(within(footer).getByText('FitWizard')).toBeInTheDocument();
    expect(within(footer).getByText('Quick Controls')).toBeInTheDocument();
    expect(within(trainerCluster).getByRole('switch', { name: 'Coach Mode' })).toBeChecked();
    const themeButtons = within(screen.getByTestId('mobile-drawer-theme-toggle')).getAllByRole('button');
    expect(themeButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Light',
      'System',
      'Dark',
    ]);

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

  it('dispatches direct theme mode changes from the quick controls buttons', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const footer = screen.getByTestId('mobile-drawer-footer');

    fireEvent.click(within(footer).getByRole('button', { name: 'Light' }));
    fireEvent.click(within(footer).getByRole('button', { name: 'System' }));
    fireEvent.click(within(footer).getByRole('button', { name: 'Dark' }));

    expect(mocks.setMode).toHaveBeenNthCalledWith(1, 'light');
    expect(mocks.setMode).toHaveBeenNthCalledWith(2, 'system');
    expect(mocks.setMode).toHaveBeenNthCalledWith(3, 'dark');
  });

  it('switches the drawer chrome to dark aetheric mode when the resolved theme is dark', () => {
    mocks.themeMode = 'dark';
    mocks.resolvedTheme = 'dark';

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const sheetContent = screen.getByTestId('mobile-sheet-content');
    expect(sheetContent).toHaveAttribute('data-theme-mode', 'dark');
    expect(sheetContent).toHaveAttribute('data-resolved-theme', 'dark');

    const profile = within(sheetContent).getByTestId('mobile-drawer-profile');
    expect(within(profile).getByText('Coach Mode')).toBeInTheDocument();
    expect(within(profile).queryByText('System • Dark')).not.toBeInTheDocument();
  });
});
