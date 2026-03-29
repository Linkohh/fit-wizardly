import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, CheckCircle2, PencilLine, Sparkles, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { validatePlanBalance } from '@/lib/planValidation';
import { formatIdentifierLabel } from '@/lib/displayText';
import { cn } from '@/lib/utils';
import { CONSTRAINT_OPTIONS, EQUIPMENT_OPTIONS } from '@/types/fitness';
import { useWizardStore } from '@/stores/wizardStore';

type ReviewRowProps = {
  label: string;
  value: ReactNode;
  detail?: string;
  onEdit: () => void;
};

function ReviewRow({ label, value, detail, onEdit }: ReviewRowProps) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-start">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-relaxed text-foreground">{value}</div>
        {detail ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {detail}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        <PencilLine className="h-4 w-4" />
        Edit
      </button>
    </div>
  );
}

export function ReviewStep() {
  const { t } = useTranslation();
  const { selections, setStep } = useWizardStore();
  const warnings = useMemo(() => validatePlanBalance(selections), [selections]);

  const hasPersonalInfo = selections.firstName || selections.lastName || selections.personalGoalNote;
  const fullName = `${selections.firstName} ${selections.lastName}`.trim();
  const weeklyHours = ((selections.daysPerWeek * selections.sessionDuration) / 60).toFixed(1);
  const splitLabel =
    selections.daysPerWeek <= 3
      ? t('wizard.schedule.split_full_body')
      : selections.daysPerWeek === 4
        ? t('wizard.schedule.split_upper_lower')
        : t('wizard.schedule.split_ppl');

  const equipmentLabels = selections.equipment.map((equipment) =>
    EQUIPMENT_OPTIONS.find((option) => option.id === equipment)?.name ?? formatIdentifierLabel(equipment),
  );
  const constraintLabels = selections.constraints.map((constraint) =>
    CONSTRAINT_OPTIONS.find((option) => option.id === constraint)?.name ?? formatIdentifierLabel(constraint),
  );
  const targetMuscleLabels = selections.targetMuscles.map((muscle) => formatIdentifierLabel(muscle));

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
          {t('wizard.review.coach_summary', 'Coach summary')}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('wizard.review.title')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t('wizard.review.coach_summary_copy', 'Scan the prescription like a coach would: confirm the goal, weekly commitment, equipment, muscle focus, and any guardrails before the plan is generated.')}
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className={cn(
                'rounded-[1.35rem] border px-4 py-4',
                warning.type === 'warning'
                  ? 'border-destructive/25 bg-destructive/6'
                  : 'border-blue-500/25 bg-blue-500/6',
              )}
            >
              <div className="flex gap-3">
                {warning.type === 'warning' ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                )}
                <div>
                  <h3
                    className={cn(
                      'font-medium',
                      warning.type === 'warning' ? 'text-destructive' : 'text-blue-300',
                    )}
                  >
                    {warning.message}
                  </h3>
                  {warning.context ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {warning.context}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-[2rem] border border-border/60 bg-background/35 p-5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-primary/80">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">
                {hasPersonalInfo && fullName ? fullName : t('wizard.review.personalized_plan')}
              </span>
            </div>

            {selections.personalGoalNote ? (
              <div className="max-w-2xl rounded-[1.5rem] border border-primary/20 bg-primary/8 px-4 py-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <p className="text-sm italic leading-relaxed text-foreground/90">
                    “{selections.personalGoalNote}”
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <motion.div
            className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {t('wizard.review.ready_message')}
          </motion.div>
        </div>

        <div className="mt-8 divide-y divide-border/60">
          <ReviewRow
            label={t('wizard.review.goal_experience')}
            value={`${t(`goals.${selections.goal}`)} • ${t(`experience.${selections.experienceLevel}`)}`}
            detail={t('wizard.review.goal_experience_detail', 'This sets the training emphasis, recovery demand, and the phase we recommend first.')}
            onEdit={() => setStep('goal')}
          />
          <ReviewRow
            label={t('wizard.review.weekly_commitment', 'Weekly commitment')}
            value={`${selections.daysPerWeek} ${t('wizard.review.days')} • ${selections.sessionDuration} ${t('wizard.review.min')} • ${weeklyHours} ${t('wizard.schedule.hours')}`}
            detail={`${t('wizard.review.split_type')}: ${splitLabel}`}
            onEdit={() => setStep('schedule')}
          />
          <ReviewRow
            label={t('wizard.review.equipment')}
            value={equipmentLabels.join(' • ')}
            detail={t('wizard.review.equipment_detail', 'Only exercises that fit this setup will be prioritized in the generated plan.')}
            onEdit={() => setStep('equipment')}
          />
          <ReviewRow
            label={t('wizard.review.target_muscles')}
            value={targetMuscleLabels.length > 0 ? targetMuscleLabels.join(' • ') : t('wizard.review.no_muscles')}
            detail={t('wizard.review.target_muscles_detail', 'These areas will shape weekly emphasis, exercise selection, and overall split balance.')}
            onEdit={() => setStep('anatomy')}
          />
          <ReviewRow
            label={t('wizard.review.restrictions', 'Restrictions')}
            value={constraintLabels.length > 0 ? constraintLabels.join(' • ') : t('wizard.constraints.no_constraints')}
            detail={t('wizard.review.constraints_hint')}
            onEdit={() => setStep('constraints')}
          />
        </div>

        {selections.coachNotes ? (
          <div className="mt-8 border-t border-border/60 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('wizard.review.coach_notes_title', 'Coach notes')}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {selections.coachNotes}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
