import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@/lib/i18n';
import { WizardStepper } from './WizardStepper';

function stepButtons() {
  render(<WizardStepper currentStep="constraints" currentStepIndex={1} onStepClick={() => undefined} />);
  const nav = screen.getByRole('navigation', { name: 'Plan progress' });
  return within(nav).getAllByRole('button');
}

describe('WizardStepper accessible names', () => {
  // jsdom doesn't apply Tailwind, so both the long and the short label are in the
  // name here. In a browser only one is displayed; either way the name starts with
  // visible text and ends with a single bracketed status.

  it('names the current step by its label plus "(current)", with one pair of brackets', () => {
    const current = stepButtons()[1];
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).not.toHaveAttribute('aria-label');
    expect(current).toHaveAccessibleName(/^Limitations\s*Limits \(current\)$/);
  });

  it('names a completed step by its label plus "(completed)"', () => {
    const completed = stepButtons()[0];
    expect(completed).not.toHaveAttribute('aria-label');
    expect(completed).toHaveAccessibleName(/^Training Goal\s*Goal \(completed\)$/);
  });

  it('gives upcoming steps no status and never doubles the brackets', () => {
    const buttons = stepButtons();
    expect(buttons[2]).toHaveAccessibleName(/^Equipment\s*Equip$/);
    buttons.forEach((button) => {
      expect(button).not.toHaveAccessibleName(/\(\(|\)\)/);
      expect(button).not.toHaveAccessibleName(/^\d/);
    });
  });
});
