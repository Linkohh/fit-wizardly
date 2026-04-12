import { MemoryRouter, Outlet } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const mocks = vi.hoisted(() => {
  const authState = {
    user: null as { id: string; email?: string } | null,
    session: null as { access_token: string } | null,
    profile: null as {
      id: string;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
      experience_level: string | null;
      primary_goal: string | null;
      timezone: string | null;
      created_at: string | null;
      role: string;
      is_trainer: boolean;
    } | null,
    isLoading: false,
    isConfigured: true,
    showAuthModal: false,
    initialize: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    setShowAuthModal: vi.fn((show: boolean) => {
      authState.showAuthModal = show;
    }),
    redirectUrl: null as string | null,
    setRedirectUrl: vi.fn((url: string | null) => {
      authState.redirectUrl = url;
    }),
  };

  const trainerState = {
    isTrainerMode: false,
    toggleTrainerMode: vi.fn(),
    setTrainerMode: vi.fn((enabled: boolean) => {
      trainerState.isTrainerMode = enabled;
    }),
  };

  const themeState = {
    mode: 'light' as 'light' | 'dark' | 'system',
    resolvedTheme: 'light' as 'light' | 'dark',
    getEffectiveTheme: () => themeState.resolvedTheme,
  };

  const analyticsState = {
    hasConsented: false,
  };

  return {
    authState,
    trainerState,
    themeState,
    analyticsState,
    mediaQueryListeners: new Map<string, Set<(event: MediaQueryListEvent) => void>>(),
    platformState: {
      nativeApp: false,
    },
    syncWithBackend: vi.fn(),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('./stores/authStore', () => ({
  useAuthStore: <T,>(selector?: Selector<typeof mocks.authState, T>) =>
    selectState(mocks.authState, selector),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: <T,>(selector?: Selector<typeof mocks.authState, T>) =>
    selectState(mocks.authState, selector),
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: <T,>(selector?: Selector<typeof mocks.themeState, T>) =>
    selectState(mocks.themeState, selector),
}));

vi.mock('./stores/themeStore', () => ({
  useThemeStore: <T,>(selector?: Selector<typeof mocks.themeState, T>) =>
    selectState(mocks.themeState, selector),
}));

vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: <T,>(selector?: Selector<typeof mocks.trainerState, T>) =>
    selectState(mocks.trainerState, selector),
}));

vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: <T,>(selector?: Selector<typeof mocks.analyticsState, T>) =>
    selectState(mocks.analyticsState, selector),
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: <T,>(selector?: Selector<{ syncWithBackend: typeof mocks.syncWithBackend }, T>) =>
    selectState({ syncWithBackend: mocks.syncWithBackend }, selector),
}));

vi.mock('./components/Header', () => ({
  Header: () => <div>Header</div>,
}));

vi.mock('./components/Footer', () => ({
  Footer: () => <div>Footer</div>,
}));

vi.mock('@/components/auth/AuthModal', () => ({
  AuthModal: () => (mocks.authState.showAuthModal ? <div>Auth Modal Open</div> : null),
}));

vi.mock('@/components/legal/ConsentModal', () => ({
  ConsentModal: () => null,
}));

vi.mock('@/components/CommandPalette', () => ({
  CommandPalette: () => null,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/living-background', () => ({
  LivingBackground: () => <div data-testid="living-background" />,
}));

vi.mock('@/components/ui/loading-screen', () => ({
  LoadingScreen: () => <div>Loading Screen</div>,
}));

vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => null,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

vi.mock('./components/OnboardingGuard', () => ({
  OnboardingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => undefined,
}));

vi.mock('@/hooks/useGlobalClickFeedback', () => ({
  useGlobalClickFeedback: () => undefined,
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => mocks.platformState.nativeApp,
}));

vi.mock('./pages/Index', () => ({
  default: () => <div>Index Page</div>,
}));

vi.mock('./pages/Wizard', () => ({
  default: () => <div>Wizard Page</div>,
}));

