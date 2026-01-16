import { useEffect, useRef, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { WizardProgressBar } from '@/components/wizard/WizardProgressBar';
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
  const resetWizard = useWizardStore((state) => state.resetWizard);
  const getStepValidation = useWizardStore((state) => state.getStepValidation);
  const isGenerating = useWizardStore((state) => state.isGenerating);
  const setIsGenerating = useWizardStore((state) => state.setIsGenerating);
  const selections = useWizardStore((state) => state.selections);

  const setCurrentPlan = usePlanStore((state) => state.setCurrentPlan);
  const savePlanToHistory = usePlanStore((state) => state.savePlanToHistory);

  // Ref for focus management
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const prevStepIndexRef = useRef(currentStepIndex);

  // Hydration guard - wait for store to load from localStorage
  const [hydrated, setHydrated] = useState(false);


  useEffect(() => {
    // Check if already hydrated
    if (useWizardStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Wait for hydration to complete
    const unsub = useWizardStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

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
    prevStepIndexRef.current = currentStepIndex;

    // Focus management
    const timer = setTimeout(() => {
      if (stepContainerRef.current) {
        // Try to focus the step heading for better context
        const heading = stepContainerRef.current.querySelector('h2');
        if (heading) {
          heading.tabIndex = -1;
          heading.focus();
        } else {
          // Fallback to container
          stepContainerRef.current.focus();
        }

        // Announce step change for screen readers
        const announcement = `Step ${currentStepIndex + 1}: ${stepNames[currentStep as keyof typeof stepNames]}`;
        const liveRegion = document.getElementById('wizard-live-region');
        if (liveRegion) liveRegion.innerText = announcement;
      }
    }, 150); // Slight increase to ensure render
    return () => clearTimeout(timer);
  }, [currentStep, currentStepIndex, stepNames]);

  // Move validation up so useEffect can use it
  const validation = getStepValidation(currentStep);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input field (allow native behavior)
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Enter') {
        if (validation.valid && !isGenerating) {
          if (currentStep === 'review') handleGenerate();
          else nextStep();
        }
      } else if (e.key === 'Escape') {
        if (currentStepIndex > 0) prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, currentStepIndex, validation.valid, isGenerating, nextStep, prevStep, selections]);

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
      default:
        // Fallback to first step if state is invalid
        return <GoalStep />;
    }
  };



  // Show loading skeleton until store is hydrated from localStorage
  if (!hydrated) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-12 bg-muted rounded mt-6" />
          <div className="h-64 bg-muted rounded-2xl mt-8" />
        </div>
      </div>
    );
  }

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

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block mr-2">
            {t('wizard.progress', { percent: Math.round(((currentStepIndex + 1) / 6) * 100) })}
          </span>
        </div>
      </div>


      {/* Pass translated step labels implicitly via WizardStepper if we update it, or let it handle itself. For now just standard usage. */}
      <WizardStepper currentStep={currentStep} currentStepIndex={currentStepIndex} onStepClick={setStep} />

      {/* Animated Progress Bar */}
      <WizardProgressBar currentStepIndex={currentStepIndex} className="mt-4" />

      {/* Step Content with simple fade transition */}
      <div
        ref={stepContainerRef}
        tabIndex={-1}
        className="mt-8 min-h-[400px] outline-none"
        aria-label={`Step ${currentStepIndex + 1}: ${stepNames[currentStep]}`}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="glass-premium rounded-2xl p-6"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <WizardNavigation
        onGenerate={handleGenerate}
        canGoBack={currentStepIndex > 0}
        canGoForward={validation.valid}
        isLastStep={currentStep === 'review'}
        isGenerating={isGenerating}
        onBack={prevStep}
        onNext={nextStep}
        onStartOver={resetWizard}
        validationMessage={!validation.valid ? validation.message : undefined}
      />
    </div >
  );
}
