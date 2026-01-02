import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanStore } from '@/stores/planStore';
import { MUSCLE_DATA, type ExercisePrescription } from '@/types/fitness';
import { Calendar, Clock, Target, Download, Wand2, ShieldAlert, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, ArrowLeftRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ExerciseSwapModal } from '@/components/plan/ExerciseSwapModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PlanPage() {
  const { currentPlan, swapExercise } = usePlanStore();
  const [redactSensitive, setRedactSensitive] = useState(true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; exerciseIndex: number; exercise: ExercisePrescription } | null>(null);

  if (!currentPlan) {
    return (
      <main className="container max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="mx-auto w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-glow">
          <Wand2 className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-4">No Plan Generated Yet</h1>
        <p className="text-muted-foreground mb-8">Create your personalized workout plan using the wizard.</p>
        <Link to="/wizard"><Button variant="gradient" size="lg">Start Wizard</Button></Link>
      </main>
    );
  }

  const getMuscleLabel = (id: string) => MUSCLE_DATA.find(m => m.id === id)?.name || id;

  const exportPDF = () => {
    const doc = new jsPDF();

    // Purple/Pink branded header
    doc.setFillColor(139, 92, 246); // Primary purple
    doc.rect(0, 0, 220, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FitWizard', 14, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Personalized Workout Plan', 14, 28);

    // Plan details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Split: ${currentPlan.splitType.replace('_', ' ').toUpperCase()}`, 14, 45);
    doc.text(`Days/Week: ${currentPlan.selections.daysPerWeek}`, 14, 52);
    doc.text(`Session Duration: ${currentPlan.selections.sessionDuration} min`, 14, 59);
    doc.text(`Goal: ${currentPlan.selections.goal.charAt(0).toUpperCase() + currentPlan.selections.goal.slice(1)}`, 14, 66);

    let y = 80;
    currentPlan.workoutDays.forEach((day) => {
      // Day header with pink accent
      doc.setFillColor(236, 72, 153); // Secondary pink
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(day.name, 16, y);
      y += 10;

      doc.setTextColor(0, 0, 0);
      const rows = day.exercises.map(e => [e.exercise.name, `${e.sets}`, e.reps, `${e.rir}`, `${e.restSeconds}s`]);
      autoTable(doc, {
        startY: y,
        head: [['Exercise', 'Sets', 'Reps', 'RIR', 'Rest']],
        body: rows,
        margin: { left: 14 },
        headStyles: { fillColor: [139, 92, 246] },
        alternateRowStyles: { fillColor: [250, 245, 255] }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
      if (y > 260) { doc.addPage(); y = 20; }
    });

    // Motivational footer
    doc.setFontSize(10);
    doc.setTextColor(139, 92, 246);
    doc.setFont('helvetica', 'italic');
    doc.text("You've got this! Every rep counts. 💪", 14, 285);

    doc.save('FitWizard_Plan.pdf');
  };

  return (
    <main className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gradient-text">Your Workout Plan</h1>

        {/* PDF Export with Privacy Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="gradient" className="gap-2">
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
              <AlertDialogAction onClick={exportPDF} className="gradient-primary">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
          <Card key={day.dayIndex} className="hover:shadow-lg transition-shadow hover:border-primary/30">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent rounded-t-lg">
              <CardTitle className="text-primary">{day.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {day.exercises.map((ex, i) => {
                  const hasCues = ex.exercise.cues && ex.exercise.cues.length > 0;
                  const hasContraindications = ex.exercise.contraindications && ex.exercise.contraindications.length > 0;
                  const dayIdx = day.dayIndex;

                  return (
                    <Collapsible key={i} className="py-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{ex.exercise.name}</p>

                              {/* Contraindication warning badge */}
                              {hasContraindications && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-warning border-warning/50 gap-1 px-1.5">
                                        <AlertTriangle className="h-3 w-3" />
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="font-medium text-warning">Safety Note</p>
                                      <p className="text-sm">
                                        May not be suitable for: {ex.exercise.contraindications.map(c =>
                                          c.replace(/_/g, ' ')
                                        ).join(', ')}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {ex.exercise.primaryMuscles.map(getMuscleLabel).join(', ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{ex.sets} sets</Badge>
                          <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20">{ex.reps} reps</Badge>
                          <Badge variant="outline">RIR {ex.rir}</Badge>
                          <Badge variant="outline">{ex.restSeconds}s rest</Badge>

                          {/* Expand cues button */}
                          {hasCues && (
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-muted-foreground hover:text-foreground">
                                <Lightbulb className="h-3.5 w-3.5" />
                                <span className="text-xs">Tips</span>
                              </Button>
                            </CollapsibleTrigger>
                          )}

                          {/* Swap exercise button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSwapTarget({ dayIndex: dayIdx, exerciseIndex: i, exercise: ex });
                              setSwapModalOpen(true);
                            }}
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            <span className="text-xs">Swap</span>
                          </Button>
                        </div>
                      </div>

                      {/* Collapsible coaching cues */}
                      <CollapsibleContent className="mt-2 space-y-2">
                        <div className="pl-0 sm:pl-4 py-2 px-3 bg-muted/30 rounded-lg border-l-2 border-primary/30">
                          <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            Coaching Cues
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {ex.exercise.cues?.map((cue, cueIndex) => (
                              <li key={cueIndex} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{cue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Rationale for exercise selection */}
                        {ex.rationale && (
                          <div className="pl-0 sm:pl-4 py-2 px-3 bg-accent/10 rounded-lg border-l-2 border-accent/50">
                            <p className="text-xs font-medium text-accent-foreground/80 mb-1">
                              Why this exercise?
                            </p>
                            <p className="text-sm text-muted-foreground">{ex.rationale}</p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
    </main>
  );
}
