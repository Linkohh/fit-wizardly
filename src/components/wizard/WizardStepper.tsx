import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/stores/wizardStore';

interface WizardStepperProps {
  currentStep: WizardStep;
  currentStepIndex: number;
  onStepClick?: (step: WizardStep) => void;
}

export function WizardStepper({ currentStep, currentStepIndex, onStepClick }: WizardStepperProps) {
  const { t } = useTranslation();

  const steps = useMemo(() => [
    { id: 'goal', label: t('wizard.steps.goal'), shortLabel: 'Goal' },
    { id: 'equipment', label: t('wizard.steps.equipment'), shortLabel: 'Equip' },
    { id: 'anatomy', label: t('wizard.steps.anatomy'), shortLabel: 'Muscles' },
    { id: 'constraints', label: t('wizard.steps.constraints'), shortLabel: 'Limits' },
    { id: 'schedule', label: t('wizard.steps.schedule'), shortLabel: 'Days' },
    { id: 'review', label: t('wizard.steps.review'), shortLabel: 'Review' },
  ] as const, [t]);

  return (
    <nav
      className="w-full py-4 px-2"
      role="navigation"
      aria-label="Wizard progress"
    >
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = index <= currentStepIndex && onStepClick;

          return (
            <li
              key={step.id}
              className="relative flex-1 flex flex-col items-center min-w-0"
            >
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 w-full touch-target",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default"
                )}
                aria-label={`${step.label}${isComplete ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step indicator */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isComplete && "border-success bg-success text-primary-foreground",
                    isCurrent && "gradient-primary border-primary text-primary-foreground shadow-glow animate-pulse-glow",
                    !isComplete && !isCurrent && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    "text-xs font-medium text-center transition-colors hidden sm:block",
                    isCurrent && "text-primary",
                    isComplete && "text-success",
                    !isComplete && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium text-center transition-colors sm:hidden",
                    isCurrent && "text-primary",
                    isComplete && "text-success",
                    !isComplete && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
