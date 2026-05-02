import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
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

vi.mock('@/components/recovery/ReadinessTrend', () => ({
  ReadinessTrend: () => <div>Readiness Trend Card</div>,
}));

describe('Analytics page coach mode gating', () => {
  beforeEach(() => {
    mocks.authState.user = null;
    mocks.authState.profile = null;
    mocks.trainerState.isTrainerMode = false;
  });

  it('hides Coach Notes when Coach Mode is off', () => {
    render(<Analytics />);

    expect(screen.queryByText('Coach Notes')).not.toBeInTheDocument();
    expect(screen.getByText('Daily Training Compass Card')).toBeInTheDocument();
    expect(screen.getByText('Plan Fit Review Card')).toBeInTheDocument();
    expect(screen.getByText('Session Rescue Card')).toBeInTheDocument();
    expect(screen.getByText('Volume Health Card')).toBeInTheDocument();
    expect(screen.getByText('Readiness Trend Card')).toBeInTheDocument();
  });

  it('shows Coach Notes for a local user when Coach Mode is on', () => {
    mocks.trainerState.isTrainerMode = true;

    render(<Analytics />);

    expect(screen.getByText('Coach Notes')).toBeInTheDocument();
  });

  it('hides Coach Notes for an authenticated non-trainer even if Coach Mode is persisted on', () => {
    mocks.authState.user = { id: 'user-1' };
    mocks.authState.profile = { is_trainer: false };
    mocks.trainerState.isTrainerMode = true;

    render(<Analytics />);

    expect(screen.queryByText('Coach Notes')).not.toBeInTheDocument();
  });

  it('shows Coach Notes for an authenticated trainer when Coach Mode is on', () => {
    mocks.authState.user = { id: 'trainer-1' };
    mocks.authState.profile = { is_trainer: true };
    mocks.trainerState.isTrainerMode = true;

    render(<Analytics />);

    expect(screen.getByText('Coach Notes')).toBeInTheDocument();
  });
});
