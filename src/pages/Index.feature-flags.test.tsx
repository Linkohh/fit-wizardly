import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Index from './Index';

const trainerState = vi.hoisted(() => ({ isTrainerMode: false }));

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key),
  }),
}));

// Keep the real framer-motion, but report every section as in view.
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useInView: () => true,
}));

vi.mock('@/stores/trainerStore', () => ({
  useTrainerStore: <T,>(selector?: (state: typeof trainerState) => T) =>
    selector ? selector(trainerState) : trainerState,
}));

vi.mock('@/stores/achievementStore', () => ({
  useAchievementStore: () => ({ totalPlansGenerated: 0 }),
}));

vi.mock('@/components/motivation/TrainerDashboard', () => ({
  TrainerDashboard: () => <div data-testid="trainer-dashboard">Trainer dashboard</div>,
}));
vi.mock('@/components/motivation/WelcomeHero', () => ({ WelcomeHero: () => <div>Welcome hero</div> }));
vi.mock('@/components/motivation/DailyQuote', () => ({ DailyQuote: () => null }));
vi.mock('@/components/motivation/StreakTracker', () => ({ StreakTracker: () => null }));
vi.mock('@/components/motivation/GoalVisualization', () => ({ GoalVisualization: () => null }));
vi.mock('@/components/analytics/PeriodizationTimeline', () => ({ PeriodizationTimeline: () => null }));
vi.mock('@/components/recovery/ReadinessCard', () => ({ ReadinessCard: () => null }));
vi.mock('@/components/landing/FeatureDetailModal', () => ({ FeatureDetailModal: () => null }));

function renderIndex() {
  return render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>,
  );
}

describe('Index coach entry points', () => {
  beforeEach(() => {
    trainerState.isTrainerMode = true;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not render the TrainerDashboard when the coach flag is off, even if Coach Mode is persisted on', async () => {
    vi.stubEnv('VITE_FEATURE_COACH', 'false');

    renderIndex();

    expect(await screen.findByText('Welcome hero')).toBeInTheDocument();
    expect(screen.queryByTestId('trainer-dashboard')).not.toBeInTheDocument();
  });

  it('renders the TrainerDashboard when the coach flag and Coach Mode are on', async () => {
    vi.stubEnv('VITE_FEATURE_COACH', 'true');

    renderIndex();

    expect(await screen.findByTestId('trainer-dashboard')).toBeInTheDocument();
  });
});
