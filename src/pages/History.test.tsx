import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HistoryPage from './History';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const mocks = vi.hoisted(() => ({
  workoutLogs: [] as Array<{ id: string }>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: <T,>(selector?: Selector<{ workoutLogs: typeof mocks.workoutLogs }, T>) =>
    selectState({ workoutLogs: mocks.workoutLogs }, selector),
}));

vi.mock('@/components/history/WorkoutHistoryCard', () => ({
  WorkoutHistoryCard: () => <div>Workout History Card</div>,
}));

describe('HistoryPage sticky header', () => {
  beforeEach(() => {
    mocks.workoutLogs = [];
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
