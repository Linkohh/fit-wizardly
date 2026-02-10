import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePlanStore } from '@/stores/planStore';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Trophy, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PeriodizationTimeline() {
    const { currentPlan, currentWeek } = usePlanStore();

    if (!currentPlan) {
        return (
            <Card variant="glass" className="w-full">
                <CardHeader>
                    <CardTitle className="text-lg">No Active Plan</CardTitle>
                    <CardDescription>Start a new training plan to see your periodization timeline.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Calculate total weeks from RIR progression or default to 4
    const totalWeeks = currentPlan.rirProgression?.length || 4;
    const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

    // Calculate progress percentage
    const progress = Math.min(100, Math.max(0, ((currentWeek - 1) / totalWeeks) * 100));

    // Derive a display name since Plan doesn't have a direct name property
    const planName = currentPlan.selections.personalGoalNote ||
        `${currentPlan.selections.goal.charAt(0).toUpperCase() + currentPlan.selections.goal.slice(1)} ${currentPlan.splitType.replace('_', ' ')} Split`;

    return (
        <Card variant="glass" className="w-full overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-muted/20">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                />
            </div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="gradient-text text-xl flex items-center gap-2 capitalize">
                            <Calendar className="w-5 h-5 text-primary" />
                            {planName}
                        </CardTitle>
                        <CardDescription className="capitalize">
                            Week {currentWeek} of {totalWeeks} • {currentPlan.selections.goal} Phase
                        </CardDescription>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                            {Math.round(progress)}%
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Completed</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="relative pt-6 pb-2">
                    {/* Connecting Line */}
                    <div className="absolute top-[2.75rem] left-0 w-full h-0.5 bg-muted/30 -z-10" />

                    <div className="flex justify-between overflow-x-auto pb-4 gap-4 no-scrollbar snap-x">
                        {weeks.map((week) => {
                            const isPast = week < currentWeek;
                            const isCurrent = week === currentWeek;
                            const isFuture = week > currentWeek;

                            return (
                                <div
                                    key={week}
                                    className={cn(
                                        "flex flex-col items-center gap-3 min-w-[80px] snap-center transition-all duration-300",
                                        isCurrent ? "scale-110" : "opacity-70 scale-95"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-all",
                                            isPast ? "bg-primary border-primary text-primary-foreground" :
                                                isCurrent ? "bg-background border-primary text-primary shadow-glow ring-4 ring-primary/20" :
                                                    "bg-muted border-muted-foreground/30 text-muted-foreground"
                                        )}
                                    >
                                        {isPast ? (
                                            <Trophy className="w-5 h-5" />
                                        ) : (
                                            <span className="font-bold">{week}</span>
                                        )}
                                    </div>

                                    <div className="text-center space-y-1">
                                        <div className={cn(
                                            "text-xs font-semibold uppercase tracking-wider",
                                            isCurrent ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            Week {week}
                                        </div>
                                        {isCurrent && (
                                            <div className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                Current
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend / current focus */}
                <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                        <Dumbbell className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <div className="text-sm font-medium">Current Focus: Hypertrophy & Volume</div>
                        <div className="text-xs text-muted-foreground">Sets: 3-4 • Reps: 8-12 • RIR: 1-2</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
            </CardContent>
        </Card>
    );
}
