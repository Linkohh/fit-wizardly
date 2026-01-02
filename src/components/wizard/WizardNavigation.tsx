import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
          aria-label={t('wizard.navigation.back')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t('wizard.navigation.back')}</span>
        </Button>

        {isLastStep ? (
          <Button
            variant="gradient"
            onClick={onGenerate}
            disabled={!canGoForward || isGenerating}
            className="touch-target flex items-center gap-2 px-8"
            aria-label={t('wizard.navigation.generate')}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('common.loading')}</span>
              </>
            ) : (
              <>
                <span>{t('wizard.navigation.generate')}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={onNext}
            disabled={!canGoForward}
            className="touch-target flex items-center gap-2"
            aria-label={t('wizard.navigation.next')}
          >
            <span className="hidden sm:inline">{t('wizard.navigation.next')}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
