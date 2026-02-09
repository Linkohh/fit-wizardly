import { usePlanStore } from "@/stores/planStore";
import { WorkoutHistoryCard } from "@/components/history/WorkoutHistoryCard";
import { ArrowLeft, History as HistoryIcon, CalendarRange } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
    const { t } = useTranslation();
    const { workoutLogs } = usePlanStore();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    const hasLogs = workoutLogs.length > 0;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 glass-header border-b border-border/40 backdrop-blur-md">
                <div className="container max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/">
                            <Button variant="ghost" size="icon" className="-ml-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="font-bold text-lg flex items-center gap-2">
                            <HistoryIcon className="w-5 h-5 text-primary" />
                            {t('nav.history', 'History')}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container max-w-md mx-auto px-4 py-6 space-y-6">

                {/* Stats Summary (Placeholder for now) */}
                {hasLogs && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center bg-primary/5 border-primary/10">
                            <span className="text-3xl font-bold text-primary">{workoutLogs.length}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Workouts</span>
                        </div>
                        <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold">
                                {Math.round(workoutLogs.reduce((acc, log) => acc + log.duration, 0) / 60)}
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Hours</span>
                        </div>
                    </div>
                )}

                {/* List of Workouts */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Recent Activity
                        </h2>
                    </div>

                    {!hasLogs ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-50">
                            <CalendarRange className="w-16 h-16 text-muted-foreground" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium">No History Yet</h3>
                                <p className="text-sm text-muted-foreground max-w-[200px]">
                                    Complete your first workout to see your history here!
                                </p>
                            </div>
                            <Link to="/plan">
                                <Button>Start Workout</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {workoutLogs.map((log) => (
                                <WorkoutHistoryCard
                                    key={log.id}
                                    log={log}
                                    onClick={() => console.log("Navigate to details", log.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
