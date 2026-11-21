import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnatomyStep } from '@/components/wizard/steps/AnatomyStep';
import { getAutoPickMuscles } from '@/components/wizard/steps/autoPickMuscles';
import { useWizardStore } from '@/stores/wizardStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | { defaultValue?: string }) =>
      typeof fallback === 'string' ? fallback : fallback?.defaultValue ?? key,
  }),
}));

// The 3D map is covered by its own tests; here it only needs to show what it was given.
vi.mock('@/components/wizard/anatomy/AnatomyPanel', async () => {
  const { useWizardStore: store } = await import('@/stores/wizardStore');
  return {
    AnatomyPanel: () => (
      <p data-testid="panel">{store.getState().selections.targetMuscles.join(',')}</p>
    ),
  };
});

describe('AnatomyStep', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWizardStore.getState().resetWizard();
  });

  it('picks a balanced full-body focus in one tap', async () => {
    render(<AnatomyStep />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Let FitWizard choose' }));
    });

    const muscles = useWizardStore.getState().selections.targetMuscles;
    expect(muscles).toEqual(getAutoPickMuscles());
    expect(muscles).toEqual(expect.arrayContaining(['chest', 'lats', 'quads', 'glutes']));
    expect(useWizardStore.getState().getStepValidation('anatomy').valid).toBe(true);
    expect(screen.getByTestId('panel')).toHaveTextContent('chest');
  });
});
