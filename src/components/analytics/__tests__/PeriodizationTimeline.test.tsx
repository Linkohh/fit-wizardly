import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PeriodizationTimeline } from '../PeriodizationTimeline';

type MockTimelinePlan = {
  selections: {
    personalGoalNote: string;
    goal: string;
  };
  splitType: string;
  rirProgression: Array<{
    week: number;
    targetRIR: number;
    isDeload: boolean;
  }>;
};

const mockedPlanStoreState = vi.hoisted(() => ({
  currentPlan: null as MockTimelinePlan | null,
  currentWeek: 1,
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: () => mockedPlanStoreState,
}));

function buildCurrentPlan() {
  return {
    selections: {
      personalGoalNote: '',
      goal: 'strength',
    },
    splitType: 'push_pull_legs',
    rirProgression: [
      { week: 1, targetRIR: 3, isDeload: false },
      { week: 2, targetRIR: 2, isDeload: false },
      { week: 3, targetRIR: 1, isDeload: false },
    ],
  };
}

describe('analytics PeriodizationTimeline', () => {
  beforeEach(() => {
    mockedPlanStoreState.currentPlan = buildCurrentPlan();
    mockedPlanStoreState.currentWeek = 2;
  });

  it('renders split name without underscores in the title', () => {
    render(<PeriodizationTimeline />);

    expect(screen.getByText('Strength Push Pull Legs Split')).toBeInTheDocument();
  });

  it('highlights current week without scale transform classes', () => {
    render(<PeriodizationTimeline />);

    const weekItems = screen.getAllByTestId(/timeline-week-/);
    weekItems.forEach((item) => {
      expect(item.className).not.toMatch(/\bscale-/);
    });
    expect(screen.getByTestId('timeline-week-2')).toHaveClass('opacity-100');
  });
});