vi.mock('./pages/Plan', () => ({
  default: () => <div>Plan Page</div>,
}));

vi.mock('./pages/Clients', () => ({
  default: () => <div>Clients Page</div>,
}));

vi.mock('./pages/ClientDetails', () => ({
  default: () => <div>Client Details Page</div>,
}));

vi.mock('./pages/MCLIntegrationTest', () => ({
  default: () => <div>MCL Page</div>,
}));

vi.mock('./pages/Onboarding', () => ({
  default: () => <div>Onboarding Page</div>,
}));

vi.mock('./pages/Nutrition', () => ({
  default: () => <div>Nutrition Page</div>,
}));

vi.mock('./pages/History', () => ({
  default: () => <div>History Page</div>,
}));

vi.mock('./pages/Circles', () => ({
  default: () => <div>Circles Page</div>,
}));

vi.mock('./pages/UserGuide', () => ({
  default: () => <div>Guide Page</div>,
}));

vi.mock('./pages/Legal', () => ({
  default: () => <div>Legal Page</div>,
}));

vi.mock('./pages/TemplateLibrary', () => ({
  default: () => <div>Template Library Page</div>,
}));

vi.mock('./pages/Revenue', () => ({
  default: () => <div>Revenue Page</div>,
}));

vi.mock('./pages/Analytics', () => ({
  default: () => <div>Analytics Page</div>,
}));

vi.mock('./pages/Profile', () => ({
  Profile: () => <div>Profile Page</div>,
}));

vi.mock('./pages/NotFound', () => ({
  default: () => <div>Not Found Page</div>,
}));

vi.mock('./features/exercise-library', () => ({
  ExerciseLibraryPage: () => <div>Exercise Library Page</div>,
}));

vi.mock('./components/logging/WorkoutLogger', () => ({
  WorkoutLogger: () => <div>Workout Logger Page</div>,
}));

vi.mock('./components/circles/JoinCircleHandler', () => ({
  JoinCircleHandler: () => <div>Join Circle Handler</div>,
}));

vi.mock('./components/circles/CircleLayout', () => ({
  default: () => (
    <div>
      Circle Layout
      <Outlet />
    </div>
  ),
}));

vi.mock('./components/circles/tabs', () => ({
  CircleFeedTab: () => <div>Circle Feed Tab</div>,
  CircleLeaderboardTab: () => <div>Circle Leaderboard Tab</div>,
  CircleChallengesTab: () => <div>Circle Challenges Tab</div>,
  CircleMembersTab: () => <div>Circle Members Tab</div>,
  CircleSettingsTab: () => <div>Circle Settings Tab</div>,
  CircleDashboardTab: () => <div>Circle Dashboard Tab</div>,
}));

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <App />
    </MemoryRouter>
  );
}

function resetState() {
  mocks.authState.user = null;
  mocks.authState.session = null;
  mocks.authState.profile = null;
  mocks.authState.isLoading = false;
  mocks.authState.isConfigured = true;
  mocks.authState.showAuthModal = false;
  mocks.authState.redirectUrl = null;
  mocks.trainerState.isTrainerMode = false;
  mocks.themeState.mode = 'light';
  mocks.themeState.resolvedTheme = 'light';
  mocks.analyticsState.hasConsented = false;
  mocks.platformState.nativeApp = false;
  mocks.mediaQueryListeners.clear();
  window.sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
}

