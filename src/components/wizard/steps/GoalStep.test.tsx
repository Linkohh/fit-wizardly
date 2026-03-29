import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
