import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WizardNavigationProps {
  canGoBack: boolean;
  canGoForward: boolean;
  isLastStep: boolean;
  isGenerating?: boolean;
  onBack: () => void;
  onNext: () => void;
  onGenerate?: () => void;
  validationMessage?: string;
}

export function WizardNavigation({
  canGoBack,
  canGoForward,
  isLastStep,
  isGenerating = false,
  onBack,
  onNext,
  onGenerate,
  validationMessage,
}: WizardNavigationProps) {
  return (
    <div className="w-full space-y-4">
      {validationMessage && (
        <p className="text-sm text-destructive text-center" role="alert">
          {validationMessage}
        </p>
      )}
      
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack}
          className={cn(
            "touch-target flex items-center gap-2",
            !canGoBack && "invisible"
          )}
          aria-label="Go to previous step"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {isLastStep ? (
          <Button
            onClick={onGenerate}
            disabled={!canGoForward || isGenerating}
            className="touch-target flex items-center gap-2 gradient-primary text-primary-foreground px-8"
            aria-label="Generate workout plan"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate Plan</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoForward}
            className="touch-target flex items-center gap-2"
            aria-label="Go to next step"
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
