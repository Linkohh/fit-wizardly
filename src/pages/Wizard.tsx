import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentStep, currentStepIndex, nextStep, prevStep, setStep, getStepValidation, selections, isGenerating, setIsGenerating } = useWizardStore();
  const { setCurrentPlan, savePlanToHistory } = usePlanStore();

  // Ref for focus management
  const stepContainerRef = useRef<HTMLDivElement>(null);

  // Step names for screen reader announcements
  const STEP_NAMES: Record<string, string> = {
    goal: 'Training Goal',
    equipment: 'Equipment Selection',
    anatomy: 'Target Muscles',
    constraints: 'Constraints',
    schedule: 'Schedule',
    review: 'Review & Generate',
  };

  // Analytics funnel tracker
  const funnelTrackerRef = useRef(createFunnelTracker());
  const prevStepRef = useRef(currentStep);

  // Focus management and analytics: track step changes
  useEffect(() => {
    const funnelTracker = funnelTrackerRef.current;

    // Track exit from previous step
    if (prevStepRef.current !== currentStep) {
      const prevIndex = Object.keys(STEP_NAMES).indexOf(prevStepRef.current);
      funnelTracker.exitStep(prevStepRef.current, prevIndex);
    }

    // Track enter to new step
    funnelTracker.enterStep(currentStep, currentStepIndex);
    prevStepRef.current = currentStep;

    // Focus management
    const timer = setTimeout(() => {
      if (stepContainerRef.current) {
        stepContainerRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep, currentStepIndex, STEP_NAMES]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const plan = generatePlan(selections);
      setCurrentPlan(plan);
      savePlanToHistory(plan);

      // Track analytics
      trackWizardComplete({
        goal: selections.goal,
        experienceLevel: selections.experienceLevel,
        daysPerWeek: selections.daysPerWeek,
        muscleCount: selections.targetMuscles.length,
        equipmentCount: selections.equipment.length,
      });
      trackPlanGenerated({
        splitType: plan.splitType,
        exerciseCount: plan.workoutDays.reduce((sum, day) => sum + day.exercises.length, 0),
      });

      toast({
        title: '🎉 Plan Generated!',
        description: 'Your personalized workout plan is ready. You got this!'
      });
      navigate('/plan');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate plan. Please try again.', variant: 'destructive' });
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
    }
  };

  const validation = getStepValidation(currentStep);

  return (
    <main className="container max-w-4xl mx-auto px-4 py-6">
      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Step {currentStepIndex + 1} of 6: {STEP_NAMES[currentStep]}
      </div>

      <WizardStepper currentStep={currentStep} currentStepIndex={currentStepIndex} onStepClick={setStep} />

      {/* Motivational Quote */}
      <MotivationalQuote stepIndex={currentStepIndex} />

      {/* Progress Percentage */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-2 flex-1 max-w-xs bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / 6) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {Math.round(((currentStepIndex + 1) / 6) * 100)}% complete
        </span>
      </div>

      <div
        ref={stepContainerRef}
        tabIndex={-1}
        className="mt-4 mb-8 animate-slide-in outline-none focus:ring-2 focus:ring-primary/20 focus:rounded-lg"
        aria-label={`Step ${currentStepIndex + 1}: ${STEP_NAMES[currentStep]}`}
      >
        {renderStep()}
      </div>
      <WizardNavigation
        canGoBack={currentStepIndex > 0}
        canGoForward={validation.valid}
        isLastStep={currentStep === 'review'}
        isGenerating={isGenerating}
        onBack={prevStep}
        onNext={nextStep}
        onGenerate={handleGenerate}
        validationMessage={!validation.valid ? validation.message : undefined}
      />
    </main>
  );
}
