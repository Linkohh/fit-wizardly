import { Check, AlertTriangle, Target, Dumbbell, Calendar, Clock, AlertCircle, User, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWizardStore } from '@/stores/wizardStore';
import { MUSCLE_DATA, EQUIPMENT_OPTIONS, CONSTRAINT_OPTIONS } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const { selections } = useWizardStore();

  const getMuscleLabel = (id: string) =>
    MUSCLE_DATA.find(m => m.id === id)?.name || id;

  const getEquipmentLabel = (id: string) =>
    EQUIPMENT_OPTIONS.find(e => e.id === id)?.name || id;

  const getConstraintLabel = (id: string) =>
    CONSTRAINT_OPTIONS.find(c => c.id === id)?.name || id;

  const getSplitType = (days: number): string => {
    if (days <= 3) return 'Full Body';
    if (days === 4) return 'Upper/Lower';
    return 'Push/Pull/Legs';
  };

  const goalLabels = {
    strength: 'Strength',
    hypertrophy: 'Muscle Growth',
    general: 'General Fitness',
  };

  const experienceLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  const hasPersonalInfo = selections.firstName || selections.lastName || selections.personalGoalNote;

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="text-center"
        variants={cardVariants}
      >
        <h2 className="text-2xl font-bold text-foreground">Review Your Plan</h2>
        <p className="text-muted-foreground mt-1">Confirm your selections before generating</p>
      </motion.div>

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
                  <p className="text-sm text-muted-foreground">Personalized Workout Plan</p>
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
                Goal & Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Training Goal</span>
                <motion.div variants={badgeVariants}>
                  <Badge variant="default" className="gradient-primary text-primary-foreground">
                    {goalLabels[selections.goal]}
                  </Badge>
                </motion.div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Experience</span>
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
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Days per Week</span>
                <motion.div variants={badgeVariants}>
                  <Badge variant="default" className="gradient-primary text-primary-foreground">
                    {selections.daysPerWeek} days
                  </Badge>
                </motion.div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Session Length</span>
                <motion.div variants={badgeVariants}>
                  <Badge variant="secondary">
                    {selections.sessionDuration} min
                  </Badge>
                </motion.div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Split Type</span>
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
                Equipment ({selections.equipment.length})
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
                Target Muscles ({selections.targetMuscles.length})
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
                  <p className="text-sm text-muted-foreground">No muscles selected</p>
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
                Constraints Applied
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
                Exercises will be filtered to avoid these limitations
              </p>
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
          <span>Ready to generate your personalized workout plan!</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

