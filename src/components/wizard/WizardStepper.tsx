import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/stores/wizardStore';

interface WizardStepperProps {
  currentStep: WizardStep;
  currentStepIndex: number;
  onStepClick?: (step: WizardStep) => void;
}

const STEPS: { id: WizardStep; label: string; shortLabel: string }[] = [
  { id: 'goal', label: 'Training Goal', shortLabel: 'Goal' },
  { id: 'equipment', label: 'Equipment', shortLabel: 'Equip' },
  { id: 'anatomy', label: 'Target Muscles', shortLabel: 'Muscles' },
  { id: 'constraints', label: 'Constraints', shortLabel: 'Limits' },
  { id: 'schedule', label: 'Schedule', shortLabel: 'Days' },
  { id: 'review', label: 'Review', shortLabel: 'Review' },
];

export function WizardStepper({ currentStep, currentStepIndex, onStepClick }: WizardStepperProps) {
  return (
    <nav 
      className="w-full py-4 px-2" 
      role="navigation" 
      aria-label="Wizard progress"
    >
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = index <= currentStepIndex && onStepClick;

          return (
            <li 
              key={step.id}
              className="flex-1 flex flex-col items-center"
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
                    isComplete && "border-stepper-complete bg-stepper-complete text-primary-foreground",
                    isCurrent && "border-stepper-active bg-stepper-active text-primary-foreground shadow-glow animate-pulse-glow",
                    !isComplete && !isCurrent && "border-stepper-inactive bg-background text-muted-foreground"
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

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div 
                  className={cn(
                    "hidden lg:block absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5",
                    isComplete ? "bg-stepper-complete" : "bg-stepper-inactive"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
