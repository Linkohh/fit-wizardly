import { Check, AlertTriangle, Target, Dumbbell, Calendar, Clock, AlertCircle, User, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWizardStore } from '@/stores/wizardStore';
import { MUSCLE_DATA, EQUIPMENT_OPTIONS, CONSTRAINT_OPTIONS } from '@/types/fitness';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6 animate-slide-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Review Your Plan</h2>
        <p className="text-muted-foreground mt-1">Confirm your selections before generating</p>
      </div>

      {/* Personal Info Banner (if provided) */}
      {hasPersonalInfo && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
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
                <p className="text-sm text-muted-foreground">Personalized Workout Plan</p>
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
        {/* Goal & Experience */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Goal & Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Training Goal</span>
              <Badge variant="default" className="gradient-primary text-primary-foreground">
                {goalLabels[selections.goal]}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Experience</span>
              <Badge variant="secondary">
                {experienceLabels[selections.experienceLevel]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Days per Week</span>
              <Badge variant="default" className="gradient-primary text-primary-foreground">
                {selections.daysPerWeek} days
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Session Length</span>
              <Badge variant="secondary">
                {selections.sessionDuration} min
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Split Type</span>
              <Badge variant="outline">
                {getSplitType(selections.daysPerWeek)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="h-5 w-5 text-primary" />
              Equipment ({selections.equipment.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selections.equipment.map((eq) => (
                <Badge key={eq} variant="secondary" className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-success" />
                  {getEquipmentLabel(eq)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Muscles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Target Muscles ({selections.targetMuscles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selections.targetMuscles.length > 0 ? (
                selections.targetMuscles.map((muscle) => (
                  <Badge key={muscle} variant="default" className="bg-muscle-highlight text-primary-foreground">
                    {getMuscleLabel(muscle)}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No muscles selected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Constraints */}
      {selections.constraints.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-warning">
              <AlertTriangle className="h-5 w-5" />
              Constraints Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selections.constraints.map((constraint) => (
                <Badge key={constraint} variant="outline" className="border-warning text-warning">
                  {getConstraintLabel(constraint)}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Exercises will be filtered to avoid these limitations
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ready message */}
      <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
        <div className="flex items-center justify-center gap-2 text-success font-medium">
          <Check className="h-5 w-5" />
          <span>Ready to generate your personalized workout plan!</span>
        </div>
      </div>
    </div>
  );
}
