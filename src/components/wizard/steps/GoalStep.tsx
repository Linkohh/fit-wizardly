import { Target, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useWizardStore } from '@/stores/wizardStore';
import type { Goal, ExperienceLevel } from '@/types/fitness';
import { cn } from '@/lib/utils';

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

export function GoalStep() {
  const { selections, setGoal, setExperienceLevel } = useWizardStore();

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Goal Selection */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">What's your training goal?</h2>
          <p className="text-muted-foreground mt-1">This helps us optimize your program structure</p>
        </div>

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
                  "relative transition-all duration-200 hover:shadow-md touch-target",
                  selections.goal === goal.id 
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
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
                    "p-3 rounded-full transition-colors",
                    selections.goal === goal.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {goal.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{goal.label}</h3>
                    <p id={`${goal.id}-description`} className="text-sm text-muted-foreground mt-1">
                      {goal.description}
                    </p>
                  </div>
                  {selections.goal === goal.id && (
                    <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
                  )}
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
                  "relative transition-all duration-200 hover:shadow-md touch-target",
                  selections.experienceLevel === level.id 
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
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
                    {selections.experienceLevel === level.id && (
                      <div className="h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
