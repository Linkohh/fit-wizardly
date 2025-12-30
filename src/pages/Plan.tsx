import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanStore } from '@/stores/planStore';
import { MUSCLE_DATA } from '@/types/fitness';
import { Calendar, Clock, Target, Download, Wand2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PlanPage() {
  const { currentPlan } = usePlanStore();

  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-20 text-center">
          <Wand2 className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">No Plan Generated Yet</h1>
          <p className="text-muted-foreground mb-8">Create your personalized workout plan using the wizard.</p>
          <Link to="/wizard"><Button className="gradient-primary text-primary-foreground">Start Wizard</Button></Link>
        </main>
      </div>
    );
  }

  const getMuscleLabel = (id: string) => MUSCLE_DATA.find(m => m.id === id)?.name || id;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('FitWizard Workout Plan', 14, 22);
    doc.setFontSize(12);
    doc.text(`Split: ${currentPlan.splitType.replace('_', ' ').toUpperCase()}`, 14, 32);
    doc.text(`Days/Week: ${currentPlan.selections.daysPerWeek}`, 14, 40);

    let y = 55;
    currentPlan.workoutDays.forEach((day) => {
      doc.setFontSize(14);
      doc.text(day.name, 14, y);
      y += 8;
      const rows = day.exercises.map(e => [e.exercise.name, `${e.sets}`, e.reps, `${e.rir}`, `${e.restSeconds}s`]);
      autoTable(doc, { startY: y, head: [['Exercise', 'Sets', 'Reps', 'RIR', 'Rest']], body: rows, margin: { left: 14 } });
      y = (doc as any).lastAutoTable.finalY + 10;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    doc.save('FitWizard_Plan.pdf');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Workout Plan</h1>
          <Button onClick={exportPDF} className="gap-2"><Download className="h-4 w-4" /> Export PDF</Button>
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="p-6 flex flex-wrap gap-6">
            <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /><span>{currentPlan.selections.daysPerWeek} days/week</span></div>
            <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /><span>{currentPlan.selections.sessionDuration} min sessions</span></div>
            <div className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /><span>{currentPlan.splitType.replace('_', ' ')}</span></div>
          </CardContent>
        </Card>

        {/* Workout Days */}
        <div className="space-y-6">
          {currentPlan.workoutDays.map((day) => (
            <Card key={day.dayIndex}>
              <CardHeader><CardTitle>{day.name}</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y">
                  {day.exercises.map((ex, i) => (
                    <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{ex.exercise.name}</p>
                        <p className="text-sm text-muted-foreground">{ex.exercise.primaryMuscles.map(getMuscleLabel).join(', ')}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary">{ex.sets} sets</Badge>
                        <Badge variant="secondary">{ex.reps} reps</Badge>
                        <Badge variant="outline">RIR {ex.rir}</Badge>
                        <Badge variant="outline">{ex.restSeconds}s rest</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
