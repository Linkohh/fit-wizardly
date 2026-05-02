import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { id: string; email?: string } | null,
    session: null as { access_token: string } | null,
    profile: null,
    isLoading: false,
    isConfigured: true,
    showAuthModal: false,
    initialize: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    setShowAuthModal: vi.fn(),
    redirectUrl: null as string | null,
    setRedirectUrl: vi.fn(),
  },
  themeState: {
    mode: 'light' as 'light' | 'dark' | 'system',
    resolvedTheme: 'light' as 'light' | 'dark',
    getEffectiveTheme: () => mocks.themeState.resolvedTheme,
    syncSystemTheme: vi.fn(),
  },
  planState: {
    syncWithBackend: vi.fn(),
  },
  trainerState: {
    isTrainerMode: false,
    setTrainerMode: vi.fn(),
  },
  achievementState: {
    totalPlansGenerated: 0,
  },
  analyticsState: {
    hasConsented: false,
  },
  platformState: {
    nativeApp: false,
  },
}));

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    button: ({
      animate: _animate,
      children,
      exit: _exit,
      initial: _initial,
      transition: _transition,
      variants: _variants,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => (
      <button {...props}>{children}</button>
    ),
    div: ({
      animate: _animate,
      children,
      exit: _exit,
      initial: _initial,
      transition: _transition,
      variants: _variants,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
    section: ({
      animate: _animate,
      children,
      exit: _exit,
      initial: _initial,
      transition: _transition,
      variants: _variants,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...props
    }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => (
      <section {...props}>{children}</section>
    ),
  },
  useInView: () => true,
}));

vi.mock('./stores/authStore', () => ({
  useAuthStore: <T,>(selector?: Selector<typeof mocks.authState, T>) =>
    selectState(mocks.authState, selector),
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: <T,>(selector?: Selector<typeof mocks.themeState, T>) =>
    selectState(mocks.themeState, selector),
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: <T,>(selector?: Selector<typeof mocks.planState, T>) =>
    selectState(mocks.planState, selector),
}));

vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: <T,>(selector?: Selector<typeof mocks.trainerState, T>) =>
    selectState(mocks.trainerState, selector),
}));

vi.mock('@/stores/achievementStore', () => ({
  useAchievementStore: <T,>(selector?: Selector<typeof mocks.achievementState, T>) =>
    selectState(mocks.achievementState, selector),
}));

vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: <T,>(selector?: Selector<typeof mocks.analyticsState, T>) =>
    selectState(mocks.analyticsState, selector),
}));

vi.mock('@/components/Header', () => ({
  Header: () => <div>Header</div>,
}));

vi.mock('@/components/Footer', () => ({
  Footer: () => <div>Footer</div>,
}));

vi.mock('@/components/auth/AuthModal', () => ({
  AuthModal: () => null,
}));

vi.mock('@/components/legal/ConsentModal', () => ({
  ConsentModal: () => null,
}));

vi.mock('@/components/CommandPalette', () => ({
  CommandPalette: () => null,
}));

vi.mock('@/components/ui/offline-banner', () => ({
  OfflineBanner: () => null,
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

vi.mock('@/hooks/useGlobalClickFeedback', () => ({
  useGlobalClickFeedback: () => undefined,
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => mocks.platformState.nativeApp,
}));

vi.mock('./components/TrainerGuard', () => ({
  TrainerGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/OnboardingGuard', () => ({
  OnboardingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/RequireAuth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}));

function OnboardingStub() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate('/')}>
      Skip for now
    </button>
  );
}

vi.mock('./pages/Onboarding', () => ({
  default: OnboardingStub,
}));

vi.mock('./pages/Wizard', () => ({
  default: () => <div>Wizard Page</div>,
}));

vi.mock('./pages/Plan', () => ({
  default: () => <div>Plan Page</div>,
}));

vi.mock('./pages/NotFound', () => ({
  default: () => <div>Not Found Page</div>,
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

vi.mock('./features/exercise-library', () => ({
  ExerciseLibraryPage: () => <div>Exercise Library Page</div>,
}));

vi.mock('./components/logging/WorkoutLogger', () => ({
  WorkoutLogger: () => <div>Workout Logger Page</div>,
}));

vi.mock('./components/circles/CircleLayout', () => ({
  default: () => <div>Circle Layout</div>,
}));

vi.mock('./components/circles/JoinCircleHandler', () => ({
  JoinCircleHandler: () => null,
}));

vi.mock('./components/circles/tabs', () => ({
  CircleFeedTab: () => <div>Circle Feed Tab</div>,
  CircleLeaderboardTab: () => <div>Circle Leaderboard Tab</div>,
  CircleChallengesTab: () => <div>Circle Challenges Tab</div>,
  CircleMembersTab: () => <div>Circle Members Tab</div>,
  CircleSettingsTab: () => <div>Circle Settings Tab</div>,
  CircleDashboardTab: () => <div>Circle Dashboard Tab</div>,
}));

vi.mock('@/components/landing/FeatureCard', () => ({
  FeatureCard: ({ feature }: { feature: { title: string } }) => <div>{feature.title}</div>,
}));

vi.mock('@/components/install/InstallCoachSheet', () => ({
  InstallCoachSheet: () => null,
}));

vi.mock('@/hooks/use-install-coach-auto-prompt-ready', () => ({
  useInstallCoachAutoPromptReady: () => false,
}));

vi.mock('@/components/analytics/PeriodizationTimeline', () => ({
  PeriodizationTimeline: () => <div>Periodization Timeline</div>,
}));

vi.mock('@/components/motivation/WelcomeHero', () => ({
  WelcomeHero: () => <div>Home Hero</div>,
}));

vi.mock('@/components/motivation/DailyQuote', () => ({
  DailyQuote: () => <div>Daily Quote</div>,
}));

vi.mock('@/components/motivation/TrainerDashboard', () => ({
  TrainerDashboard: () => <div>Trainer Dashboard</div>,
}));

vi.mock('@/components/motivation/StreakTracker', () => ({
  StreakTracker: () => <div>Streak Tracker</div>,
}));

vi.mock('@/components/motivation/GoalVisualization', () => ({
  GoalVisualization: () => <div>Goal Visualization</div>,
}));

vi.mock('@/components/landing/FeatureDetailModal', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/living-background', () => ({
  LivingBackground: () => <div data-testid="living-background" />,
}));

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App home-route regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
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

  it('renders the home route without hitting the global error boundary', async () => {
    renderAt('/');

    expect(await screen.findByText('Home Hero', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('reaches the home route from onboarding skip without hitting the global error boundary', async () => {
    renderAt('/onboarding');

    fireEvent.click(await screen.findByRole('button', { name: 'Skip for now' }, { timeout: 3000 }));

    expect(await screen.findByText('Home Hero', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
