import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePlanStore } from '@/stores/planStore';
import { type ExercisePrescription } from '@/types/fitness';
import { Calendar, Clock, Target, Download, ShieldAlert, Calculator, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { OneRepMaxCalculator } from '@/components/tools/OneRepMaxCalculator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ExerciseSwapModal } from '@/components/plan/ExerciseSwapModal';
import { WisdomBubble } from '@/components/wisdom/WisdomBubble';
import { useWisdomStore } from '@/stores/wisdomStore';
import { WorkoutDayCard } from '@/components/plan/WorkoutDayCard';
import { useAuthStore } from '@/stores/authStore';
import { useWizardStore } from '@/stores/wizardStore';
import { PlanNavigation } from '@/components/plan/PlanNavigation';
import { SaveTemplateDialog } from '@/components/plan/SaveTemplateDialog';
import { useTrainerStore } from '@/stores/trainerStore';
import { PeriodizationTimeline } from '@/components/plan/PeriodizationTimeline';
import { NoPlanEmptyState } from '@/components/plan/NoPlanEmptyState';
import { WeeklyProgressCard } from '@/components/plan/WeeklyProgressCard';
import { detectMRVWarnings, suggestSplitAdjustment } from '@/lib/progressionEngine';
import { formatIdentifierLabel } from '@/lib/displayText';

export default function PlanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentPlan = usePlanStore((state) => state.currentPlan);
  const currentWeek = usePlanStore((state) => state.currentWeek);
  const workoutLogs = usePlanStore((state) => state.workoutLogs);
  const planHistory = usePlanStore((state) => state.planHistory);
  const setCurrentPlan = usePlanStore((state) => state.setCurrentPlan);
  const swapExercise = usePlanStore((state) => state.swapExercise);
  const clearCurrentPlan = usePlanStore((state) => state.clearCurrentPlan);
  const isTrainerMode = useTrainerStore((state) => state.isTrainerMode);
  const isTrainerAuthorized = useAuthStore((state) => !state.user || state.profile?.is_trainer === true);
  const resetWizard = useWizardStore((state) => state.resetWizard);
  const [redactSensitive, setRedactSensitive] = useState(true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; exerciseIndex: number; exercise: ExercisePrescription } | null>(null);
  const setContext = useWisdomStore((state) => state.setContext);
  const activePlan = currentPlan ?? planHistory[0] ?? null;
  const isTrainerEnabled = isTrainerAuthorized && isTrainerMode;

  useEffect(() => {
    if (!currentPlan && planHistory.length > 0) {
      setCurrentPlan(planHistory[0]);
    }
  }, [currentPlan, planHistory, setCurrentPlan]);

  // Set Wisdom AI context when plan changes
  useEffect(() => {
    if (activePlan) {
      setContext({
        planId: activePlan.id,
        exerciseId: null,
        weekNumber: 1,
        phase: activePlan.selections.optPhase,
      });
    }
  }, [activePlan, setContext]);

  const handleStartOver = () => {
    clearCurrentPlan();
    resetWizard();
    navigate('/wizard');
  };

  const planLogs = useMemo(
    () => (activePlan ? workoutLogs.filter((log) => log.planId === activePlan.id) : []),
    [workoutLogs, activePlan]
  );

  const mrvWarnings = useMemo(
    () => (activePlan ? detectMRVWarnings(planLogs, activePlan, 7) : []),
    [planLogs, activePlan]
  );

  const splitSuggestion = useMemo(
    () => (activePlan ? suggestSplitAdjustment(planLogs, activePlan, 28) : null),
    [planLogs, activePlan]
  );

  if (!activePlan) {
    return <NoPlanEmptyState />;
  }

  const handleExportPDF = async () => {
    if (!activePlan) return;
    const { exportPlanToPDF } = await import('@/lib/pdfExport');
    exportPlanToPDF(activePlan, redactSensitive);
  };

  return (
    <main className="container-wide py-8 pb-32">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold gradient-text self-start sm:self-center">{t('plan.title')}</h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Trainer: Save as Template */}
          {isTrainerEnabled && (
            <>
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-auto border-primary/20 hover:border-primary text-primary"
                onClick={() => setSaveTemplateOpen(true)}
              >
                <Save className="h-4 w-4" />
                Save as Template
              </Button>
              <SaveTemplateDialog
                open={saveTemplateOpen}
                onOpenChange={setSaveTemplateOpen}
              />
            </>
          )}

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
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Calendar className="h-4 w-4 text-primary-foreground" /></div><span>{activePlan.selections.daysPerWeek} {t('plan.summary.days_week')}</span></div>
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Clock className="h-4 w-4 text-primary-foreground" /></div><span>{activePlan.selections.sessionDuration} {t('plan.summary.min_sessions')}</span></div>
          <div className="flex items-center gap-2"><div className="p-2 rounded-full gradient-primary"><Target className="h-4 w-4 text-primary-foreground" /></div><span>{formatIdentifierLabel(activePlan.splitType)}</span></div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <WeeklyProgressCard planId={activePlan.id} />

      {mrvWarnings.length > 0 && (
        <Card className="mb-6 border-orange-500/30 bg-orange-500/10">
          <CardContent className="p-4 text-sm">
            <p className="font-semibold text-orange-200">{t('plan.mrv_warning')}</p>
            <p className="mt-1 text-orange-100/90">
              {mrvWarnings
                .map((warning) => `${formatIdentifierLabel(warning.muscleGroup)}: ${warning.weeklySets} sets (MRV ${warning.mrv})`)
                .join(' • ')}
            </p>
          </CardContent>
        </Card>
      )}

      {splitSuggestion && (
        <Card className="mb-6 border-blue-500/30 bg-blue-500/10">
          <CardContent className="p-4 text-sm">
            <p className="font-semibold text-blue-100">{t('plan.split_recommendation')}{formatIdentifierLabel(splitSuggestion.recommendedSplit)}</p>
            <p className="mt-1 text-blue-100/90">{splitSuggestion.rationale}</p>
          </CardContent>
        </Card>
      )}

      {activePlan.rirProgression.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{t('plan.progression.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('plan.progression.subtitle')}</p>
            </div>
            <PeriodizationTimeline progression={activePlan.rirProgression} currentWeek={currentWeek} />
          </CardContent>
        </Card>
      )}

      {/* Workout Days */}
      <div className="space-y-6">
        {activePlan.workoutDays.map((day, index) => (
          <motion.div
            key={day.dayIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }}
          >
            <WorkoutDayCard
              day={day}
              planId={activePlan.id}
              onSwap={(target) => {
                setSwapTarget(target);
                setSwapModalOpen(true);
              }}
            />
          </motion.div>
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
          allowedEquipment={activePlan.selections.equipment}
        />
      )}

      {/* Wisdom AI Floating Bubble (Disabled for the time being) */}
      {/* <WisdomBubble /> */}

      {/* Navigation Footer */}
      <PlanNavigation onStartOver={handleStartOver} />
    </main>
  );
}
