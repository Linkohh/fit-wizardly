import { Check, AlertTriangle, Target, Dumbbell, Calendar, Clock, AlertCircle, User, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWizardStore } from '@/stores/wizardStore';
import { MUSCLE_DATA, EQUIPMENT_OPTIONS, CONSTRAINT_OPTIONS } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { validatePlanBalance } from '@/lib/planValidation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useMemo } from 'react';

// Animation variants for staggered card reveals
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
    },
  },
};

export function ReviewStep() {
  const { t } = useTranslation();
  const { selections } = useWizardStore();

  const getMuscleLabel = (id: string) =>
    MUSCLE_DATA.find(m => m.id === id)?.name || id;

  const getEquipmentLabel = (id: string) =>
    EQUIPMENT_OPTIONS.find(e => e.id === id)?.name || id;

  const getConstraintLabel = (id: string) =>
    CONSTRAINT_OPTIONS.find(c => c.id === id)?.name || id;

  const getSplitType = (days: number): string => {
    if (days <= 3) return t('wizard.schedule.split_full_body');
    if (days === 4) return t('wizard.schedule.split_upper_lower');
    return t('wizard.schedule.split_ppl');
  };

  const goalLabels: Record<string, string> = {
    strength: t('goals.strength'),
    hypertrophy: t('goals.hypertrophy'),
    general: t('goals.general'),
  };

  const experienceLabels: Record<string, string> = {
    beginner: t('experience.beginner'),
    intermediate: t('experience.intermediate'),
    advanced: t('experience.advanced'),
  };

  const hasPersonalInfo = selections.firstName || selections.lastName || selections.personalGoalNote;
  const warnings = useMemo(() => validatePlanBalance(selections), [selections]);
  const [showCoachNotes, setShowCoachNotes] = useState(false);

  return (
    <div className="space-y-6">
      <motion.div
        className="text-center"
        variants={cardVariants}
      >
        <h2 className="text-2xl font-bold text-foreground">{t('wizard.review.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('wizard.review.subtitle')}</p>
      </motion.div>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {warnings.map((warning) => (
            <motion.div key={warning.id} variants={cardVariants}>
              <Card className={cn(
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
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Personal Info Banner (if provided) */}
      {hasPersonalInfo && (
        <motion.div variants={cardVariants}>
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="p-2 rounded-full bg-primary/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <User className="h-5 w-5 text-primary" />
                </motion.div>
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
                <motion.div
                  className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-primary/10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Sparkles className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <p className="text-sm italic text-foreground/90">"{selections.personalGoalNote}"</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        className="grid gap-4 md:grid-cols-2"
        variants={containerVariants}
      >
        {/* Goal & Experience */}
        <motion.div variants={cardVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Target className="h-5 w-5 text-primary" />
                </motion.div>
                {t('wizard.review.goal_experience')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('wizard.review.training_goal')}</span>
                <motion.div variants={badgeVariants}>
                  <Badge variant="default" className="gradient-primary text-primary-foreground">
                    {goalLabels[selections.goal]}
                  </Badge>
                </motion.div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('wizard.review.experience')}</span>
                <motion.div variants={badgeVariants}>
                  <Badge variant="secondary">
                    {experienceLabels[selections.experienceLevel]}
                  </Badge>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schedule */}
        <motion.div variants={cardVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Calendar className="h-5 w-5 text-primary" />
                </motion.div>
                {t('wizard.review.schedule')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('wizard.review.days_per_week')}</span>
                <motion.div variants={badgeVariants}>
                  <Badge variant="default" className="gradient-primary text-primary-foreground">
                    {selections.daysPerWeek} {t('wizard.review.days')}
                  </Badge>
                </motion.div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('wizard.review.session_length')}</span>
                <motion.div variants={badgeVariants}>
                  <Badge variant="secondary">
                    {selections.sessionDuration} {t('wizard.review.min')}
                  </Badge>
                </motion.div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('wizard.review.split_type')}</span>
                <motion.div variants={badgeVariants}>
                  <Badge variant="outline">
                    {getSplitType(selections.daysPerWeek)}
                  </Badge>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Equipment */}
        <motion.div variants={cardVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Dumbbell className="h-5 w-5 text-primary" />
                </motion.div>
                {t('wizard.review.equipment')} ({selections.equipment.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {selections.equipment.map((eq, index) => (
                  <motion.div
                    key={eq}
                    variants={badgeVariants}
                    custom={index}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-success" />
                      {getEquipmentLabel(eq)}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Target Muscles */}
        <motion.div variants={cardVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Target className="h-5 w-5 text-primary" />
                </motion.div>
                {t('wizard.review.target_muscles')} ({selections.targetMuscles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {selections.targetMuscles.length > 0 ? (
                  selections.targetMuscles.map((muscle, index) => (
                    <motion.div
                      key={muscle}
                      variants={badgeVariants}
                      custom={index}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Badge variant="default" className="bg-muscle-highlight text-primary-foreground">
                        {getMuscleLabel(muscle)}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t('wizard.review.no_muscles')}</p>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Constraints */}
      {selections.constraints.length > 0 && (
        <motion.div variants={cardVariants}>
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-warning">
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <AlertTriangle className="h-5 w-5" />
                </motion.div>
                {t('wizard.review.constraints_applied')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {selections.constraints.map((constraint, index) => (
                  <motion.div
                    key={constraint}
                    variants={badgeVariants}
                    custom={index}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Badge variant="outline" className="border-warning text-warning">
                      {getConstraintLabel(constraint)}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-3">
                {t('wizard.review.constraints_hint')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Coach Mode Panel */}
      {selections.isTrainer && (
        <motion.div variants={cardVariants}>
          <Card className="border-neon-purple/30 bg-neon-purple/5">
            <CardHeader className="pb-3 border-b border-neon-purple/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-neon-purple">
                  <User className="h-5 w-5" />
                  Coach Mode
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    id="coach-notes"
                    checked={showCoachNotes}
                    onCheckedChange={setShowCoachNotes}
                  />
                  <Label htmlFor="coach-notes" className="text-sm cursor-pointer">Show Notes</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {showCoachNotes ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 rounded bg-background/40 border border-neon-purple/20">
                    <p className="text-sm font-semibold text-neon-purple mb-1">Periodization Note:</p>
                    <p className="text-sm text-muted-foreground">
                      User selected {selections.goal} with {selections.experienceLevel} experience.
                      Recommend starting with 2 weeks of accumulation volume.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-background/40 border border-neon-purple/20">
                    <p className="text-sm font-semibold text-neon-purple mb-1">Cues Focus:</p>
                    <p className="text-sm text-muted-foreground">
                      Emphasize tempo (3-0-1-0) for the first mesocycle to build control.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Toggle "Show Notes" to view programming recommendations.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Ready message */}
      <motion.div
        className="p-4 rounded-lg bg-success/10 border border-success/20 text-center overflow-hidden"
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <motion.div
          className="flex items-center justify-center gap-2 text-success font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Check className="h-5 w-5" />
          </motion.div>
          <span>{t('wizard.review.ready_message')}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
