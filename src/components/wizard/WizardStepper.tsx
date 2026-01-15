import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
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
    { id: 'goal', label: t('wizard.steps.goal'), shortLabel: t('wizard.stepper.short_goal') },
    { id: 'equipment', label: t('wizard.steps.equipment'), shortLabel: t('wizard.stepper.short_equip') },
    { id: 'anatomy', label: t('wizard.steps.anatomy'), shortLabel: t('wizard.stepper.short_muscles') },
    { id: 'constraints', label: t('wizard.steps.constraints'), shortLabel: t('wizard.stepper.short_limits') },
    { id: 'schedule', label: t('wizard.steps.schedule'), shortLabel: t('wizard.stepper.short_days') },
    { id: 'review', label: t('wizard.steps.review'), shortLabel: t('wizard.stepper.short_review') },
  ] as const, [t]);

  return (
    <nav
      className="w-full py-4 px-2"
      role="navigation"
      aria-label={t('wizard.stepper.progress_label')}
    >
      <ol className="flex items-center justify-between gap-0">
        {steps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = index <= currentStepIndex && onStepClick;
          const isLastStep = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className="relative flex-1 flex items-center min-w-0"
            >
              {/* Step button and indicator */}
              <div className="flex flex-col items-center w-full z-10">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center gap-2 touch-target",
                    isClickable && "cursor-pointer",
                    !isClickable && "cursor-default"
                  )}
                  aria-label={`${step.label}${isComplete ? ` (${t('wizard.stepper.completed')})` : isCurrent ? ` (${t('wizard.stepper.current')})` : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* Step indicator */}
                  <motion.div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300",
                      isComplete && "border-success bg-success text-primary-foreground",
                      isCurrent && "gradient-primary border-primary text-primary-foreground shadow-glow",
                      !isComplete && !isCurrent && "border-muted bg-background text-muted-foreground"
                    )}
                    animate={isCurrent ? {
                      boxShadow: [
                        '0 0 0 0 hsl(var(--primary) / 0.4)',
                        '0 0 20px 5px hsl(var(--primary) / 0.2)',
                        '0 0 0 0 hsl(var(--primary) / 0.4)',
                      ],
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {isComplete ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <Check className="h-5 w-5" aria-hidden="true" />
                      </motion.div>
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </motion.div>

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
              </div>

              {/* Connecting line to next step */}
              {!isLastStep && (
                <div className="absolute left-1/2 right-0 top-5 h-0.5 -translate-y-1/2">
                  {/* Background track */}
                  <div className="absolute inset-0 bg-muted/50 rounded-full" />
                  {/* Animated fill */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 rounded-full gradient-primary"
                    initial={{ width: '0%' }}
                    animate={{
                      width: isComplete ? '100%' : isCurrent ? '50%' : '0%'
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

