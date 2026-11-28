import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Analytics from './Analytics';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { id: string } | null,
    profile: null as { is_trainer?: boolean } | null,
  },
  trainerState: {
    isTrainerMode: false,
  },
  tabsState: {
    value: 'today',
    onValueChange: undefined as ((value: string) => void) | undefined,
  },
  planState: {
    workoutLogs: [] as Array<{ id: string }>,
    currentPlan: null as { id: string } | null,
  },
  hydrated: true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/hooks/useStoresHydrated', () => ({
  useStoresHydrated: () => mocks.hydrated,
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: <T,>(selector?: Selector<typeof mocks.planState, T>) =>
    selectState(mocks.planState, selector),
}));

vi.mock('@/stores/readinessStore', () => ({
  useReadinessStore: <T,>(selector?: Selector<{ logs: unknown[] }, T>) => selectState({ logs: [] }, selector),
}));

vi.mock('@/lib/analyticsIntelligence', () => ({
  buildTrainingCompass: () => ({
    nextAction: 'Train upper body today.',
    score: 72,
    metrics: { recentWorkouts: 2 },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      whileHover: _whileHover,
      ...props
    }: {
      children: ReactNode;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
      whileHover?: unknown;
    }) => <div {...props}>{children}</div>,
    section: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      whileHover: _whileHover,
      ...props
    }: {
      children: ReactNode;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
      whileHover?: unknown;
    }) => <section {...props}>{children}</section>,
  },
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => {
    mocks.tabsState.value = value ?? 'today';
    mocks.tabsState.onValueChange = onValueChange;
    return <div>{children}</div>;
  },
  TabsContent: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: { children: ReactNode; value: string }) => (
    <button
      type="button"
      aria-selected={mocks.tabsState.value === value}
      onClick={() => mocks.tabsState.onValueChange?.(value)}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: <T,>(selector?: Selector<typeof mocks.authState, T>) =>
    selectState(mocks.authState, selector),
}));

vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: <T,>(selector?: Selector<typeof mocks.trainerState, T>) =>
    selectState(mocks.trainerState, selector),
}));

vi.mock('@/components/analytics/StrengthCurve', () => ({
  StrengthCurve: () => <div>Strength Curve Card</div>,
}));

vi.mock('@/components/analytics/VolumeHealth', () => ({
  VolumeHealth: () => <div>Volume Health Card</div>,
}));

vi.mock('@/components/analytics/LiftTruthMeterCard', () => ({
  LiftTruthMeterCard: () => <div>Lift Truth Meter Card</div>,
}));

vi.mock('@/components/analytics/PlanFitReviewCard', () => ({
  PlanFitReviewCard: () => <div>Plan Fit Review Card</div>,
}));

vi.mock('@/components/analytics/SessionRescueCard', () => ({
  SessionRescueCard: () => <div>Session Rescue Card</div>,
}));

vi.mock('@/components/analytics/TrainingCompassCard', () => ({
  TrainingCompassCard: () => <div>Daily Training Compass Card</div>,
}));

vi.mock('@/components/analytics/WeeklyCoachSummaryCard', () => ({
  WeeklyCoachSummaryCard: () => <div>Coach Notes</div>,
}));

vi.mock('@/components/analytics/WeeklyChangeBriefCard', () => ({
  WeeklyChangeBriefCard: () => <div>Weekly Change Brief Card</div>,
}));

vi.mock('@/components/recovery/ReadinessTrend', () => ({
  ReadinessTrend: () => <div>Readiness Trend Card</div>,
}));

