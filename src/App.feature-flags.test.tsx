import { MemoryRouter, Outlet } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

/**
 * Feature-flag routing (roadmap 0.2, Lane C Day 1).
 * With VITE_FEATURE_COACH / VITE_FEATURE_CIRCLES off, the coach and Circles
 * routes are not registered, so every one of them falls through to NotFound.
 * Auth and trainer guards are stubbed here; App.auth-routing.test.tsx covers them.
 */

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { id: string } | null,
    session: null as { access_token: string } | null,
    profile: null as { is_trainer: boolean } | null,
    isLoading: false,
    isConfigured: true,
    initialize: vi.fn(),
    setShowAuthModal: vi.fn(),
    setRedirectUrl: vi.fn(),
  },
  trainerState: {
    isTrainerMode: false,
    setTrainerMode: vi.fn(),
    clearTrainerSession: vi.fn(),
  },
  themeState: {
    mode: 'light' as const,
    resolvedTheme: 'light' as const,
    syncSystemTheme: vi.fn(),
  },
  syncWithBackend: vi.fn(),
}));

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
vi.mock('./stores/trainerStore', () => ({
  useTrainerStore: <T,>(selector?: Selector<typeof mocks.trainerState, T>) =>
    selectState(mocks.trainerState, selector),
}));
vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: <T,>(selector?: Selector<typeof mocks.trainerState, T>) =>
    selectState(mocks.trainerState, selector),
}));
vi.mock('@/stores/themeStore', () => ({
  useThemeStore: <T,>(selector?: Selector<typeof mocks.themeState, T>) =>
    selectState(mocks.themeState, selector),
}));
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: <T,>(selector?: Selector<{ hasConsented: boolean }, T>) =>
    selectState({ hasConsented: false }, selector),
}));
vi.mock('@/stores/planStore', () => ({
  usePlanStore: <T,>(selector?: Selector<{ syncWithBackend: typeof mocks.syncWithBackend }, T>) =>
    selectState({ syncWithBackend: mocks.syncWithBackend }, selector),
}));

// Shell pieces that are irrelevant to routing.
vi.mock('./components/Header', () => ({ Header: () => null }));
vi.mock('./components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/auth/AuthModal', () => ({ AuthModal: () => null }));
vi.mock('@/components/legal/ConsentModal', () => ({ ConsentModal: () => null }));
vi.mock('@/components/install/InstallCoachHost', () => ({ InstallCoachHost: () => null }));
vi.mock('@/components/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('@/components/navigation/EdgeSwipeBack', () => ({ EdgeSwipeBack: () => null }));
vi.mock('@/components/ui/offline-banner', () => ({ OfflineBanner: () => null }));
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/ui/living-background', () => ({ LivingBackground: () => null }));
vi.mock('@/components/ui/loading-screen', () => ({ LoadingScreen: () => <div>Loading Screen</div> }));
vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }));
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('./components/OnboardingGuard', () => ({
  OnboardingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/RequireAuth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./components/TrainerGuard', () => ({
  TrainerGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/hooks/useGlobalClickFeedback', () => ({ useGlobalClickFeedback: () => undefined }));
vi.mock('@/hooks/use-scroll-activity', () => ({ useScrollActivity: () => undefined }));
vi.mock('@/hooks/useAndroidBackButton', () => ({ useAndroidBackButton: () => undefined }));

// Pages.
vi.mock('./pages/Index', () => ({ default: () => <div>Index Page</div> }));
vi.mock('./pages/NotFound', () => ({ default: () => <div>Not Found Page</div> }));
vi.mock('./pages/Clients', () => ({ default: () => <div>Clients Page</div> }));
vi.mock('./pages/ClientDetails', () => ({ default: () => <div>Client Details Page</div> }));
vi.mock('./pages/TemplateLibrary', () => ({ default: () => <div>Template Library Page</div> }));
vi.mock('./pages/Revenue', () => ({ default: () => <div>Revenue Page</div> }));
vi.mock('./pages/Circles', () => ({ default: () => <div>Circles Page</div> }));
vi.mock('./pages/Plan', () => ({ default: () => <div>Plan Page</div> }));
vi.mock('./components/circles/JoinCircleHandler', () => ({
  JoinCircleHandler: () => <div>Join Circle Handler</div>,
}));
vi.mock('./components/circles/CircleLayout', () => ({
  CircleLayout: () => (
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

const GATED_ROUTES: ReadonlyArray<{ path: string; page: string }> = [
  { path: '/clients', page: 'Clients Page' },
  { path: '/clients/client-1', page: 'Client Details Page' },
  { path: '/templates', page: 'Template Library Page' },
  { path: '/revenue', page: 'Revenue Page' },
  { path: '/circles', page: 'Circles Page' },
  { path: '/circles/join/INVITE123', page: 'Join Circle Handler' },
  { path: '/circles/circle-1/feed', page: 'Circle Feed Tab' },
];

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <App />
    </MemoryRouter>,
  );
}

function stubFlags(enabled: boolean) {
  vi.stubEnv('VITE_FEATURE_CIRCLES', String(enabled));
  vi.stubEnv('VITE_FEATURE_COACH', String(enabled));
}

describe('App feature-flag routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState.user = null;
    mocks.authState.session = null;
    mocks.authState.isLoading = false;
    window.sessionStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('with both flags off', () => {
    beforeEach(() => stubFlags(false));

    it.each(GATED_ROUTES)('renders NotFound for $path', async ({ path, page }) => {
      renderAt(path);

      expect(await screen.findByText('Not Found Page')).toBeInTheDocument();
      expect(screen.queryByText(page)).not.toBeInTheDocument();
    });

    it('keeps core routes working', async () => {
      renderAt('/plan');

      expect(await screen.findByText('Plan Page')).toBeInTheDocument();
    });

    it('ignores a pending circle invite after sign-in', async () => {
      mocks.authState.user = { id: 'user-1' };
      window.sessionStorage.setItem('pendingInviteCode', 'INVITE123');

      renderAt('/');

      expect(await screen.findByText('Index Page')).toBeInTheDocument();
      expect(screen.queryByText('Join Circle Handler')).not.toBeInTheDocument();
      expect(window.sessionStorage.getItem('pendingInviteCode')).toBe('INVITE123');
    });
  });

  describe('with both flags on', () => {
    beforeEach(() => stubFlags(true));

    it.each(GATED_ROUTES)('renders the page for $path', async ({ path, page }) => {
      renderAt(path);

      expect(await screen.findByText(page)).toBeInTheDocument();
      expect(screen.queryByText('Not Found Page')).not.toBeInTheDocument();
    });

    it('follows a pending circle invite after sign-in', async () => {
      mocks.authState.user = { id: 'user-1' };
      window.sessionStorage.setItem('pendingInviteCode', 'INVITE123');

      renderAt('/');

      expect(await screen.findByText('Join Circle Handler')).toBeInTheDocument();
      expect(window.sessionStorage.getItem('pendingInviteCode')).toBeNull();
    });
  });

  it('gates each surface on its own flag', async () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');
    vi.stubEnv('VITE_FEATURE_COACH', 'false');

    const circlesView = renderAt('/circles');
    expect(await screen.findByText('Circles Page')).toBeInTheDocument();
    circlesView.unmount();

    renderAt('/clients');
    expect(await screen.findByText('Not Found Page')).toBeInTheDocument();
  });
});
