import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { MotivationalQuote } from '@/components/wizard/MotivationalQuote';
import { GoalStep } from '@/components/wizard/steps/GoalStep';
import { EquipmentStep } from '@/components/wizard/steps/EquipmentStep';
import { AnatomyStep } from '@/components/wizard/steps/AnatomyStep';
import { ConstraintsStep } from '@/components/wizard/steps/ConstraintsStep';
import { ScheduleStep } from '@/components/wizard/steps/ScheduleStep';
import { ReviewStep } from '@/components/wizard/steps/ReviewStep';
import { useWizardStore } from '@/stores/wizardStore';
import { usePlanStore } from '@/stores/planStore';
import { generatePlan } from '@/lib/planGenerator';
import { useToast } from '@/hooks/use-toast';
import { createFunnelTracker, trackWizardComplete, trackPlanGenerated } from '@/lib/analytics';

export default function WizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Atomic selectors to prevent unnecessary re-renders
  const currentStep = useWizardStore((state) => state.currentStep);
  const currentStepIndex = useWizardStore((state) => state.currentStepIndex);
  const setStep = useWizardStore((state) => state.setStep);
  const nextStep = useWizardStore((state) => state.nextStep);
  const prevStep = useWizardStore((state) => state.prevStep);
  const getStepValidation = useWizardStore((state) => state.getStepValidation);
  const isGenerating = useWizardStore((state) => state.isGenerating);
  const setIsGenerating = useWizardStore((state) => state.setIsGenerating);
  const selections = useWizardStore((state) => state.selections);

  const setCurrentPlan = usePlanStore((state) => state.setCurrentPlan);
  const savePlanToHistory = usePlanStore((state) => state.savePlanToHistory);

  // Ref for focus management
  const stepContainerRef = useRef<HTMLDivElement>(null);

  // Step names for screen reader announcements and analytics
  const stepNames = useMemo(() => ({
    goal: t('wizard.steps.goal'),
    equipment: t('wizard.steps.equipment'),
    anatomy: t('wizard.steps.anatomy'),
    constraints: t('wizard.steps.constraints'),
    schedule: t('wizard.steps.schedule'),
    review: t('wizard.steps.review'),
  }), [t]);

  // Analytics funnel tracker
  const funnelTrackerRef = useRef(createFunnelTracker());
  const prevStepRef = useRef(currentStep);

  // Focus management and analytics: track step changes
  useEffect(() => {
    const funnelTracker = funnelTrackerRef.current;

    // Track exit from previous step
    if (prevStepRef.current !== currentStep) {
      const prevIndex = Object.keys(stepNames).indexOf(prevStepRef.current);
      funnelTracker.exitStep(prevStepRef.current, prevIndex);
    }

    // Track enter to new step
    funnelTracker.enterStep(currentStep, currentStepIndex);
    prevStepRef.current = currentStep;

    // Focus management
    const timer = setTimeout(() => {
      if (stepContainerRef.current) {
        stepContainerRef.current.focus();
        // Announce step change for screen readers
        const announcement = `Step ${currentStepIndex + 1}: ${stepNames[currentStep as keyof typeof stepNames]}`;
        const liveRegion = document.getElementById('wizard-live-region');
        if (liveRegion) liveRegion.innerText = announcement;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep, currentStepIndex, stepNames]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const plan = generatePlan(selections);
      setCurrentPlan(plan);
      savePlanToHistory(plan);

      // Track completion
      trackWizardComplete();
      trackPlanGenerated({
        goal: selections.goal,
        experienceLevel: selections.experienceLevel,
        muscleCount: selections.targetMuscles.length,
        equipmentCount: selections.equipment.length,
        daysPerWeek: selections.daysPerWeek
      });

      toast({
        title: t('wizard.toast.success_title'),
        description: t('wizard.toast.success_description'),
      });
      navigate('/plan');
    } catch (error) {
      console.error(error);
      toast({
        title: t('wizard.toast.error_title'),
        description: t('wizard.toast.error_description'),
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'goal': return <GoalStep />;
      case 'equipment': return <EquipmentStep />;
      case 'anatomy': return <AnatomyStep />;
      case 'constraints': return <ConstraintsStep />;
      case 'schedule': return <ScheduleStep />;
      case 'review': return <ReviewStep />;
      default: return null;
    }
  };

  const validation = getStepValidation(currentStep);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-32">
      <div id="wizard-live-region" className="sr-only" aria-live="polite"></div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            {t('wizard.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('app.tagline')}
          </p>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {t('wizard.progress', { percent: Math.round(((currentStepIndex + 1) / 6) * 100) })}
        </span>
      </div>

      {/* Pass translated step labels implicitly via WizardStepper if we update it, or let it handle itself. For now just standard usage. */}
      <WizardStepper currentStep={currentStep} currentStepIndex={currentStepIndex} onStepClick={setStep} />

      <div
        ref={stepContainerRef}
        tabIndex={-1}
        className="mt-8 min-h-[400px] outline-none"
        aria-label={`Step ${currentStepIndex + 1}: ${stepNames[currentStep]}`}
      >
        {renderStep()}
      </div>

      <WizardNavigation
        onGenerate={handleGenerate}
        canGoBack={currentStepIndex > 0}
        canGoForward={validation.valid} // used for Next button disabled state
        isLastStep={currentStep === 'review'}
        isGenerating={isGenerating}
        onBack={prevStep}
        onNext={nextStep}
        validationMessage={!validation.valid ? validation.message : undefined}
      />
    </div>
  );
}
