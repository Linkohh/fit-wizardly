import { Target, TrendingUp, Activity, User, Sparkles } from 'lucide-react';
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

const GOALS: { id: Goal; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'strength',
    label: 'Strength',
    description: 'Build maximum strength with heavy loads and lower reps',
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    id: 'hypertrophy',
    label: 'Muscle Growth',
    description: 'Maximize muscle size with moderate loads and higher volume',
    icon: <Target className="h-6 w-6" />,
  },
  {
    id: 'general',
    label: 'General Fitness',
    description: 'Balanced approach for overall health and conditioning',
    icon: <Activity className="h-6 w-6" />,
  },
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; description: string }[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'New to structured training (0-1 year)',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Consistent training experience (1-3 years)',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Significant training background (3+ years)',
  },
];

// NASM Phase Info
const PHASE_INFO = {
  stabilization_endurance: {
    title: "Phase 1: Stabilization Endurance",
    description: "Build a rock-solid foundation with high reps (12-20) and controlled instability.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  },
  strength_endurance: {
    title: "Phase 2: Strength Endurance",
    description: "Bridge the gap between stability and strength using supersets.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400"
  },
  muscular_development: {
    title: "Phase 3: Muscular Development",
    description: "Maximize muscle growth with high volume and moderate intensity.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400"
  },
  maximal_strength: {
    title: "Phase 4: Maximal Strength",
    description: "Increase peak force production with heavy loads (85-100% 1RM).",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400"
  },
  power: {
    title: "Phase 5: Power",
    description: "Enhance speed and explosiveness with contrast supersets.",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "bg-red-500/10 text-red-700 dark:text-red-400"
  }
};

export function GoalStep() {
  const { selections, setGoal, setExperienceLevel, setFirstName, setLastName, setPersonalGoalNote } = useWizardStore();

  // Helper to determine phase for display (if not set in store yet)
  const getPhase = (g: Goal, e: ExperienceLevel) => {
    if (e === 'beginner') return 'stabilization_endurance';
    if (e === 'intermediate') return g === 'strength' ? 'strength_endurance' : g === 'hypertrophy' ? 'muscular_development' : 'stabilization_endurance';
    if (e === 'advanced') return g === 'strength' ? 'maximal_strength' : g === 'hypertrophy' ? 'muscular_development' : 'power';
    return 'stabilization_endurance';
  };

  const currentPhaseKey = selections.optPhase || getPhase(selections.goal, selections.experienceLevel);
  const currentPhase = PHASE_INFO[currentPhaseKey];

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Personal Info Section */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Personalize Your Plan</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Let's get to know you</h2>
          <p className="text-muted-foreground mt-1">Your name will appear on your personalized workout plan</p>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={selections.firstName || ''}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={selections.lastName || ''}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="personalGoal" className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  What do you want to achieve?
                </Label>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={(selections.personalGoalNote || '').length}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "text-xs font-medium tabular-nums transition-colors duration-200",
                      (selections.personalGoalNote || '').length >= 60
                        ? "text-destructive"
                        : (selections.personalGoalNote || '').length >= 50
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    )}
                  >
                    {(selections.personalGoalNote || '').length}/60
                  </motion.span>
                </AnimatePresence>
              </div>
              <Textarea
                id="personalGoal"
                placeholder="e.g., Build muscle for my wedding, Run a 5K, Feel more confident..."
                value={selections.personalGoalNote || ''}
                onChange={(e) => setPersonalGoalNote(e.target.value)}
                maxLength={60}
                className="resize-none bg-background/50 min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                This note will be included on your PDF plan as a motivational reminder
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Selection */}
      <div className="space-y-4">
        {/* ... existing header code ... */}
        <div className="text-center relative">
          <h2 className="text-2xl font-bold text-foreground">What's your training goal?</h2>
          <p className="text-muted-foreground mt-1">This helps us optimize your program structure</p>

          {(selections.goal !== 'hypertrophy' || selections.experienceLevel !== 'intermediate') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGoal('hypertrophy');
                setExperienceLevel('intermediate');
              }}
              className="absolute right-0 top-0 h-8 px-2 text-muted-foreground hover:text-primary hidden sm:flex"
            >
              Reset to Recommended
            </Button>
          )}
        </div>

        {/* ... existing mobile reset ... */}
        {(selections.goal !== 'hypertrophy' || selections.experienceLevel !== 'intermediate') && (
          <div className="flex justify-start sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGoal('hypertrophy');
                setExperienceLevel('intermediate');
              }}
              className="touch-target border-primary/50 text-primary hover:bg-primary/10"
            >
              Reset to Recommended
            </Button>
          </div>
        )}

        <RadioGroup
          value={selections.goal}
          onValueChange={(value) => setGoal(value as Goal)}
          className="grid gap-4 md:grid-cols-3"
        >
          {GOALS.map((goal) => (
            <Label
              key={goal.id}
              htmlFor={goal.id}
              className="cursor-pointer"
            >
              <Card
                className={cn(
                  "relative transition-all duration-300 hover:shadow-md touch-target group",
                  selections.goal === goal.id
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
                    selections.goal === goal.id
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                  )}>
                    {goal.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{goal.label}</h3>
                    <p id={`${goal.id}-description`} className="text-sm text-muted-foreground mt-1">
                      {goal.description}
                    </p>
                  </div>
                  <AnimatePresence>
                    {selections.goal === goal.id && (
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
          ))}
        </RadioGroup>
      </div>

      {/* Experience Level */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Your experience level</h2>
          <p className="text-muted-foreground mt-1">This determines training volume and complexity</p>
        </div>

        <RadioGroup
          value={selections.experienceLevel}
          onValueChange={(value) => setExperienceLevel(value as ExperienceLevel)}
          className="grid gap-3 md:grid-cols-3"
        >
          {EXPERIENCE_LEVELS.map((level) => (
            <Label
              key={level.id}
              htmlFor={`exp-${level.id}`}
              className="cursor-pointer"
            >
              <Card
                className={cn(
                  "relative transition-all duration-300 hover:shadow-md touch-target",
                  selections.experienceLevel === level.id
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
                      {selections.experienceLevel === level.id && (
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
      </div>

      {/* Recommended Phase Card */}
      <div className="mt-8 pt-6 border-t animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Card className={cn("border-l-4 shadow-md overflow-hidden", currentPhase.border, currentPhase.bg)}>
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className={cn("p-3 rounded-full shrink-0 bg-background/50", currentPhase.color)}>
              <Target className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Recommended Program</span>
              </div>
              <h3 className={cn("text-lg font-bold", currentPhase.color)}>{currentPhase.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xl">{currentPhase.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
