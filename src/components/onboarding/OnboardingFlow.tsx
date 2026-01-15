import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore, OnboardingStep } from '@/stores/onboardingStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { RoleStep } from './steps/RoleStep';
import { GoalsPreviewStep } from './steps/GoalsPreviewStep';
import { CoachImportStep } from './steps/CoachImportStep';
import { OnboardingProgress } from './OnboardingProgress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { useConfetti } from '@/hooks/useConfetti';

// Slide animation variants
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
};

// Step component mapping
const STEP_COMPONENTS: Record<OnboardingStep, React.ComponentType> = {
    welcome: WelcomeStep,
    role: RoleStep,
    goals: GoalsPreviewStep,
    import: CoachImportStep,
    complete: () => null, // Handled separately
};

export function OnboardingFlow() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { fire: fireConfetti } = useConfetti();
    const {
        currentStep,
        nextStep,
        prevStep,
        canProceed,
        getStepIndex,
        getTotalSteps,
        completeOnboarding,
        isComplete,
        userData,
    } = useOnboardingStore();

    // Direction for slide animation
    const stepIndex = getStepIndex();
    const totalSteps = getTotalSteps();
    const progress = ((stepIndex) / totalSteps) * 100;

    // Navigate home when complete (with delay for confetti)
    useEffect(() => {
        if (isComplete) {
            // Small delay to let confetti show before navigation
            const timer = setTimeout(() => {
                navigate('/', { replace: true });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isComplete, navigate]);

    const handleComplete = useCallback(() => {
        fireConfetti();
        completeOnboarding();
    }, [fireConfetti, completeOnboarding]);

    const handleNext = () => {
        if (currentStep === 'goals' && userData.role === 'user') {
            // Users skip import step - trigger celebration
            handleComplete();
        } else if (currentStep === 'import') {
            handleComplete();
        } else {
            nextStep();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const CurrentStepComponent = STEP_COMPONENTS[currentStep];

    if (!CurrentStepComponent) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Progress indicator */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2">
                <OnboardingProgress progress={progress} currentStep={stepIndex + 1} totalSteps={totalSteps} />
            </div>

            {/* Skip button */}
            <motion.div
                className="absolute top-6 right-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground hover:text-foreground"
                >
                    {t('onboarding.skip')}
                </Button>
            </motion.div>

            {/* Main content area */}
            <div className="w-full max-w-lg relative z-10">
                <AnimatePresence mode="wait" custom={1}>
                    <motion.div
                        key={currentStep}
                        custom={1}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                    >
                        <CurrentStepComponent />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <motion.div
                className="flex items-center gap-4 mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {/* Back button */}
                <AnimatePresence>
                    {stepIndex > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={prevStep}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                {t('onboarding.back')}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Next/Complete button */}
                <Button
                    size="lg"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={cn(
                        "gap-2 min-w-[140px] transition-all duration-300",
                        canProceed()
                            ? "gradient-primary text-primary-foreground shadow-glow"
                            : ""
                    )}
                >
                    {currentStep === 'goals' && userData.role === 'user' ? (
                        <>
                            {t('onboarding.lets_go')}
                            <Sparkles className="h-4 w-4" />
                        </>
                    ) : currentStep === 'import' ? (
                        <>
                            {t('onboarding.complete')}
                            <Sparkles className="h-4 w-4" />
                        </>
                    ) : (
                        <>
                            {t('onboarding.next')}
                            <ChevronRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </motion.div>
        </div>
    );
}
