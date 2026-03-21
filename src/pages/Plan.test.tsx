import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlanPage from './Plan';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setCurrentPlan: vi.fn(),
  clearCurrentPlan: vi.fn(),
  swapExercise: vi.fn(),
  resetWizard: vi.fn(),
  setContext: vi.fn(),
}));

const planStoreState = vi.hoisted(() => ({
  currentPlan: null as unknown,
  currentWeek: 1,
  workoutLogs: [],
  planHistory: [] as unknown[],
  personalRecords: [],
  preferredWeightUnit: 'lbs' as const,
  setCurrentPlan: mocks.setCurrentPlan,
  swapExercise: mocks.swapExercise,
  clearCurrentPlan: mocks.clearCurrentPlan,
  getWeeklySummary: () => null,
  getLastPerformance: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('@/stores/planStore', () => ({
  usePlanStore: <T,>(selector?: Selector<typeof planStoreState, T>) =>
    selectState(planStoreState, selector),
}));

vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: <T,>(selector?: Selector<{ isTrainerMode: boolean }, T>) =>
    selectState({ isTrainerMode: false }, selector),
}));

vi.mock('@/stores/wizardStore', () => ({
  useWizardStore: <T,>(selector?: Selector<{ resetWizard: typeof mocks.resetWizard }, T>) =>
    selectState({ resetWizard: mocks.resetWizard }, selector),
}));

vi.mock('@/stores/wisdomStore', () => ({
  useWisdomStore: <T,>(selector?: Selector<{ setContext: typeof mocks.setContext }, T>) =>
    selectState({ setContext: mocks.setContext }, selector),
}));

vi.mock('@/lib/progressionEngine', () => ({
  detectMRVWarnings: () => [],
  suggestSplitAdjustment: () => null,
}));

vi.mock('@/lib/displayText', () => ({
  formatIdentifierLabel: (value: string) => value,
}));

vi.mock('@/components/plan/WorkoutDayCard', () => ({
  WorkoutDayCard: ({ day }: { day: { name: string } }) => <div>Workout day: {day.name}</div>,
}));

vi.mock('@/components/wisdom/WisdomBubble', () => ({
  WisdomBubble: () => <div>Wisdom bubble</div>,
}));

vi.mock('@/components/plan/PlanNavigation', () => ({
  PlanNavigation: () => <div>Plan navigation</div>,
}));

vi.mock('@/components/plan/ExerciseSwapModal', () => ({
  ExerciseSwapModal: () => null,
}));

vi.mock('@/components/plan/SaveTemplateDialog', () => ({
  SaveTemplateDialog: () => null,
}));

vi.mock('@/components/plan/PeriodizationTimeline', () => ({
  PeriodizationTimeline: () => <div>Timeline</div>,
}));

vi.mock('@/components/tools/OneRepMaxCalculator', () => ({
  OneRepMaxCalculator: () => <div>Calculator</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  AlertDialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const samplePlan = {
  id: 'plan-1',
  splitType: 'upper-lower',
  selections: {
    daysPerWeek: 4,
    sessionDuration: 60,
    equipment: ['dumbbells'],
    optPhase: 'hypertrophy',
  },
  rirProgression: [],
  workoutDays: [
    {
      dayIndex: 0,
      name: 'Day 1',
      exercises: [],
    },
  ],
};

describe('PlanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    planStoreState.currentPlan = null;
    planStoreState.planHistory = [];
  });

  it('shows the empty state instead of an infinite skeleton when no plan is selected', () => {
    render(
      <MemoryRouter>
        <PlanPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('plan.noplan.headline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plan\.noplan\.cta_primary/i })).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('falls back to the most recent saved plan when currentPlan is missing', async () => {
    planStoreState.planHistory = [samplePlan];

    render(
      <MemoryRouter>
        <PlanPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('plan.title')).toBeInTheDocument();
    expect(screen.getByText('Workout day: Day 1')).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.setCurrentPlan).toHaveBeenCalledWith(samplePlan);
    });
  });
});
