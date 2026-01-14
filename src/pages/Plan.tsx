import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePlanStore } from '@/stores/planStore';
import { type ExercisePrescription } from '@/types/fitness';
import { Calendar, Clock, Target, Download, Wand2, ShieldAlert, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { OneRepMaxCalculator } from '@/components/tools/OneRepMaxCalculator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ExerciseSwapModal } from '@/components/plan/ExerciseSwapModal';
import { WisdomBubble } from '@/components/wisdom/WisdomBubble';
import { useWisdomStore } from '@/stores/wisdomStore';
import { exportPlanToPDF } from '@/lib/pdfExport';
import { PlanSkeleton } from '@/components/plan/PlanSkeleton';
import { WorkoutDayCard } from '@/components/plan/WorkoutDayCard';

export default function PlanPage() {
  const { currentPlan, swapExercise } = usePlanStore();
  const [redactSensitive, setRedactSensitive] = useState(true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; exerciseIndex: number; exercise: ExercisePrescription } | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const { setContext } = useWisdomStore();

  // Simulate loading state on mount
  useEffect(() => {
    if (currentPlan) {
      const timer = setTimeout(() => setIsLoadingPlan(false), 400);
      return () => clearTimeout(timer);
    } else {
      setIsLoadingPlan(false);
    }
  }, [currentPlan]);

  // Set Wisdom AI context when plan changes
  useEffect(() => {
    if (currentPlan) {
      setContext({
        planId: currentPlan.id,
        exerciseId: null,
        weekNumber: 1,
        phase: currentPlan.selections.optPhase,
      });
    }
  }, [currentPlan, setContext]);

  // Show skeleton while loading
  if (isLoadingPlan && currentPlan) {
    return <PlanSkeleton />;
  }

  if (!currentPlan) {
    return (
      <main className="container max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="mx-auto w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-glow animate-float">
          <Wand2 className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-4">No Plan Generated Yet</h1>
        <p className="text-muted-foreground mb-8">Create your personalized workout plan using the wizard.</p>
        <Link to="/wizard"><Button variant="gradient" size="lg">Start Wizard</Button></Link>
      </main>
    );
  }

  const handleExportPDF = () => {
    exportPlanToPDF(currentPlan);
  };

  return (
    <main className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold gradient-text self-start sm:self-center">Your Workout Plan</h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* 1RM Calculator Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto border-dashed border-primary/40 hover:border-primary">
                <Calculator className="h-4 w-4 text-primary" />
                1RM Tools
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-md">
              <OneRepMaxCalculator />
            </DialogContent>
          </Dialog>

          {/* PDF Export with Privacy Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="gradient" className="gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" /> Export PDF
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-warning/10">
                    <ShieldAlert className="h-5 w-5 text-warning" />
                  </div>
                  <AlertDialogTitle>Export Workout Plan</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="space-y-4 pt-2">
                  <p>
                    Your workout plan will be exported as a PDF file. Be mindful when sharing this document.
                  </p>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="redact-toggle" className="font-medium">Privacy Mode</Label>
                      <span className="text-xs text-muted-foreground">
                        Omit personal details from export
                      </span>
                    </div>
                    <Switch
                      id="redact-toggle"
                      checked={redactSensitive}
                      onCheckedChange={setRedactSensitive}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground border-l-2 border-warning/50 pl-3">
                    <strong>Privacy Notice:</strong> PDFs may contain metadata. Avoid sharing workout plans containing personal health information publicly.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleExportPDF} className="gradient-primary">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6 flex flex-wrap gap-6">
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Calendar className="h-4 w-4 text-primary-foreground" /></div><span>{currentPlan.selections.daysPerWeek} days/week</span></div>
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Clock className="h-4 w-4 text-primary-foreground" /></div><span>{currentPlan.selections.sessionDuration} min sessions</span></div>
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Target className="h-4 w-4 text-primary-foreground" /></div><span>{currentPlan.splitType.replace('_', ' ')}</span></div>
        </CardContent>
      </Card>

      {/* Workout Days */}
      <div className="space-y-6">
        {currentPlan.workoutDays.map((day) => (
          <WorkoutDayCard
            key={day.dayIndex}
            day={day}
            planId={currentPlan.id}
            onSwap={(target) => {
              setSwapTarget(target);
              setSwapModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* Motivational Footer */}
      <div className="mt-8 text-center py-6">
        <p className="text-lg font-medium gradient-text">"Consistency beats perfection. You've got this!"</p>
      </div>

      {/* Exercise Swap Modal */}
      {swapTarget && (
        <ExerciseSwapModal
          isOpen={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setSwapTarget(null);
          }}
          currentExercise={swapTarget.exercise}
          onSwap={(newExercise) => {
            swapExercise(swapTarget.dayIndex, swapTarget.exerciseIndex, newExercise);
          }}
          allowedEquipment={currentPlan.selections.equipment}
        />
      )}

      {/* Wisdom AI Floating Bubble */}
      <WisdomBubble />
    </main>
  );
}
