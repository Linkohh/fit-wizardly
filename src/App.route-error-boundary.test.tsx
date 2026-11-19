import { MemoryRouter, Outlet } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

/**
 * Per-route error boundary (roadmap 3.1, Lane C Day 3).
 * A page that throws shows the compact fallback inside the shell, so the header
 * (and the global boundary) stay out of it. The real ErrorBoundary is used here.
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
  captureError: vi.fn(),
}));

const pageState = vi.hoisted(() => ({ planThrows: true }));

vi.mock('@/lib/monitoring', () => ({
  captureError: mocks.captureError,
  initMonitoring: vi.fn(),
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
vi.mock('./components/Header', () => ({ Header: () => <div>Header</div> }));
vi.mock('./components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/auth/AuthModal', () => ({ AuthModal: () => null }));
vi.mock('@/components/legal/ConsentModal', () => ({ ConsentModal: () => null }));
vi.mock('@/components/install/InstallCoachHost', () => ({ InstallCoachHost: () => null }));
vi.mock('@/components/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('@/components/navigation/EdgeSwipeBack', () => ({ EdgeSwipeBack: () => null }));
vi.mock('@/components/ui/offline-banner', () => ({ OfflineBanner: () => null }));
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
vi.mock('./pages/Plan', () => ({
  default: function PlanPage() {
    if (pageState.planThrows) {
      throw new Error('Plan exploded');
    }
    return <div>Plan Page</div>;
  },
}));
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

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App per-route error boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageState.planThrows = true;
    // React logs caught render errors; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
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
    vi.restoreAllMocks();
  });

  it('shows the route fallback while the header still renders', async () => {
    renderAt('/plan');

    expect(await screen.findByText('This page hit a problem.')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    expect(mocks.captureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Plan exploded' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it('recovers with Try again once the page stops throwing', async () => {
    renderAt('/plan');
    await screen.findByText('This page hit a problem.');

    pageState.planThrows = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Plan Page')).toBeInTheDocument();
  });

  it('navigates home with Go home', async () => {
    renderAt('/plan');
    await screen.findByText('This page hit a problem.');

    fireEvent.click(screen.getByRole('button', { name: /go home/i }));

    expect(await screen.findByText('Index Page')).toBeInTheDocument();
    expect(screen.queryByText('This page hit a problem.')).not.toBeInTheDocument();
  });
});
