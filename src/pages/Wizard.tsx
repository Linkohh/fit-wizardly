import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { generatePlanFromExercises } from '@/lib/planGenerator';
import { loadExerciseDatabase, useExerciseDatabase } from '@/lib/exerciseRepository';
import { useToast } from '@/hooks/use-toast';
import { createFunnelTracker, trackWizardComplete, trackPlanGenerated } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0, scale: 0.98 }),
};

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
  const { exercises: cachedExercises } = useExerciseDatabase();

  // Ref for focus management
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const prevStepIndexRef = useRef(currentStepIndex);

  // Direction state for slide transitions: 1=forward, -1=back
  const [direction, setDirection] = useState(1);

  // Hydration guard - wait for store to load from localStorage
  const [hydrated, setHydrated] = useState(false);
  const totalSteps = 6;


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
    constraints: t('wizard.steps.constraints'),
    equipment: t('wizard.steps.equipment'),
    anatomy: t('wizard.steps.anatomy'),
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

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const exercises =
        cachedExercises.length > 0 ? cachedExercises : await loadExerciseDatabase();
      const plan = generatePlanFromExercises(exercises, selections);
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
  }, [cachedExercises, navigate, savePlanToHistory, selections, setCurrentPlan, setIsGenerating, t, toast]);

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
          else { setDirection(1); nextStep(); }
        }
      } else if (e.key === 'Escape') {
        if (currentStepIndex > 0) { setDirection(-1); prevStep(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, currentStepIndex, handleGenerate, isGenerating, nextStep, prevStep, validation.valid]);

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
      <div className="container-content py-8">
        <div className="animate-pulse space-y-4">
          <div className="animate-pulse rounded-xl bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 h-[32px] w-1/3" />
          <div className="animate-pulse rounded-xl bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 h-[16px] w-1/2" />
          <div className="animate-pulse rounded-xl bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 h-[48px] mt-6" />
          <div className="animate-pulse rounded-xl bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 h-[256px] mt-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-content py-6 md:py-8 pb-32">
      <div id="wizard-live-region" className="sr-only" aria-live="polite"></div>

      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
            {t('wizard.eyebrow', 'Coach-built intake')}
          </span>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/24 px-3 py-1 text-sm text-muted-foreground backdrop-blur-md md:bg-background/40">
            {t('wizard.estimate', 'About 2 minutes')}
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('wizard.title')}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t('wizard.subtitle', 'Answer six focused questions and we will shape a realistic training plan around your goals, schedule, equipment, and limitations.')}
            </p>
          </div>

          <p className="text-sm font-medium text-muted-foreground">
            {t('wizard.step_counter', 'Step {{current}} of {{total}}', { current: currentStepIndex + 1, total: totalSteps })}
          </p>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {stepNames[currentStep]}
          </span>
          <span className="text-muted-foreground">
            {t('wizard.step_counter', 'Step {{current}} of {{total}}', { current: currentStepIndex + 1, total: totalSteps })}
          </span>
        </div>
        <WizardProgressBar currentStepIndex={currentStepIndex} />
      </div>

      <div className="hidden md:block">
        <WizardStepper currentStep={currentStep} currentStepIndex={currentStepIndex} onStepClick={setStep} />
      </div>

      <div
        ref={stepContainerRef}
        tabIndex={-1}
        className="mt-8 min-h-[400px] pb-28 md:pb-0 outline-none"
        style={currentStep === 'anatomy' ? { paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' } : undefined}
        aria-label={`Step ${currentStepIndex + 1}: ${stepNames[currentStep]}`}
      >
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={currentStep}
            variants={slideVariants}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }}
            className={cn(
              currentStep === 'anatomy'
                ? ''
                : 'rounded-[2rem] border border-border/60 bg-background/24 p-4 shadow-[0_22px_60px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6 md:bg-background/40 md:p-8',
            )}
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
        onBack={() => { setDirection(-1); prevStep(); }}
        onNext={() => { setDirection(1); nextStep(); }}
        onStartOver={resetWizard}
        validationMessage={!validation.valid ? validation.message : undefined}
      />
    </div >
  );
}
