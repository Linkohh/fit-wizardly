import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useWizardStore } from '@/stores/wizardStore';
import { AnatomyPanel } from './AnatomyPanel';

vi.mock('@/components/wizard/ExerciseSuggestions', () => ({ ExerciseSuggestions: () => null }));
vi.mock('@/hooks/use-apple-mobile', () => ({ useAppleMobile: () => false }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({ shouldReduceMotion: true }),
}));
vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({ emit: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

const initialHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');

function tap(target: Element) {
  Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => target });

  for (const type of ['pointerdown', 'pointerup']) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 30, clientY: 30 });
    Object.defineProperties(event, {
      pointerType: { value: 'touch' },
      pointerId: { value: 1 },
      isPrimary: { value: true },
    });
    fireEvent(target, event);
  }
}

beforeEach(() => {
  useWizardStore.getState().resetWizard();
  window.localStorage.clear();
});

afterEach(() => {
  useWizardStore.getState().resetWizard();
  if (initialHitTest) Object.defineProperty(document, 'elementFromPoint', initialHitTest);
  else Reflect.deleteProperty(document, 'elementFromPoint');
});

it('toggles a restored wizard group with one canvas tap and one undo entry', () => {
  useWizardStore.getState().setTargetMuscles(['chest', 'calves']);
  render(<AnatomyPanel />);

  const canvas = within(screen.getByTestId('muscle-selector-canvas-area'));
  const left = canvas.getByRole('button', { name: 'Pectoralis Major (Left)' });
  const right = canvas.getByRole('button', { name: 'Pectoralis Major (Right)' });
  expect(left).toHaveAttribute('aria-pressed', 'true');
  expect(right).toHaveAttribute('aria-pressed', 'true');

  tap(left);

  expect(useWizardStore.getState().selections.targetMuscles).toEqual(['calves']);
  expect(left).toHaveAttribute('aria-pressed', 'false');
  expect(right).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

  expect(useWizardStore.getState().selections.targetMuscles).toEqual(['chest', 'calves']);
  expect(left).toHaveAttribute('aria-pressed', 'true');
  expect(right).toHaveAttribute('aria-pressed', 'true');

  tap(right);
  tap(left);

  expect(useWizardStore.getState().selections.targetMuscles).toEqual(['calves', 'chest']);
  expect(left).toHaveAttribute('aria-pressed', 'true');
  expect(right).toHaveAttribute('aria-pressed', 'true');
});
