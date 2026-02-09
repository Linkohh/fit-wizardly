import { format, formatDistanceToNow } from 'date-fns';
import { WorkoutLog } from '@/types/fitness';
import { Trophy, Calendar, Clock, Dumbbell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutHistoryCardProps {
    log: WorkoutLog;
    onClick?: () => void;
}

export function WorkoutHistoryCard({ log, onClick }: WorkoutHistoryCardProps) {
    const volume = log.totalVolume;
    const durationMinutes = Math.round(log.duration);
    const date = new Date(log.startedAt);

    // PR tracking requires comparing against history/records, which isn't directly on the log
    // For now we hide the PR badge until we have a robust way to derived it
    const prCount = 0;

    return (
        <div
            onClick={onClick}
            className={cn(
                "glass-card p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer group active:scale-[0.98]",
                "bg-muted/30 hover:bg-muted/50"
            )}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {log.dayName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(date, 'MMM d, yyyy')}</span>
                        <span className="text-muted-foreground/30">•</span>
                        <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
                    </div>
                </div>
                {prCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20">
                        <Trophy className="w-3 h-3" />
                        <span>{prCount} PR{prCount > 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-t border-border/50">
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/50">
                    <Clock className="w-4 h-4 text-primary mb-1" />
                    <span className="text-lg font-mono font-bold leading-none">{durationMinutes}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">min</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/50">
                    <Dumbbell className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-lg font-mono font-bold leading-none">{volume.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">lbs</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/50">
                    <div className="font-bold text-lg leading-none">{log.exercises.length}</div>
                    <span className="text-[10px] text-muted-foreground uppercase">Exercises</span>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-end text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">
                View Details <ChevronRight className="w-3 h-3 ml-1" />
            </div>
        </div>
    );
}
