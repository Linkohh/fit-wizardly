import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnatomyPanel } from './AnatomyPanel';

const mocks = vi.hoisted(() => ({
  setTargetMuscles: vi.fn(),
  watch: vi.fn(() => [] as string[]),
  setValue: vi.fn(),
  trigger: vi.fn(),
  muscleSelectorProps: [] as Array<Record<string, unknown>>,
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

vi.mock('@/components/ui/form-error', () => ({
  FormError: () => null,
}));

vi.mock('@/components/wizard/ExerciseSuggestions', () => ({
  ExerciseSuggestions: () => <div data-testid="exercise-suggestions" />,
}));

vi.mock('@/features/mcl', () => ({
  MuscleSelector: (props: Record<string, unknown>) => {
    mocks.muscleSelectorProps.push(props);
    return <div data-testid="mock-muscle-selector" />;
  },
}));

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

describe('AnatomyPanel sizing', () => {
  beforeEach(() => {
    mocks.muscleSelectorProps.length = 0;
  });

  it('opts the selector into the embedded header control mode for the wizard layout', () => {
    render(<AnatomyPanel />);

    expect(mocks.muscleSelectorProps.at(-1)?.headerControlsMode).toBe('embedded');
  });

  it('enables the side view even on mobile', () => {
    render(<AnatomyPanel />);

    expect(mocks.muscleSelectorProps.at(-1)?.showSideView).toBe(true);
  });

  it('enables press-and-slide muscle previews in the wizard', () => {
    render(<AnatomyPanel />);

    expect(mocks.muscleSelectorProps.at(-1)?.enableTouchPreview).toBe(true);
  });

  it('lets the selected list grow below the map on every phone', () => {
    render(<AnatomyPanel />);

    expect(mocks.muscleSelectorProps.at(-1)?.mobileSelectionLayout).toBe('flow');
  });

  it('only fixes the shell height where the list becomes a side column', () => {
    render(<AnatomyPanel />);

    const shell = screen.getByTestId('anatomy-selector-shell');
    expect(shell).toHaveClass('h-auto', 'md:h-[600px]');
  });

  it('keeps supporting coach context below the selector instead of in a separate side rail', () => {
    const { container } = render(<AnatomyPanel />);

    expect(container.querySelector('aside')).not.toBeInTheDocument();
  });
});