describe('Analytics page command center', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.stubEnv('VITE_FEATURE_COACH', 'true');
    mocks.authState.user = null;
    mocks.authState.profile = null;
    mocks.trainerState.isTrainerMode = false;
    mocks.tabsState.value = 'today';
    mocks.tabsState.onValueChange = undefined;
    mocks.planState.workoutLogs = [{ id: 'log-1' }, { id: 'log-2' }];
    mocks.planState.currentPlan = { id: 'plan-1' };
    mocks.hydrated = true;
  });

  it('uses intent-based tabs and leads with today signals', () => {
    render(<Analytics />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.queryByText('Performance')).not.toBeInTheDocument();
    expect(screen.queryByText('Volume & Health')).not.toBeInTheDocument();
    expect(screen.getByText('Weekly Change Brief Card')).toBeInTheDocument();
    expect(screen.getByText('Daily Training Compass Card')).toBeInTheDocument();
    expect(screen.getByText('Session Rescue Card')).toBeInTheDocument();
    expect(screen.queryByText('Strength Curve Card')).not.toBeInTheDocument();
    expect(screen.queryByText('Volume Health Card')).not.toBeInTheDocument();
  });

  it('lazy-renders load analytics and hides Coach Notes when Coach Mode is off', () => {
    render(<Analytics />);

    fireEvent.click(screen.getByText('Load'));

    expect(screen.queryByText('Coach Notes')).not.toBeInTheDocument();
    expect(screen.queryByText('Daily Training Compass Card')).not.toBeInTheDocument();
    expect(screen.getByText('Volume Health Card')).toBeInTheDocument();
    expect(screen.getByText('Readiness Trend Card')).toBeInTheDocument();
  });

  it('shows Coach Notes for a local user when Coach Mode is on', () => {
    mocks.trainerState.isTrainerMode = true;

    render(<Analytics />);

    fireEvent.click(screen.getByText('Load'));

    expect(screen.getByText('Coach Notes')).toBeInTheDocument();
  });

  it('uses no coach wording in the header when the coach flag is off (DEBT-140)', () => {
    vi.stubEnv('VITE_FEATURE_COACH', 'false');
    render(<Analytics />);

    expect(screen.getByText(/Training signals for what changed/)).toBeInTheDocument();
    expect(screen.queryByText(/coach/i)).not.toBeInTheDocument();
  });

  it('hides Coach Notes when the coach flag is off, even if Coach Mode is persisted on', () => {
    vi.stubEnv('VITE_FEATURE_COACH', 'false');
    mocks.trainerState.isTrainerMode = true;

    render(<Analytics />);

    fireEvent.click(screen.getByText('Load'));

    expect(screen.queryByText('Coach Notes')).not.toBeInTheDocument();
  });

  it('hides Coach Notes for an authenticated non-trainer even if Coach Mode is persisted on', () => {
    mocks.authState.user = { id: 'user-1' };
    mocks.authState.profile = { is_trainer: false };
    mocks.trainerState.isTrainerMode = true;

    render(<Analytics />);

    fireEvent.click(screen.getByText('Load'));

    expect(screen.queryByText('Coach Notes')).not.toBeInTheDocument();
  });

  it('shows Coach Notes for an authenticated trainer when Coach Mode is on', () => {
    mocks.authState.user = { id: 'trainer-1' };
    mocks.authState.profile = { is_trainer: true };
    mocks.trainerState.isTrainerMode = true;

    render(<Analytics />);

    fireEvent.click(screen.getByText('Load'));

    expect(screen.getByText('Coach Notes')).toBeInTheDocument();
  });
});

describe('Analytics page empty state', () => {
  beforeEach(() => {
    mocks.planState.workoutLogs = [];
    mocks.planState.currentPlan = null;
    mocks.hydrated = true;
  });

  function renderAnalytics() {
    return render(
      <MemoryRouter initialEntries={['/analytics']}>
        <Analytics />
      </MemoryRouter>,
    );
  }

  it('asks for two workouts and points a user with no plan to the wizard', () => {
    renderAnalytics();

    expect(screen.getByTestId('analytics-empty-state')).toHaveTextContent('Log two workouts to see your trends.');
    expect(screen.getByRole('link', { name: 'Create a plan' })).toHaveAttribute('href', '/wizard');
    expect(screen.queryByText('Daily Training Compass Card')).not.toBeInTheDocument();
  });

  it("still shows the empty state after one workout, with a link to today's workout", () => {
    mocks.planState.workoutLogs = [{ id: 'log-1' }];
    mocks.planState.currentPlan = { id: 'plan-1' };
    renderAnalytics();

    expect(screen.getByTestId('analytics-empty-state')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Start today's workout" })).toHaveAttribute('href', '/plan');
  });

  it('shows the trends once two workouts are logged', () => {
    mocks.planState.workoutLogs = [{ id: 'log-1' }, { id: 'log-2' }];
    renderAnalytics();

    expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument();
    expect(screen.getByText('Daily Training Compass Card')).toBeInTheDocument();
  });

  it('shows a skeleton while stores are still loading', () => {
    mocks.hydrated = false;
    renderAnalytics();

    expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument();
    expect(screen.queryByText('Analytics Command Center')).not.toBeInTheDocument();
  });
});
