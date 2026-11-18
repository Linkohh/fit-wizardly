import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWizardStore } from '@/stores/wizardStore';

describe('wizardStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWizardStore.getState().resetWizard();
  });

  it('advances through the premium coach step order', () => {
    const visitedSteps = [useWizardStore.getState().currentStep];

    for (let index = 0; index < 5; index += 1) {
      useWizardStore.getState().nextStep();
      visitedSteps.push(useWizardStore.getState().currentStep);
    }

    expect(visitedSteps).toEqual([
      'goal',
      'constraints',
      'equipment',
      'anatomy',
      'schedule',
      'review',
    ]);
  });

  it('maps the reordered constraints step to index 1', () => {
    useWizardStore.getState().setStep('constraints');

    expect(useWizardStore.getState().currentStepIndex).toBe(1);
  });

  describe('saved coach flag (DEBT-065)', () => {
    const saveIsTrainer = () =>
      window.localStorage.setItem(
        'fitwizard-wizard',
        JSON.stringify({ state: { selections: { isTrainer: true, goal: 'hypertrophy' } }, version: 0 }),
      );

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('loads a saved isTrainer: true as false while the coach flag is off', async () => {
      vi.stubEnv('VITE_FEATURE_COACH', 'false');
      saveIsTrainer();

      await useWizardStore.persist.rehydrate();

      expect(useWizardStore.getState().selections.isTrainer).toBe(false);
      expect(useWizardStore.getState().selections.goal).toBe('hypertrophy');
    });

    it('keeps it when the coach flag is on', async () => {
      vi.stubEnv('VITE_FEATURE_COACH', 'true');
      saveIsTrainer();

      await useWizardStore.persist.rehydrate();

      expect(useWizardStore.getState().selections.isTrainer).toBe(true);
    });
  });
});
