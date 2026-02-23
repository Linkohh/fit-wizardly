import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnatomyPanel } from './AnatomyPanel';

const mocks = vi.hoisted(() => ({
  setTargetMuscles: vi.fn(),
  watch: vi.fn(() => [] as string[]),
  setValue: vi.fn(),
  trigger: vi.fn(),
}));

vi.mock('@/stores/wizardStore', () => ({
  useWizardStore: () => ({
    selections: {
      targetMuscles: [],
      equipment: [],
      experienceLevel: 'beginner',
    },
    setTargetMuscles: mocks.setTargetMuscles,
  }),
}));

vi.mock('@/hooks/useWizardForm', () => ({
  useWizardForm: () => ({
    watch: mocks.watch,
    setValue: mocks.setValue,
    formState: { errors: {} },
    trigger: mocks.trigger,
  }),
  anatomyStepSchema: {},
}));

vi.mock('@/lib/muscleMapping', () => ({
  mapLegacyToMcl: () => [],
  mapMclToLegacy: () => [],
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: (selector: (state: { mode: 'dark' }) => unknown) =>
    selector({ mode: 'dark' }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => true,
}));

vi.mock('@/components/ui/form-error', () => ({
  FormError: () => null,
}));

vi.mock('@/components/wizard/ExerciseSuggestions', () => ({
  ExerciseSuggestions: () => <div data-testid="exercise-suggestions" />,
}));

vi.mock('@/features/mcl', () => ({
  MuscleSelector: () => <div data-testid="mock-muscle-selector" />,
}));

describe('AnatomyPanel sizing', () => {
  it('includes dvh-aware sizing classes for iOS viewport stability', () => {
    render(<AnatomyPanel />);

    const shell = screen.getByTestId('anatomy-selector-shell');
    expect(shell).toHaveClass('h-[min(62vh,560px)]');
    expect(shell).toHaveClass('supports-[height:100dvh]:h-[min(62dvh,560px)]');
    expect(shell).toHaveClass('sm:h-[600px]');
  });
});

