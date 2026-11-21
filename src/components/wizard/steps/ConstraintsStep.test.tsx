import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConstraintsStep } from '@/components/wizard/steps/ConstraintsStep';
import { useWizardStore } from '@/stores/wizardStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | { defaultValue?: string }) =>
      typeof fallback === 'string' ? fallback : fallback?.defaultValue ?? key,
  }),
}));

describe('ConstraintsStep', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWizardStore.getState().resetWizard();
    useWizardStore.getState().setStep('constraints');
  });

  it('defaults to no constraints and continues in one tap', async () => {
    render(<ConstraintsStep />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /No injuries, continue/ }));
    });

    const state = useWizardStore.getState();
    expect(state.selections.constraints).toEqual([]);
    expect(state.currentStep).toBe('equipment');
  });

  it('hides the shortcut once a constraint is selected', async () => {
    render(<ConstraintsStep />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /No Jumping/ }));
    });

    expect(screen.queryByRole('button', { name: /No injuries, continue/ })).not.toBeInTheDocument();
  });
});
