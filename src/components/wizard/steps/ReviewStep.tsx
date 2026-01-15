import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWizardStore } from '@/stores/wizardStore';
import { validatePlanBalance } from '@/lib/planValidation';
import { ReviewGoalCard } from '@/components/wizard/review/ReviewGoalCard';
import { ReviewScheduleCard } from '@/components/wizard/review/ReviewScheduleCard';
import { ReviewEquipmentCard } from '@/components/wizard/review/ReviewEquipmentCard';
import { ReviewMusclesCard } from '@/components/wizard/review/ReviewMusclesCard';
import { ReviewConstraintsCard } from '@/components/wizard/review/ReviewConstraintsCard';
import { ReviewCoachCard } from '@/components/wizard/review/ReviewCoachCard';
import { AlertTriangle, AlertCircle, Check, Sparkles, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ReviewStep() {
  const { t } = useTranslation();
  const { selections, setStep } = useWizardStore();

  // Validation Warnings
  const warnings = useMemo(() => validatePlanBalance(selections), [selections]);

  const hasPersonalInfo = selections.firstName || selections.lastName || selections.personalGoalNote;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t('wizard.review.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('wizard.review.subtitle')}</p>
      </div>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warning) => (
            <Card key={warning.id} className={cn(
              "border-l-4",
              warning.type === 'warning' ? "border-l-destructive border-destructive/20 bg-destructive/5" : "border-l-blue-500 border-blue-500/20 bg-blue-500/5"
            )}>
              <CardContent className="p-4 flex gap-3">
                {warning.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={cn("font-medium", warning.type === 'warning' ? "text-destructive" : "text-blue-500")}>
                    {warning.message}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {warning.context}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Personal Info Banner */}
      {hasPersonalInfo && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {selections.firstName || selections.lastName
                    ? `${selections.firstName} ${selections.lastName}`.trim()
                    : 'Your Personal Plan'}
                </h3>
                <p className="text-sm text-muted-foreground">{t('wizard.review.personalized_plan')}</p>
              </div>
            </div>
            {selections.personalGoalNote && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-primary/10">
                <Sparkles className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm italic text-foreground/90">"{selections.personalGoalNote}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <ReviewGoalCard selections={selections} onEdit={() => setStep('goal')} />
        <ReviewScheduleCard selections={selections} onEdit={() => setStep('schedule')} />
        <ReviewEquipmentCard selections={selections} onEdit={() => setStep('equipment')} />
        <ReviewMusclesCard selections={selections} onEdit={() => setStep('anatomy')} />
      </div>

      <ReviewConstraintsCard selections={selections} onEdit={() => setStep('constraints')} />
      <ReviewCoachCard selections={selections} />

      {/* Ready message */}
      <motion.div
        className="p-4 rounded-lg bg-success/10 border border-success/20 text-center overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-center gap-2 text-success font-medium">
          <Check className="h-5 w-5" />
          <span>{t('wizard.review.ready_message')}</span>
        </div>
      </motion.div>
    </div>
  );
}
