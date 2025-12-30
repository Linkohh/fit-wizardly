import { useNavigate } from 'react-router-dom';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
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

export default function WizardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentStep, currentStepIndex, nextStep, prevStep, setStep, canAdvance, getStepValidation, selections, isGenerating, setIsGenerating } = useWizardStore();
  const { setCurrentPlan, savePlanToHistory } = usePlanStore();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const plan = generatePlan(selections);
      setCurrentPlan(plan);
      savePlanToHistory(plan);
      toast({ title: 'Plan Generated!', description: 'Your personalized workout plan is ready.' });
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
      <WizardStepper currentStep={currentStep} currentStepIndex={currentStepIndex} onStepClick={setStep} />
      <div className="mt-6 mb-8">{renderStep()}</div>
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
