import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoalStep } from '@/components/wizard/steps/GoalStep';
import { useTrainerStore } from '@/stores/trainerStore';
import { useWizardStore } from '@/stores/wizardStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | { defaultValue?: string }) => {
      if (typeof fallback === 'string') {
        return fallback;
      }

      return fallback?.defaultValue ?? key;
    },
  }),
}));

describe('GoalStep', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWizardStore.getState().resetWizard();
    useTrainerStore.getState().setTrainerMode(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hides the trainer toggle when the coach flag is off', async () => {
    vi.stubEnv('VITE_FEATURE_COACH', 'false');
    render(<GoalStep />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add personal details' }));
    });

    expect(screen.getByLabelText('wizard.goal.first_name')).toBeInTheDocument();
    expect(screen.queryByTestId('goal-step-trainer-section')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('shows the trainer toggle when the coach flag is on', async () => {
    vi.stubEnv('VITE_FEATURE_COACH', 'true');
    render(<GoalStep />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add personal details' }));
    });

    expect(screen.getByTestId('goal-step-trainer-section')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('keeps personal fields collapsed until the user asks to personalize the plan', async () => {
    render(<GoalStep />);

    expect(screen.queryByLabelText('wizard.goal.first_name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('wizard.goal.last_name')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add personal details' }));
    });

    expect(screen.getByLabelText('wizard.goal.first_name')).toBeInTheDocument();
    expect(screen.getByLabelText('wizard.goal.last_name')).toBeInTheDocument();
  });
});
