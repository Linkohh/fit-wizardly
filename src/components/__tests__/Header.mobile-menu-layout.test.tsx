import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/Header';

const mocks = vi.hoisted(() => ({
  themeMode: 'system' as 'light' | 'dark' | 'system',
  resolvedTheme: 'light' as 'light' | 'dark',
  setMode: vi.fn(),
  setMotionTiltActivatedThisSession: vi.fn(),
  toggleTrainerMode: vi.fn(),
  openInstallCoach: vi.fn(),
  installCoachState: {
    platform: 'unsupported',
    isStandalone: false,
    canNativeInstall: false,
    canShareShortcut: false,
    hasSeenCoach: false,
    dismissed: false,
    installed: false,
    isOpen: false,
    hasHydrated: true,
  },
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

vi.mock('@/stores/installCoachStore', () => ({
  useInstallCoachStore: Object.assign(
    (selector: (state: typeof mocks.installCoachState) => unknown) => selector(mocks.installCoachState),
    {
      getState: () => ({
        openCoach: mocks.openInstallCoach,
      }),
    },
  ),
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: (selector?: (state: {
    mode: 'light' | 'dark' | 'system';
    resolvedTheme: 'light' | 'dark';
    setMode: (mode: 'light' | 'dark' | 'system') => void;
    getEffectiveTheme: () => 'light' | 'dark';
  }) => unknown) => {
    const state = {
      mode: mocks.themeMode,
      resolvedTheme: mocks.resolvedTheme,
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
      is_trainer: boolean;
    } | null;
  }) => unknown) =>
    selector({
      user: null,
      profile: {
        display_name: null,
        avatar_url: null,
        experience_level: null,
        primary_goal: null,
        is_trainer: true,
      },
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
    (selector?: (state: {
      isTrainerMode: boolean;
      setTrainerMode: (enabled: boolean) => void;
    }) => unknown) => {
      const state = {
        isTrainerMode: true,
        setTrainerMode: mocks.toggleTrainerMode,
      };

      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        toggleTrainerMode: mocks.toggleTrainerMode,
        setTrainerMode: mocks.toggleTrainerMode,
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

  const SheetTrigger = ({
    asChild,
    children,
  }: {
    asChild?: boolean;
    children: React.ReactElement<{ onClick?: React.MouseEventHandler; 'data-testid'?: string }>;
  }) => {
    const { onOpenChange } = React.useContext(SheetContext);

    if (asChild && React.isValidElement(children)) {
      const childOnClick = children.props.onClick;

      return React.cloneElement(children, {
        'data-testid': 'sheet-trigger',
        onClick: (event: React.MouseEvent) => {
          childOnClick?.(event);
          onOpenChange?.(true);
        },
      });
    }

    return (
      <div data-testid="sheet-trigger" onClick={() => onOpenChange?.(true)}>
        {children}
      </div>
    );
  };

  const SheetContent = ({
    className,
    closeButtonClassName,
    children,
    glassEffect: _glassEffect,
    enableGestures: _enableGestures,
    gestureMode: _gestureMode,
    motionPreset: _motionPreset,
    showDragHandle: _showDragHandle,
    onGestureClose: _onGestureClose,
    title: _title,
    description: _description,
    ...props
  }: {
    className?: string;
    closeButtonClassName?: string;
    children: React.ReactNode;
    glassEffect?: boolean;
    enableGestures?: boolean;
    gestureMode?: string;
    motionPreset?: string;
    showDragHandle?: boolean;
    onGestureClose?: () => void;
    title?: string;
    description?: string;
    [key: string]: unknown;
  }) => {
    const { open } = React.useContext(SheetContext);
    if (!open) return null;
    return (
      <div
        data-testid="mobile-sheet-content"
        className={className}
        data-close-button-class-name={closeButtonClassName}
        {...props}
      >
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

vi.mock('@/components/ui/scroll-area', async () => {
  const React = await import('react');

  type MockScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
    type?: string;
    scrollHideDelay?: number;
  };

  const ScrollArea = React.forwardRef<HTMLDivElement, MockScrollAreaProps>(
    ({ children, type, scrollHideDelay, ...props }, ref) => (
      <div
        ref={ref}
        data-scroll-area-type={type}
        data-scroll-hide-delay={scrollHideDelay}
        {...props}
      >
        {children}
      </div>
    ),
  );

  ScrollArea.displayName = 'MockScrollArea';

  return { ScrollArea };
});

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="current-location">{location.pathname}</div>;
}

function renderHeader(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Header />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function mockElementFromPoint(element: Element | null) {
  const elementFromPoint = vi.fn(() => element);
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: elementFromPoint,
  });

  return elementFromPoint;
}

describe('Header mobile menu layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.themeMode = 'system';
    mocks.resolvedTheme = 'light';
    mocks.installCoachState = {
      platform: 'unsupported',
      isStandalone: false,
      canNativeInstall: false,
      canShareShortcut: false,
      hasSeenCoach: false,
      dismissed: false,
      installed: false,
      isOpen: false,
      hasHydrated: true,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('tags the brand logo and menu trigger with explicit mobile feedback events', () => {
    renderHeader();

    expect(screen.getByAltText('FitWizard Logo').closest('a')).toHaveAttribute(
      'data-click-feedback-event',
      'brandHome',
    );
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute(
      'data-click-feedback-event',
      'navigation',
    );
    expect(screen.getByTestId('sheet-trigger').tagName).toBe('BUTTON');
  });

  it('shows a manual install action in the home drawer after the install coach was dismissed', async () => {
    mocks.installCoachState = {
      platform: 'ios-safari',
      isStandalone: false,
      canNativeInstall: false,
      canShareShortcut: true,
      hasSeenCoach: true,
      dismissed: true,
      installed: false,
      isOpen: false,
      hasHydrated: true,
    };

    renderHeader();

    fireEvent.click(screen.getByTestId('sheet-trigger'));

    const drawer = await screen.findByTestId('mobile-sheet-content');
    const installButton = within(drawer).getByRole('button', { name: /add to home screen/i });

    fireEvent.click(installButton);

    expect(mocks.openInstallCoach).toHaveBeenCalledTimes(1);
  });

  it('renders the aetheric drawer shell with profile header, trainer section, and sticky footer controls', async () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const sheetContent = screen.getByTestId('mobile-sheet-content');
    expect(sheetContent).toHaveClass('aetheric-drawer--scooped', 'flex', 'flex-col', 'overflow-hidden');
    expect(sheetContent.className).toContain('overflow-x-hidden');
    expect(sheetContent.className).toContain('h-[100svh]');
    expect(sheetContent.className).toContain('supports-[height:100dvh]:h-[100dvh]');
    expect(sheetContent.className).toContain('max-h-[100dvh]');
    expect(sheetContent.className).toContain('pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]');
    const closeButtonClassName = sheetContent.getAttribute('data-close-button-class-name');
    expect(closeButtonClassName).toContain('aetheric-drawer__close-button');
    expect(closeButtonClassName).toContain('bg-white/75');
    expect(closeButtonClassName).toContain('backdrop-blur-xl');
    expect(sheetContent).toHaveAttribute('data-theme-mode', 'system');
    expect(sheetContent).toHaveAttribute('data-resolved-theme', 'light');

    const drawerInner = sheetContent.firstElementChild;
    expect(drawerInner).toHaveClass('pt-[calc(env(safe-area-inset-top,0px)+1rem)]');

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(mobileNav).toHaveClass('overscroll-contain', 'overflow-x-hidden');
    expect(screen.getByTestId('mobile-drawer-scroll-area')).toHaveClass(
      'flex-1',
      'min-h-0',
      'overflow-hidden',
    );
    expect(screen.getByTestId('mobile-drawer-scroll-area')).toHaveAttribute(
      'data-scroll-area-type',
      'scroll',
    );
    expect(screen.getByTestId('mobile-drawer-scroll-area')).toHaveAttribute(
      'data-scroll-hide-delay',
      '3000',
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
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const footer = screen.getByTestId('mobile-drawer-footer');

    fireEvent.click(within(footer).getByRole('button', { name: 'Light' }));
    fireEvent.click(within(footer).getByRole('button', { name: 'System' }));
    fireEvent.click(within(footer).getByRole('button', { name: 'Dark' }));

    expect(mocks.setMode).toHaveBeenNthCalledWith(1, 'light');
    expect(mocks.setMode).toHaveBeenNthCalledWith(2, 'system');
    expect(mocks.setMode).toHaveBeenNthCalledWith(3, 'dark');
  });

  it('uses the shared compact theme pill in the desktop header and dispatches theme changes in light-system-dark order', () => {
    renderHeader();

    const desktopThemeToggle = screen.getByTestId('desktop-header-theme-toggle');
    const [lightButton, systemButton, darkButton] = within(desktopThemeToggle).getAllByRole('button');

    expect(desktopThemeToggle).toHaveClass('header-theme-toggle');
    expect([lightButton, systemButton, darkButton].map((button) => button.getAttribute('aria-label'))).toEqual([
      'Light',
      'System',
      'Dark',
    ]);
    expect(lightButton).toHaveClass('header-theme-button');
    expect(systemButton).toHaveClass('header-theme-button');
    expect(darkButton).toHaveClass('header-theme-button');
    expect(systemButton).toHaveAttribute('data-selected', 'true');

    fireEvent.click(lightButton);
    fireEvent.click(systemButton);
    fireEvent.click(darkButton);

    expect(mocks.setMode).toHaveBeenNthCalledWith(1, 'light');
    expect(mocks.setMode).toHaveBeenNthCalledWith(2, 'system');
    expect(mocks.setMode).toHaveBeenNthCalledWith(3, 'dark');
  });

  it('switches the drawer chrome to dark aetheric mode when the resolved theme is dark', () => {
    mocks.themeMode = 'dark';
    mocks.resolvedTheme = 'dark';

    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const sheetContent = screen.getByTestId('mobile-sheet-content');
    expect(sheetContent).toHaveAttribute('data-theme-mode', 'dark');
    expect(sheetContent).toHaveAttribute('data-resolved-theme', 'dark');

    const profile = within(sheetContent).getByTestId('mobile-drawer-profile');
    expect(within(profile).getByText('Coach Mode')).toBeInTheDocument();
    expect(within(profile).queryByText('System • Dark')).not.toBeInTheDocument();
  });

  it('keeps normal tap navigation unchanged in the mobile drawer', async () => {
    renderHeader('/');

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    fireEvent.click(within(mobileNav).getByRole('link', { name: 'View Plan' }));

    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent('/plan');
    });
    expect(screen.queryByTestId('mobile-sheet-content')).not.toBeInTheDocument();
  });

  it('navigates to the drag-previewed nav item when long-press dragging releases on it', async () => {
    vi.useFakeTimers();

    renderHeader('/history');

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    const homeLink = within(mobileNav).getByRole('link', { name: 'Home' });
    const viewPlanLink = within(mobileNav).getByRole('link', { name: 'View Plan' });
    const historyLink = within(mobileNav).getByRole('link', { name: 'History' });
    const elementFromPoint = mockElementFromPoint(viewPlanLink);

    fireEvent.pointerDown(homeLink, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 300,
      clientY: 360,
    });

    act(() => {
      vi.advanceTimersByTime(320);
    });

    fireEvent.pointerMove(mobileNav, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 300,
      clientY: 690,
    });

    expect(elementFromPoint).toHaveBeenCalledWith(300, 690);
    expect(mobileNav).toHaveClass('is-drag-selecting');
    expect(historyLink).toHaveClass('is-active');
    expect(viewPlanLink).toHaveAttribute('data-drag-preview', 'true');
    expect(viewPlanLink).toHaveClass('is-drag-preview');
    expect(homeLink).not.toHaveAttribute('data-drag-preview', 'true');
    expect(homeLink).not.toHaveClass('is-active', 'is-drag-preview');
    expect(mobileNav.querySelectorAll('.aetheric-drawer__nav-link.is-active')).toHaveLength(1);
    expect(mobileNav.querySelectorAll('.aetheric-drawer__nav-link.is-drag-preview')).toHaveLength(1);

    fireEvent.pointerUp(mobileNav, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 300,
      clientY: 690,
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent('/plan');
    });
    expect(screen.queryByTestId('mobile-sheet-content')).not.toBeInTheDocument();
  });

  it('keeps the drawer open and route unchanged when drag selection releases without a target', () => {
    vi.useFakeTimers();

    renderHeader('/analytics');

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    const analyticsLink = within(mobileNav).getByRole('link', { name: 'Analytics' });
    mockElementFromPoint(null);

    fireEvent.pointerDown(analyticsLink, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 300,
      clientY: 620,
    });

    act(() => {
      vi.advanceTimersByTime(320);
    });

    fireEvent.pointerMove(mobileNav, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 16,
      clientY: 16,
    });

    expect(analyticsLink).not.toHaveAttribute('data-drag-preview', 'true');

    fireEvent.pointerUp(mobileNav, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 16,
      clientY: 16,
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();

    expect(screen.getByTestId('current-location')).toHaveTextContent('/analytics');
    expect(screen.getByTestId('mobile-sheet-content')).toBeInTheDocument();
  });

  it('moves the drag preview away from the initially pressed non-active item on touch drag', () => {
    vi.useFakeTimers();

    renderHeader('/');

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    const homeLink = within(mobileNav).getByRole('link', { name: 'Home' });
    const createPlanLink = within(mobileNav).getByRole('link', { name: 'Create Plan' });
    const viewPlanLink = within(mobileNav).getByRole('link', { name: 'View Plan' });
    const elementFromPoint = mockElementFromPoint(viewPlanLink);

    fireEvent.pointerDown(createPlanLink, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 300,
      clientY: 470,
    });

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(homeLink).toHaveClass('is-active');
    expect(createPlanLink).toHaveAttribute('data-drag-preview', 'true');

    fireEvent.touchMove(mobileNav, {
      touches: [{ clientX: 300, clientY: 565 }],
    });

    expect(elementFromPoint).toHaveBeenCalledWith(300, 565);
    expect(homeLink).toHaveClass('is-active');
    expect(createPlanLink).toHaveAttribute('data-drag-origin', 'true');
    expect(createPlanLink).toHaveClass('is-drag-origin');
    expect(createPlanLink).not.toHaveAttribute('data-drag-preview', 'true');
    expect(createPlanLink).not.toHaveClass('is-drag-preview');
    expect(viewPlanLink).toHaveAttribute('data-drag-preview', 'true');
    expect(viewPlanLink).toHaveClass('is-drag-preview');
    expect(mobileNav.querySelectorAll('.aetheric-drawer__nav-link.is-active')).toHaveLength(1);
    expect(mobileNav.querySelectorAll('.aetheric-drawer__nav-link.is-drag-preview')).toHaveLength(1);
  });
});
