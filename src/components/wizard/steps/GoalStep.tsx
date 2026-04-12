import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Sparkles, User } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { PhaseRecommendationCard } from '@/components/wizard/PhaseRecommendationCard';
import { FormError } from '@/components/ui/form-error';
import { useWizardForm, goalStepSchema } from '@/hooks/useWizardForm';
import { shakeVariants } from '@/lib/formAnimations';
import { cn } from '@/lib/utils';
import { getExperienceLevels, getGoals } from '@/lib/wizardConstants';
import { useTrainerStore } from '@/stores/trainerStore';
import { useWizardStore } from '@/stores/wizardStore';
import type { ExperienceLevel, Goal } from '@/types/fitness';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';

export function GoalStep() {
  const { t } = useTranslation();
  const {
    selections,
    setCoachNotes,
    setExperienceLevel,
    setFirstName,
    setGoal,
    setLastName,
    setPersonalGoalNote,
  } = useWizardStore();
  const { isTrainerMode, setTrainerMode } = useTrainerStore();
  const isTrainerAuthorized = useAuthStore((state) => state.profile?.is_trainer === true);
  const isTrainerEnabled = isTrainerAuthorized && isTrainerMode;
  const goals = getGoals(t);
  const experienceLevels = getExperienceLevels(t);
  const shouldStartPersonalizedOpen = Boolean(
    selections.firstName
    || selections.lastName
    || selections.personalGoalNote
    || selections.coachNotes
    || isTrainerEnabled,
  );
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(shouldStartPersonalizedOpen);

  const { control, formState: { errors }, setValue, watch } = useWizardForm({
    schema: goalStepSchema,
    defaultValues: {
      firstName: selections.firstName || '',
      lastName: selections.lastName || '',
      personalGoalNote: selections.personalGoalNote || '',
      isTrainer: isTrainerEnabled,
      coachNotes: selections.coachNotes || '',
      goal: selections.goal,
      experienceLevel: selections.experienceLevel,
    },
    onSync: (values) => {
      if (values.firstName !== undefined) setFirstName(values.firstName);
      if (values.lastName !== undefined) setLastName(values.lastName);
      if (values.personalGoalNote !== undefined) setPersonalGoalNote(values.personalGoalNote);
      if (values.isTrainer !== undefined) setTrainerMode(values.isTrainer);
      if (values.coachNotes !== undefined) setCoachNotes(values.coachNotes);
      if (values.goal !== undefined) setGoal(values.goal);
      if (values.experienceLevel !== undefined) setExperienceLevel(values.experienceLevel);
    },
  });

  useEffect(() => {
    setValue('isTrainer', isTrainerEnabled);
  }, [isTrainerEnabled, setValue]);

  useEffect(() => {
    if (shouldStartPersonalizedOpen) {
      setIsPersonalizationOpen(true);
    }
  }, [shouldStartPersonalizedOpen]);

  const watchedGoal = watch('goal');
  const watchedExperienceLevel = watch('experienceLevel');
  const watchedPersonalGoalNote = watch('personalGoalNote') || '';
  const watchedIsTrainer = watch('isTrainer');

  const getPhase = (goal: Goal, experienceLevel: ExperienceLevel) => {
    if (experienceLevel === 'beginner') return 'stabilization_endurance';
    if (experienceLevel === 'intermediate') {
      if (goal === 'strength') return 'strength_endurance';
      if (goal === 'hypertrophy') return 'muscular_development';
      return 'stabilization_endurance';
    }

    if (goal === 'strength') return 'maximal_strength';
    if (goal === 'hypertrophy') return 'muscular_development';
    return 'power';
  };

  const currentPhaseKey = selections.optPhase || getPhase(
    watchedGoal || selections.goal,
    watchedExperienceLevel || selections.experienceLevel,
  );

  const handleResetRecommendation = () => {
    setValue('goal', 'hypertrophy', { shouldDirty: true, shouldValidate: true });
    setValue('experienceLevel', 'intermediate', { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
              {t('wizard.goal.personalize_badge')}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {t('wizard.goal.training_goal_title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t('wizard.goal.training_goal_subtitle')}
            </p>
          </div>

          {(watchedGoal !== 'hypertrophy' || watchedExperienceLevel !== 'intermediate') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetRecommendation}
              className="touch-target w-full border-primary/30 text-primary hover:bg-primary/10 lg:w-auto"
            >
              {t('wizard.goal.reset_recommended')}
            </Button>
          )}
        </div>

        <Controller
          name="goal"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(value) => field.onChange(value as Goal)}
              className="grid gap-3 lg:grid-cols-3"
            >
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = field.value === goal.id;

                return (
                  <Label key={goal.id} htmlFor={goal.id} className="cursor-pointer">
                    <div
                      className={cn(
                        'relative flex h-full flex-col rounded-[1.5rem] border p-4 transition-all duration-300 sm:p-5',
                        isSelected
                          ? 'border-primary/40 bg-primary/10 shadow-[0_24px_50px_-34px_rgba(168,85,247,0.8)]'
                          : 'border-border/60 bg-background/30 hover:border-primary/25 hover:bg-background/45',
                      )}
                    >
                      <RadioGroupItem
                        value={goal.id}
                        id={goal.id}
                        className="sr-only"
                        aria-describedby={`${goal.id}-description`}
                      />

                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t('wizard.goal.selected_label', 'Selected')}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="mt-5 space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">{goal.label}</h3>
                        <p id={`${goal.id}-description`} className="text-sm leading-relaxed text-muted-foreground">
                          {goal.description}
                        </p>
                      </div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          )}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] xl:items-start">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{t('wizard.goal.experience_title')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t('wizard.goal.experience_subtitle')}
            </p>
          </div>

          <Controller
            name="experienceLevel"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={(value) => field.onChange(value as ExperienceLevel)}
                className="space-y-3"
              >
                {experienceLevels.map((level) => {
                  const isSelected = field.value === level.id;

                  return (
                    <Label key={level.id} htmlFor={`exp-${level.id}`} className="cursor-pointer">
                      <div
                        className={cn(
                          'rounded-[1.25rem] border px-4 py-4 transition-all duration-300 sm:px-5',
                          isSelected
                            ? 'border-primary/35 bg-primary/8'
                            : 'border-border/60 bg-background/20 hover:border-primary/20 hover:bg-background/35',
                        )}
                      >
                        <RadioGroupItem
                          value={level.id}
                          id={`exp-${level.id}`}
                          className="sr-only"
                          aria-describedby={`exp-${level.id}-description`}
                        />

                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'mt-1.5 h-2.5 w-2.5 rounded-full transition-colors',
                              isSelected ? 'bg-primary' : 'bg-muted-foreground/40',
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-4">
                              <h4 className="font-semibold text-foreground">{level.label}</h4>
                              {isSelected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                            </div>
                            <p
                              id={`exp-${level.id}-description`}
                              className="mt-1 text-sm leading-relaxed text-muted-foreground"
                            >
                              {level.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            )}
          />
        </div>

        <PhaseRecommendationCard phaseKey={currentPhaseKey} />
      </section>

      <section className="border-t border-border/60 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-primary/80">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{t('wizard.goal.personalize_title', 'Make it personal')}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t('wizard.goal.personalize_helper', 'Add your name, a short goal note, or coach notes without crowding the core training decisions.')}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPersonalizationOpen((open) => !open)}
            className="touch-target w-full justify-between border-border/70 bg-background/30 md:w-auto"
            aria-expanded={isPersonalizationOpen}
            aria-controls="goal-personalization-panel"
          >
            {t('wizard.goal.personalize_toggle', 'Add personal details')}
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isPersonalizationOpen && 'rotate-180',
              )}
            />
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {isPersonalizationOpen && (
            <motion.div
              id="goal-personalization-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        {t('wizard.goal.first_name')}
                      </Label>
                      <Controller
                        name="firstName"
                        control={control}
                        render={({ field }) => (
                          <>
                            <motion.div variants={shakeVariants} animate={errors.firstName ? 'error' : 'initial'}>
                              <Input
                                {...field}
                                id="firstName"
                                placeholder={t('wizard.goal.first_name_placeholder')}
                                aria-invalid={!!errors.firstName}
                                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                                className={cn('bg-background/40', errors.firstName && 'border-destructive')}
                              />
                            </motion.div>
                            <FormError error={errors.firstName?.message} />
                          </>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        {t('wizard.goal.last_name')}
                      </Label>
                      <Controller
                        name="lastName"
                        control={control}
                        render={({ field }) => (
                          <>
                            <motion.div variants={shakeVariants} animate={errors.lastName ? 'error' : 'initial'}>
                              <Input
                                {...field}
                                id="lastName"
                                placeholder={t('wizard.goal.last_name_placeholder')}
                                aria-invalid={!!errors.lastName}
                                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                                className={cn('bg-background/40', errors.lastName && 'border-destructive')}
                              />
                            </motion.div>
                            <FormError error={errors.lastName?.message} />
                          </>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="personalGoal" className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-secondary" />
                        {t('wizard.goal.what_achieve')}
                      </Label>
                      <span
                        className={cn(
                          'text-xs font-medium tabular-nums transition-colors duration-200',
                          watchedPersonalGoalNote.length >= 60
                            ? 'text-destructive'
                            : watchedPersonalGoalNote.length >= 50
                              ? 'text-amber-500'
                              : 'text-muted-foreground',
                        )}
                      >
                        {watchedPersonalGoalNote.length}/60
                      </span>
                    </div>

                    <Controller
                      name="personalGoalNote"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          id="personalGoal"
                          placeholder={t('wizard.goal.goal_placeholder')}
                          maxLength={60}
                          className="min-h-[96px] resize-none bg-background/40"
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('wizard.goal.goal_note_hint')}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 rounded-[1.5rem] border border-border/60 bg-background/20 p-5">
                  <Controller
                    name="isTrainer"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <Label
                            htmlFor="trainer-mode"
                            className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <span
                              className={cn(
                                'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                                field.value ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground',
                              )}
                            >
                              🏋️
                            </span>
                            {t('wizard.goal.im_trainer')}
                          </Label>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {isTrainerAuthorized
                              ? t('wizard.goal.trainer_enable_notes')
                              : t('wizard.goal.trainer_verified_only', 'Available only to verified trainer accounts.')}
                          </p>
                        </div>

                        <motion.button
                          type="button"
                          role="switch"
                          id="trainer-mode"
                          aria-checked={field.value}
                          aria-disabled={!isTrainerAuthorized}
                          disabled={!isTrainerAuthorized}
                          onClick={() => {
                            if (!isTrainerAuthorized) {
                              return;
                            }

                            field.onChange(!field.value);
                          }}
                          className={cn(
                            'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            isTrainerAuthorized ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                            field.value ? 'bg-accent' : 'bg-input',
                          )}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.span
                            className="pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
                            animate={{ x: field.value ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                    )}
                  />

                  <AnimatePresence initial={false}>
                    {watchedIsTrainer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 border-t border-border/60 pt-5">
                          <Label htmlFor="coachNotes" className="text-sm font-medium flex items-center gap-2">
                            📝 {t('wizard.goal.coach_notes')}
                            <span className="text-xs font-normal text-muted-foreground">
                              {t('wizard.goal.private')}
                            </span>
                          </Label>
                          <Controller
                            name="coachNotes"
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                {...field}
                                id="coachNotes"
                                placeholder={t('wizard.goal.coach_notes_placeholder')}
                                maxLength={500}
                                className="min-h-[120px] resize-none bg-background/40"
                              />
                            )}
                          />
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {t('wizard.goal.coach_notes_hint')}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