describe('App auth routing', () => {
  beforeEach(() => {
    resetState();
    vi.useRealTimers();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => {
        const listeners = mocks.mediaQueryListeners.get(query) ?? new Set<(event: MediaQueryListEvent) => void>();
        mocks.mediaQueryListeners.set(query, listeners);

        return {
          matches: query === '(prefers-color-scheme: dark)' ? mocks.themeState.resolvedTheme === 'dark' : false,
          media: query,
          onchange: null,
          addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.add(listener);
          }),
          removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.delete(listener);
          }),
          addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
            listeners.add(listener);
          }),
          removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
            listeners.delete(listener);
          }),
          dispatchEvent: vi.fn(),
        };
      }),
    });
  });

  it('keeps demo routes available to guests', async () => {
    renderAt('/plan');

    expect(await screen.findByText('Plan Page')).toBeInTheDocument();
    expect(screen.queryByText('Auth Modal Open')).not.toBeInTheDocument();
  });

  it('keeps onboarding inside the shared shell', async () => {
    renderAt('/onboarding');

    expect(await screen.findByText('Onboarding Page')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toHaveClass('app-shell-web', 'app-shell-main-offset');
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.queryByText('Auth Modal Open')).not.toBeInTheDocument();
  });

  it('mounts Vercel Analytics once at the app root', async () => {
    mocks.analyticsState.hasConsented = true;

    renderAt('/onboarding');

    expect(await screen.findByText('Onboarding Page')).toBeInTheDocument();
    expect(screen.getAllByTestId('vercel-analytics')).toHaveLength(1);
  });

  it('uses the native shell offset contract when running inside the app shell', async () => {
    mocks.platformState.nativeApp = true;

    renderAt('/onboarding');

    expect(await screen.findByText('Onboarding Page')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toHaveClass('app-shell-native', 'app-shell-main-offset');
  });

  it('renders the shared living background on phone widths', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 390,
    });

    renderAt('/onboarding');

    expect(await screen.findByTestId('living-background')).toBeInTheDocument();

    requestAnimationFrameSpy.mockRestore();
  });

  it('applies a temporary theme transition hook when the effective theme changes', async () => {
    vi.useFakeTimers();
    mocks.themeState.mode = 'system';
    mocks.themeState.resolvedTheme = 'light';

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    expect(document.documentElement).not.toHaveAttribute('data-theme-transition');

    mocks.themeState.resolvedTheme = 'dark';
    const listeners = mocks.mediaQueryListeners.get('(prefers-color-scheme: dark)');
    expect(listeners?.size).toBeGreaterThan(0);
    act(() => {
      listeners?.forEach((listener) =>
        listener({
          matches: true,
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent),
      );
    });

    expect(document.documentElement).toHaveAttribute('data-theme-transition', 'to-dark');
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-theme-transition', 'to-dark');

    act(() => {
      vi.advanceTimersByTime(920);
    });

    expect(document.documentElement).not.toHaveAttribute('data-theme-transition');
    expect(screen.getByTestId('app-shell')).not.toHaveAttribute('data-theme-transition');
  });

  it('uses the root view-transition path when available and no drawer is open', async () => {
    const finished = new Promise<void>(() => {});
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
      return { finished };
    });

    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });

    mocks.themeState.mode = 'system';
    mocks.themeState.resolvedTheme = 'light';

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    mocks.themeState.resolvedTheme = 'dark';
    const listeners = mocks.mediaQueryListeners.get('(prefers-color-scheme: dark)');
    act(() => {
      listeners?.forEach((listener) =>
        listener({
          matches: true,
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent),
      );
    });

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveAttribute('data-theme-transition', 'to-dark');
    expect(document.documentElement).not.toHaveAttribute('data-theme-transition-context');
  });

  it('keeps newer root theme transitions active when an older completion resolves late', async () => {
    const resolveFinishedTransitions: Array<() => void> = [];
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
      return {
        finished: new Promise<void>((resolve) => {
          resolveFinishedTransitions.push(resolve);
        }),
      };
    });

    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });

    mocks.themeState.mode = 'light';
    mocks.themeState.resolvedTheme = 'light';

    const { rerender } = render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    mocks.themeState.mode = 'dark';
    mocks.themeState.resolvedTheme = 'dark';

    rerender(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    expect(document.documentElement).toHaveAttribute('data-theme-transition', 'to-dark');

    mocks.themeState.mode = 'light';
    mocks.themeState.resolvedTheme = 'light';

    rerender(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    expect(startViewTransition).toHaveBeenCalledTimes(2);
    expect(document.documentElement).toHaveAttribute('data-theme-transition', 'to-light');

    await act(async () => {
      resolveFinishedTransitions[0]?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.documentElement).toHaveAttribute('data-theme-transition', 'to-light');

    await act(async () => {
      resolveFinishedTransitions[1]?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(document.documentElement).not.toHaveAttribute('data-theme-transition');
    });
  });

  it('switches to drawer-open transition context and skips root view transitions when the drawer is open', async () => {
    vi.useFakeTimers();
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
      return { finished: Promise.resolve() };
    });

    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });

    const drawer = document.createElement('div');
    drawer.className = 'aetheric-drawer';
    drawer.setAttribute('data-state', 'open');
    document.body.appendChild(drawer);

    mocks.themeState.mode = 'system';
    mocks.themeState.resolvedTheme = 'light';

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    mocks.themeState.resolvedTheme = 'dark';
    const listeners = mocks.mediaQueryListeners.get('(prefers-color-scheme: dark)');
    act(() => {
      listeners?.forEach((listener) =>
        listener({
          matches: true,
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent),
      );
    });

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(document.documentElement).toHaveAttribute('data-theme-transition-context', 'drawer-open');
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-theme-transition-context', 'drawer-open');

    act(() => {
      vi.advanceTimersByTime(920);
    });

    expect(document.documentElement).not.toHaveAttribute('data-theme-transition-context');
    expect(screen.getByTestId('app-shell')).not.toHaveAttribute('data-theme-transition-context');

    drawer.remove();
  });

  it('clears the drawer-open transition context as soon as the drawer unmounts', async () => {
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
      return { finished: Promise.resolve() };
    });

    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });

    const drawer = document.createElement('div');
    drawer.className = 'aetheric-drawer';
    drawer.setAttribute('data-state', 'open');
    document.body.appendChild(drawer);

    mocks.themeState.mode = 'system';
    mocks.themeState.resolvedTheme = 'light';

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    mocks.themeState.resolvedTheme = 'dark';
    const listeners = mocks.mediaQueryListeners.get('(prefers-color-scheme: dark)');
    act(() => {
      listeners?.forEach((listener) =>
        listener({
          matches: true,
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent),
      );
    });

    expect(document.documentElement).toHaveAttribute('data-theme-transition-context', 'drawer-open');

    act(() => {
      drawer.remove();
    });

    await waitFor(() => {
      expect(document.documentElement).not.toHaveAttribute('data-theme-transition-context');
      expect(screen.getByTestId('app-shell')).not.toHaveAttribute('data-theme-transition-context');
    });

    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it('skips the global transition hook when system mode resolves to the same effective theme', async () => {
    mocks.themeState.mode = 'system';
    mocks.themeState.resolvedTheme = 'light';

    const { rerender } = render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    mocks.themeState.mode = 'system';
    mocks.themeState.resolvedTheme = 'light';

    rerender(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    expect(document.documentElement).not.toHaveAttribute('data-theme-transition');
    expect(screen.getByTestId('app-shell')).not.toHaveAttribute('data-theme-transition');
  });

  it('respects reduced motion by disabling the animated theme transition hook', async () => {
    vi.useFakeTimers();
    mocks.themeState.mode = 'light';
    mocks.themeState.resolvedTheme = 'light';

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches:
        query === '(prefers-reduced-motion: reduce)'
          ? true
          : query === '(prefers-color-scheme: dark)'
            ? mocks.themeState.resolvedTheme === 'dark'
            : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { rerender } = render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    mocks.themeState.mode = 'dark';
    mocks.themeState.resolvedTheme = 'dark';

    rerender(
      <MemoryRouter initialEntries={['/onboarding']}>
        <App />
      </MemoryRouter>
    );

    expect(document.documentElement).not.toHaveAttribute('data-theme-transition');
    expect(screen.getByTestId('app-shell')).not.toHaveAttribute('data-theme-transition');
  });

  it('redirects guests away from auth-backed circle routes and opens auth modal', async () => {
    renderAt('/circles/circle-1/feed');

    expect(await screen.findByText('Index Page', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText('Auth Modal Open')).toBeInTheDocument();
    expect(mocks.authState.setRedirectUrl).toHaveBeenCalledWith(
      `${window.location.origin}/circles/circle-1/feed`
    );
  });

  it('redirects guests away from trainer routes and opens auth modal', async () => {
    renderAt('/clients');

    expect(await screen.findByText('Index Page', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText('Auth Modal Open')).toBeInTheDocument();
  });

  it('allows authenticated trainer users through trainer routes', async () => {
    mocks.authState.user = { id: 'user-1' };
    mocks.authState.session = { access_token: 'token-1' };
    mocks.authState.profile = {
      id: 'user-1',
      display_name: 'Coach Alex',
      username: 'coach-alex',
      avatar_url: null,
      experience_level: null,
      primary_goal: null,
      timezone: 'America/New_York',
      created_at: null,
      role: 'trainer',
      is_trainer: true,
    };
    mocks.trainerState.isTrainerMode = true;

    renderAt('/clients');

    expect(await screen.findByText('Clients Page')).toBeInTheDocument();
    expect(screen.queryByText('Auth Modal Open')).not.toBeInTheDocument();
  });

  it('shows an unavailable state when auth-backed routes are reached without backend config', async () => {
    mocks.authState.isConfigured = false;

    renderAt('/circles/circle-1/feed');

    expect(await screen.findByText('Account Feature Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Auth Modal Open')).not.toBeInTheDocument();
  });

  it('shows trainer mode required screen for authorized users without trainer mode on trainer routes', async () => {
    mocks.authState.user = { id: 'user-1' };
    mocks.authState.session = { access_token: 'token-1' };
    mocks.authState.profile = {
      id: 'user-1',
      display_name: 'Coach Alex',
      username: 'coach-alex',
      avatar_url: null,
      experience_level: null,
      primary_goal: null,
      timezone: 'America/New_York',
      created_at: null,
      role: 'trainer',
      is_trainer: true,
    };
    mocks.trainerState.isTrainerMode = false;

    renderAt('/clients');

    expect(await screen.findByText('Trainer Mode Required')).toBeInTheDocument();
    expect(screen.queryByText('Clients Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Auth Modal Open')).not.toBeInTheDocument();
  });

  it('shows trainer access restricted screen for authenticated users without trainer authorization on trainer routes', async () => {
    mocks.authState.user = { id: 'user-1', email: 'coach@example.com' };
    mocks.authState.session = { access_token: 'token-1' };
    mocks.authState.profile = {
      id: 'user-1',
      display_name: 'Coach Alex',
      username: 'coach-alex',
      avatar_url: null,
      experience_level: null,
      primary_goal: null,
      timezone: 'America/New_York',
      created_at: null,
      role: 'client',
      is_trainer: false,
    };

    renderAt('/clients');

    expect(await screen.findByText('Trainer Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Clients Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Auth Modal Open')).not.toBeInTheDocument();
  });

  it('clears stale trainer mode for users without trainer authorization', async () => {
    mocks.authState.user = { id: 'user-1' };
    mocks.authState.profile = {
      id: 'user-1',
      display_name: 'Member',
      username: null,
      avatar_url: null,
      experience_level: null,
      primary_goal: null,
      timezone: 'America/New_York',
      created_at: null,
      role: 'client',
      is_trainer: false,
    };
    mocks.trainerState.isTrainerMode = true;

    renderAt('/');

    expect(await screen.findByText('Index Page')).toBeInTheDocument();
    expect(mocks.trainerState.setTrainerMode).toHaveBeenCalledWith(false);
  });
});
