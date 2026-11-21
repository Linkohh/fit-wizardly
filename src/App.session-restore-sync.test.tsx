/**
 * A session restored on start-up (ADR 12) must set `user` the same way a fresh
 * sign-in does, so the cloud sync effect in App.tsx (#66) starts after a
 * restart without the user signing in again.
 *
 * Uses the real authStore. Only the Supabase client, the sync engine and the
 * heavy page chrome are mocked.
 */
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useAuthStore } from '@/stores/authStore';

const mocks = vi.hoisted(() => {
  const profileQuery = {
    select: () => profileQuery,
    eq: () => profileQuery,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  return {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    from: vi.fn(() => profileQuery),
    startSync: vi.fn(() => vi.fn()),
    startSyncCollections: vi.fn(),
  };
});

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: mocks.from,
  },
}));

vi.mock('@/lib/sync/triggers', () => ({
  startSync: mocks.startSync,
}));

vi.mock('@/lib/sync/collections', () => ({
  startSyncCollections: mocks.startSyncCollections,
}));

vi.mock('@/stores/planStore', () => {
  const state = { syncWithBackend: vi.fn() };
  return {
    usePlanStore: <T,>(selector?: (s: typeof state) => T) => (selector ? selector(state) : state),
  };
});

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/components/Header', () => ({ Header: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/auth/AuthModal', () => ({ AuthModal: () => null }));
vi.mock('@/components/legal/ConsentModal', () => ({ ConsentModal: () => null }));
vi.mock('@/components/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('@/components/ui/living-background', () => ({ LivingBackground: () => null }));
vi.mock('@/components/install/InstallCoachHost', () => ({ InstallCoachHost: () => null }));
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('./components/OnboardingGuard', () => ({
  OnboardingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./pages/Legal', () => ({ default: () => <div>Legal Page</div> }));

const restoredSession = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  user: { id: 'user-restored', email: 'lifter@example.com', user_metadata: {} },
};

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/legal']}>
      <App />
    </MemoryRouter>,
  );
}

describe('App: restored session starts cloud sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, session: null, profile: null, isLoading: true });

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

  it('starts sync for the user whose session was restored on start-up', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: restoredSession }, error: null });

    renderApp();

    await waitFor(() => expect(mocks.startSync).toHaveBeenCalledWith('user-restored'));
    expect(useAuthStore.getState().user?.id).toBe('user-restored');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('does not start sync when no session was saved', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });

    renderApp();

    await waitFor(() => expect(useAuthStore.getState().isLoading).toBe(false));
    expect(mocks.startSync).not.toHaveBeenCalled();
  });
});
