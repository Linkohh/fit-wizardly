import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrengthCurve } from '@/components/analytics/StrengthCurve';
import { VolumeHealth } from '@/components/analytics/VolumeHealth';
import { LiftTruthMeterCard } from '@/components/analytics/LiftTruthMeterCard';
import { PlanFitReviewCard } from '@/components/analytics/PlanFitReviewCard';
import { SessionRescueCard } from '@/components/analytics/SessionRescueCard';
import { TrainingCompassCard } from '@/components/analytics/TrainingCompassCard';
import { WeeklyChangeBriefCard } from '@/components/analytics/WeeklyChangeBriefCard';
import { WeeklyCoachSummaryCard } from '@/components/analytics/WeeklyCoachSummaryCard';
import { ReadinessTrend } from '@/components/recovery/ReadinessTrend';
import { buildTrainingCompass } from '@/lib/analyticsIntelligence';
import { useAuthStore } from '@/stores/authStore';
import { usePlanStore } from '@/stores/planStore';
import { useReadinessStore } from '@/stores/readinessStore';
import { useTrainerStore } from '@/stores/trainerStore';
import { BarChart2, Compass, Dumbbell, Target } from 'lucide-react';

function TodayNextAction() {
    const workoutLogs = usePlanStore((state) => state.workoutLogs);
    const readinessLogs = useReadinessStore((state) => state.logs);
    const analysisNow = useMemo(() => new Date(), []);
    const insight = useMemo(
        () => buildTrainingCompass({ workoutLogs, readinessLogs, now: analysisNow }),
        [workoutLogs, readinessLogs, analysisNow],
    );

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/10 p-4 sm:p-5"
            aria-labelledby="today-next-action"
        >
            <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-secondary/10 to-transparent" aria-hidden="true" />
            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/25 bg-background/35">
                        <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p id="today-next-action" className="text-sm font-semibold text-primary">
                            Today&apos;s next action
                        </p>
                        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-foreground">{insight.nextAction}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:items-center">
                    <span className="rounded-full border border-border/50 bg-background/35 px-3 py-1 text-muted-foreground">
                        Score {insight.score}
                    </span>
                    <span className="rounded-full border border-border/50 bg-background/35 px-3 py-1 text-muted-foreground">
                        {insight.metrics.recentWorkouts} recent sessions
                    </span>
                </div>
            </div>
        </motion.section>
    );
}

export default function Analytics() {
    const [activeTab, setActiveTab] = useState('today');
    const user = useAuthStore((state) => state.user);
    const profile = useAuthStore((state) => state.profile);
    const isTrainerMode = useTrainerStore((state) => state.isTrainerMode);
    const isTrainerAuthorized = !user || profile?.is_trainer === true;
    const isTrainerEnabled = isTrainerAuthorized && isTrainerMode;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 pb-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="font-display text-3xl font-bold gradient-text">Analytics Command Center</h1>
                <p className="max-w-2xl text-muted-foreground">
                    Coaching signals for what changed, what matters, and the next best training move.
                </p>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 glass-card border border-primary/15 p-1 lg:w-[520px]">
                    <TabsTrigger value="today" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_12px_hsl(var(--primary)/0.25)]">
                        <Compass className="h-3.5 w-3.5 mr-1.5" />
                        Today
                    </TabsTrigger>
                    <TabsTrigger value="strength" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_12px_hsl(var(--primary)/0.25)]">
                        <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
                        Strength
                    </TabsTrigger>
                    <TabsTrigger value="load" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary/20 data-[state=active]:to-primary/20 data-[state=active]:text-secondary data-[state=active]:shadow-[0_0_12px_hsl(var(--secondary)/0.25)]">
                        <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                        Load
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-6">
                    {activeTab === 'today' && (
                        <>
                            <TodayNextAction />
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
                                <TrainingCompassCard className="min-w-0" />
                                <div className="grid min-w-0 gap-6">
                                    <SessionRescueCard />
                                    <PlanFitReviewCard />
                                </div>
                            </div>
                            <WeeklyChangeBriefCard />
                        </>
                    )}
                </TabsContent>

                <TabsContent value="strength" className="space-y-6">
                    {activeTab === 'strength' && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <StrengthCurve />
                            <LiftTruthMeterCard />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="load" className="space-y-6">
                    {activeTab === 'load' && (
                        <>
                            <PlanFitReviewCard />
                            <div className="grid gap-6 lg:grid-cols-2">
                                <VolumeHealth />
                                <ReadinessTrend />
                            </div>
                            {isTrainerEnabled && <WeeklyCoachSummaryCard />}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
