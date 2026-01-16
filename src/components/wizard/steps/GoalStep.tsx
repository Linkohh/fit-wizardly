import { User, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWizardStore } from '@/stores/wizardStore';
import type { Goal, ExperienceLevel } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { shakeVariants } from '@/lib/formAnimations';
import { FormError } from '@/components/ui/form-error';
import { useWizardForm, goalStepSchema } from '@/hooks/useWizardForm';
import { Controller } from 'react-hook-form';
import { getGoals, getExperienceLevels } from '@/lib/wizardConstants';
import { PhaseRecommendationCard } from '@/components/wizard/PhaseRecommendationCard';
import { useTranslation } from 'react-i18next';

export function GoalStep() {
  const { t } = useTranslation();
  const { selections, setGoal, setExperienceLevel, setFirstName, setLastName, setPersonalGoalNote, setIsTrainer, setCoachNotes } = useWizardStore();
  const goals = getGoals(t);
  const experienceLevels = getExperienceLevels(t);

  // React Hook Form integration with Zustand sync
  const { control, formState: { errors }, watch, setValue } = useWizardForm({
    schema: goalStepSchema,
    defaultValues: {
      firstName: selections.firstName || '',
      lastName: selections.lastName || '',
      personalGoalNote: selections.personalGoalNote || '',
      isTrainer: selections.isTrainer || false,
      coachNotes: selections.coachNotes || '',
      goal: selections.goal,
      experienceLevel: selections.experienceLevel,
    },
    onSync: (values) => {
      // Sync form values to Zustand store
      if (values.firstName !== undefined) setFirstName(values.firstName);
      if (values.lastName !== undefined) setLastName(values.lastName);
      if (values.personalGoalNote !== undefined) setPersonalGoalNote(values.personalGoalNote);
      if (values.isTrainer !== undefined) setIsTrainer(values.isTrainer);
      if (values.coachNotes !== undefined) setCoachNotes(values.coachNotes);
      if (values.goal !== undefined) setGoal(values.goal);
      if (values.experienceLevel !== undefined) setExperienceLevel(values.experienceLevel);
    },
  });

  // Watch values for reactive UI updates
  const watchedGoal = watch('goal');
  const watchedExperienceLevel = watch('experienceLevel');
  const watchedPersonalGoalNote = watch('personalGoalNote') || '';

  // Helper to determine phase for display (if not set in store yet)
  const getPhase = (g: Goal, e: ExperienceLevel) => {
    if (e === 'beginner') return 'stabilization_endurance';
    if (e === 'intermediate') return g === 'strength' ? 'strength_endurance' : g === 'hypertrophy' ? 'muscular_development' : 'stabilization_endurance';
    if (e === 'advanced') return g === 'strength' ? 'maximal_strength' : g === 'hypertrophy' ? 'muscular_development' : 'power';
    return 'stabilization_endurance';
  };

  const currentPhaseKey = selections.optPhase || getPhase(watchedGoal || selections.goal, watchedExperienceLevel || selections.experienceLevel);

  return (
    <div className="space-y-8">
      {/* Personal Info Section */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{t('wizard.goal.personalize_badge')}</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t('wizard.goal.lets_know_you')}</h2>
          <p className="text-muted-foreground mt-1">{t('wizard.goal.name_on_plan')}</p>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">{t('wizard.goal.first_name')}</Label>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <>
                      <motion.div
                        variants={shakeVariants}
                        animate={errors.firstName ? "error" : "initial"}
                      >
                        <Input
                          {...field}
                          id="firstName"
                          placeholder={t('wizard.goal.first_name_placeholder')}
                          aria-invalid={!!errors.firstName}
                          aria-describedby={errors.firstName ? "firstName-error" : undefined}
                          className={cn(
                            "bg-background/50",
                            errors.firstName && "border-destructive"
                          )}
                        />
                      </motion.div>
                      <FormError error={errors.firstName?.message} />
                    </>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">{t('wizard.goal.last_name')}</Label>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <>
                      <motion.div
                        variants={shakeVariants}
                        animate={errors.lastName ? "error" : "initial"}
                      >
                        <Input
                          {...field}
                          id="lastName"
                          placeholder={t('wizard.goal.last_name_placeholder')}
                          aria-invalid={!!errors.lastName}
                          aria-describedby={errors.lastName ? "lastName-error" : undefined}
                          className={cn(
                            "bg-background/50",
                            errors.lastName && "border-destructive"
                          )}
                        />
                      </motion.div>
                      <FormError error={errors.lastName?.message} />
                    </>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="personalGoal" className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  {t('wizard.goal.what_achieve')}
                </Label>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={watchedPersonalGoalNote.length}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "text-xs font-medium tabular-nums transition-colors duration-200",
                      watchedPersonalGoalNote.length >= 60
                        ? "text-destructive"
                        : watchedPersonalGoalNote.length >= 50
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    )}
                  >
                    {watchedPersonalGoalNote.length}/60
                  </motion.span>
                </AnimatePresence>
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
                    className="resize-none bg-background/50 min-h-[80px]"
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                {t('wizard.goal.goal_note_hint')}
              </p>
            </div>

            {/* Trainer Mode Toggle - Progressive Disclosure */}
            <div className="pt-4 border-t border-border/50">
              <Controller
                name="isTrainer"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="trainer-mode" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <motion.span
                          animate={{ rotate: field.value ? 360 : 0 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs",
                            field.value ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                          )}
                        >
                          🏋️
                        </motion.span>
                        {t('wizard.goal.im_trainer')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('wizard.goal.trainer_enable_notes')}
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      role="switch"
                      id="trainer-mode"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        field.value ? "bg-accent" : "bg-input"
                      )}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
                        )}
                        animate={{ x: field.value ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                )}
              />

              {/* Coach Notes - Progressively Disclosed */}
              <AnimatePresence>
                {watch('isTrainer') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-2">
                      <Label htmlFor="coachNotes" className="text-sm font-medium flex items-center gap-2">
                        📝 {t('wizard.goal.coach_notes')}
                        <span className="text-xs text-muted-foreground font-normal">{t('wizard.goal.private')}</span>
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
                            className="resize-none bg-background/50 min-h-[100px]"
                          />
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('wizard.goal.coach_notes_hint')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Selection */}
      <div className="space-y-4">
        {/* ... existing header code ... */}
        <div className="text-center relative">
          <h2 className="text-2xl font-bold text-foreground">{t('wizard.goal.training_goal_title')}</h2>
          <p className="text-muted-foreground mt-1">{t('wizard.goal.training_goal_subtitle')}</p>

          {(watchedGoal !== 'hypertrophy' || watchedExperienceLevel !== 'intermediate') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue('goal', 'hypertrophy');
                setValue('experienceLevel', 'intermediate');
              }}
              className="absolute right-0 top-0 h-8 px-2 text-muted-foreground hover:text-primary hidden sm:flex"
            >
              {t('wizard.goal.reset_recommended')}
            </Button>
          )}
        </div>

        {/* Mobile reset button */}
        {(watchedGoal !== 'hypertrophy' || watchedExperienceLevel !== 'intermediate') && (
          <div className="flex justify-start sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue('goal', 'hypertrophy');
                setValue('experienceLevel', 'intermediate');
              }}
              className="touch-target border-primary/50 text-primary hover:bg-primary/10"
            >
              {t('wizard.goal.reset_recommended')}
            </Button>
          </div>
        )}

        <Controller
          name="goal"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(value) => field.onChange(value as Goal)}
              className="grid gap-4 md:grid-cols-3"
            >
              {goals.map((goal) => {
                 const Icon = goal.icon;
                 return (
                <Label
                  key={goal.id}
                  htmlFor={goal.id}
                  className="cursor-pointer"
                >
                  <Card
                    className={cn(
                      "relative transition-all duration-300 hover:shadow-md touch-target group",
                      field.value === goal.id
                        ? "border-primary ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-glow"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                      <RadioGroupItem
                        value={goal.id}
                        id={goal.id}
                        className="sr-only"
                        aria-describedby={`${goal.id}-description`}
                      />
                      <div className={cn(
                        "p-3 rounded-full transition-all duration-300",
                        field.value === goal.id
                          ? "gradient-primary text-primary-foreground shadow-glow"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{goal.label}</h3>
                        <p id={`${goal.id}-description`} className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      </div>
                      <AnimatePresence>
                        {field.value === goal.id && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            className="absolute top-3 right-3 h-3 w-3 rounded-full gradient-primary"
                            aria-hidden="true"
                          />
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </Label>
              )})}
            </RadioGroup>
          )}
        />
      </div>

      {/* Experience Level */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">{t('wizard.goal.experience_title')}</h2>
          <p className="text-muted-foreground mt-1">{t('wizard.goal.experience_subtitle')}</p>
        </div>

        <Controller
          name="experienceLevel"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(value) => field.onChange(value as ExperienceLevel)}
              className="grid gap-3 md:grid-cols-3"
            >
              {experienceLevels.map((level) => (
                <Label
                  key={level.id}
                  htmlFor={`exp-${level.id}`}
                  className="cursor-pointer"
                >
                  <Card
                    className={cn(
                      "relative transition-all duration-300 hover:shadow-md touch-target",
                      field.value === level.id
                        ? "border-primary ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <CardContent className="p-4">
                      <RadioGroupItem
                        value={level.id}
                        id={`exp-${level.id}`}
                        className="sr-only"
                        aria-describedby={`exp-${level.id}-description`}
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{level.label}</h3>
                          <p id={`exp-${level.id}-description`} className="text-sm text-muted-foreground">
                            {level.description}
                          </p>
                        </div>
                        <AnimatePresence>
                          {field.value === level.id && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                              className="h-3 w-3 rounded-full gradient-primary"
                              aria-hidden="true"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      <PhaseRecommendationCard phaseKey={currentPhaseKey} />
    </div>
  );
}
