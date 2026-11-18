import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HistoryPage from './History';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const mocks = vi.hoisted(() => ({
  workoutLogs: [] as Array<{ id: string; duration: number }>,
  currentPlan: null as { id: string } | null,
  hydrated: true,
}));

vi.mock('@/hooks/useStoresHydrated', () => ({
  useStoresHydrated: () => mocks.hydrated,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: <T,>(
    selector?: Selector<{ workoutLogs: typeof mocks.workoutLogs; currentPlan: typeof mocks.currentPlan }, T>,
  ) => selectState({ workoutLogs: mocks.workoutLogs, currentPlan: mocks.currentPlan }, selector),
}));

vi.mock('@/components/history/WorkoutHistoryCard', () => ({
  WorkoutHistoryCard: () => <div>Workout History Card</div>,
}));

describe('HistoryPage sticky header', () => {
  beforeEach(() => {
    mocks.workoutLogs = [];
    mocks.currentPlan = null;
    mocks.hydrated = true;
  });

  it('uses the shared shell sticky offset utility', () => {
    render(
      <MemoryRouter initialEntries={['/history']}>
        <HistoryPage />
      </MemoryRouter>,
    );

    const stickyHeader = screen.getByTestId('history-sticky-header');
    expect(stickyHeader).toHaveClass('sticky', 'app-shell-sticky-offset');
  });
});

function renderHistory() {
  return render(
    <MemoryRouter initialEntries={['/history']}>
      <HistoryPage />
    </MemoryRouter>,
  );
}

describe('HistoryPage empty state', () => {
  beforeEach(() => {
    mocks.workoutLogs = [];
    mocks.currentPlan = null;
    mocks.hydrated = true;
  });

  it('points a user with no plan to the wizard', () => {
    renderHistory();

    expect(screen.getByTestId('history-empty-state')).toHaveTextContent('Your finished workouts will show up here.');
    expect(screen.getByRole('link', { name: 'Create a plan' })).toHaveAttribute('href', '/wizard');
  });

  it("points a user with a plan to today's workout", () => {
    mocks.currentPlan = { id: 'plan-1' };
    renderHistory();

    expect(screen.getByRole('link', { name: "Start today's workout" })).toHaveAttribute('href', '/plan');
  });

  it('hides the empty state once a workout is logged', () => {
    mocks.workoutLogs = [{ id: 'log-1', duration: 3600 }];
    renderHistory();

    expect(screen.queryByTestId('history-empty-state')).not.toBeInTheDocument();
    expect(screen.getByText('Workout History Card')).toBeInTheDocument();
  });

  it('shows a skeleton while stores are still loading', () => {
    mocks.hydrated = false;
    renderHistory();

    expect(screen.queryByTestId('history-empty-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('history-sticky-header')).not.toBeInTheDocument();
  });
});
