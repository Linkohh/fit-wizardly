import { MemoryRouter, Outlet } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
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
    profile: null,
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
    mode: 'light' as const,
    getEffectiveTheme: () => 'light',
  };

  return {
    authState,
    trainerState,
    themeState,
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
  LivingBackground: () => null,
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
  isNativeApp: () => false,
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
  window.sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
}

describe('App auth routing', () => {
  beforeEach(() => {
    resetState();
  });

  it('keeps demo routes available to guests', async () => {
    renderAt('/plan');

    expect(await screen.findByText('Plan Page')).toBeInTheDocument();
    expect(screen.queryByText('Auth Modal Open')).not.toBeInTheDocument();
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

  it('shows trainer mode required screen for authenticated users without trainer mode on trainer routes', async () => {
    mocks.authState.user = { id: 'user-1' };
    mocks.authState.session = { access_token: 'token-1' };
    mocks.trainerState.isTrainerMode = false;

    renderAt('/clients');

    expect(await screen.findByText('Trainer Mode Required')).toBeInTheDocument();
    expect(screen.queryByText('Clients Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Auth Modal Open')).not.toBeInTheDocument();
  });

  it('shows a temporary trainer access form when trainer passcode env vars are configured', async () => {
    vi.stubEnv('VITE_TRAINER_ACCESS_USERNAME', 'coach@example.com');
    vi.stubEnv('VITE_TRAINER_ACCESS_PASSCODE', 'letmein');
    mocks.authState.user = { id: 'user-1', email: 'coach@example.com' };
    mocks.authState.session = { access_token: 'token-1' };

    renderAt('/clients');

    expect(await screen.findByText('Trainer Access Verification')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('coach@example.com');
    expect(screen.getByLabelText('Passcode')).toBeInTheDocument();
  });

  it('unlocks trainer pages for the current session after entering the correct temporary credentials', async () => {
    vi.stubEnv('VITE_TRAINER_ACCESS_USERNAME', 'coach@example.com');
    vi.stubEnv('VITE_TRAINER_ACCESS_PASSCODE', 'letmein');
    mocks.authState.user = { id: 'user-1', email: 'coach@example.com' };
    mocks.authState.session = { access_token: 'token-1' };

    renderAt('/clients');

    fireEvent.change(await screen.findByLabelText('Passcode'), {
      target: { value: 'letmein' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Trainer Access' }));

    expect(await screen.findByText('Clients Page')).toBeInTheDocument();
    expect(mocks.trainerState.setTrainerMode).toHaveBeenCalledWith(true);
    expect(window.sessionStorage.getItem('fitwizard-trainer-access-unlocked')).toBe('true');
  });
});
