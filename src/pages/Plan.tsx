import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useWizardStore } from '@/stores/wizardStore';
import { PlanNavigation } from '@/components/plan/PlanNavigation';

export default function PlanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentPlan, swapExercise, clearCurrentPlan } = usePlanStore();
  const { resetWizard } = useWizardStore();
  const [redactSensitive, setRedactSensitive] = useState(true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; exerciseIndex: number; exercise: ExercisePrescription } | null>(null);
  // Sync loading state directly with store (no artificial delay)
  const [isLoadingPlan, setIsLoadingPlan] = useState(!currentPlan);
  const { setContext } = useWisdomStore();

  useEffect(() => {
    setIsLoadingPlan(!currentPlan);
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

  const handleStartOver = () => {
    clearCurrentPlan();
    resetWizard();
    navigate('/wizard');
  };

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
        <h1 className="text-2xl font-bold mb-4">{t('plan.noplan.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('plan.noplan.description')}</p>
        <Link to="/wizard"><Button variant="gradient" size="lg">{t('plan.noplan.cta')}</Button></Link>
      </main>
    );
  }

  const handleExportPDF = () => {
    exportPlanToPDF(currentPlan, redactSensitive);
  };

  return (
    <main className="container max-w-5xl mx-auto px-4 py-8 pb-32">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold gradient-text self-start sm:self-center">{t('plan.title')}</h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* 1RM Calculator Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto border-dashed border-primary/40 hover:border-primary">
                <Calculator className="h-4 w-4 text-primary" />
                {t('plan.tools')}
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
                <Download className="h-4 w-4" /> {t('plan.export')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-warning/10">
                    <ShieldAlert className="h-5 w-5 text-warning" />
                  </div>
                  <AlertDialogTitle>{t('plan.export_dialog.title')}</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="space-y-4 pt-2">
                  <p>
                    {t('plan.export_dialog.description')}
                  </p>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="redact-toggle" className="font-medium">{t('plan.export_dialog.privacy_mode')}</Label>
                      <span className="text-xs text-muted-foreground">
                        {t('plan.export_dialog.privacy_mode_hint')}
                      </span>
                    </div>
                    <Switch
                      id="redact-toggle"
                      checked={redactSensitive}
                      onCheckedChange={setRedactSensitive}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground border-l-2 border-warning/50 pl-3">
                    <strong>{t('plan.export_dialog.privacy_notice')}</strong> {t('plan.export_dialog.privacy_notice_text')}
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleExportPDF} className="gradient-primary">
                  <Download className="h-4 w-4 mr-2" />
                  {t('plan.export_dialog.download')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6 flex flex-wrap gap-6">
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Calendar className="h-4 w-4 text-primary-foreground" /></div><span>{currentPlan.selections.daysPerWeek} {t('plan.summary.days_week')}</span></div>
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Clock className="h-4 w-4 text-primary-foreground" /></div><span>{currentPlan.selections.sessionDuration} {t('plan.summary.min_sessions')}</span></div>
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Target className="h-4 w-4 text-primary-foreground" /></div><span>{currentPlan.splitType.replace('_', ' ')}</span></div>
        </CardContent>
      </Card>

      {currentPlan.rirProgression.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{t('plan.progression.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('plan.progression.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPlan.rirProgression.map((progression) => (
                <Badge
                  key={progression.week}
                  variant={progression.isDeload ? 'secondary' : 'default'}
                  className="flex items-center gap-1.5"
                >
                  <span>{t('plan.progression.week_label', { week: progression.week })}</span>
                  <span>•</span>
                  <span>{t('plan.progression.rir_label', { count: progression.targetRIR })}</span>
                  {progression.isDeload && (
                    <>
                      <span>•</span>
                      <span className="text-[10px] uppercase tracking-wide">{t('plan.progression.deload')}</span>
                    </>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
        <p className="text-lg font-medium gradient-text">"{t('plan.motivational_quote')}"</p>
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

      {/* Navigation Footer */}
      <PlanNavigation onStartOver={handleStartOver} />
    </main>
  );
}
