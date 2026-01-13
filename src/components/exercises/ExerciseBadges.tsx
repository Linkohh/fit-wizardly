import { Medal, Trophy, Flame, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExerciseBadgesProps {
    exerciseId: string;
}

export function ExerciseBadges({ exerciseId }: ExerciseBadgesProps) {
    // Mock user badges data (deterministic based on ID for demo)
    const hasBadges = exerciseId.length % 2 === 0;

    const badges = [
        {
            id: 'novice',
            name: 'First Steps',
            icon: Target,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            description: 'Completed this exercise for the first time',
            earned: true,
        },
        {
            id: 'mastery',
            name: 'Form Mastery',
            icon: Medal,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            description: 'Achieved perfection in technique',
            earned: hasBadges,
        },
        {
            id: 'volume',
            name: 'Volume King',
            icon: Trophy,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            description: 'Lifted over 10,000 lbs total',
            earned: exerciseId.length % 3 === 0,
        },
        {
            id: 'streak',
            name: 'On Fire',
            icon: Flame,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            description: 'Logged 3 weeks in a row',
            earned: false,
        },
    ];

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Mastery & Badges
            </h4>

            <div className="grid grid-cols-4 gap-2">
                <TooltipProvider delayDuration={200}>
                    {badges.map((badge) => (
                        <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    "aspect-square rounded-xl flex items-center justify-center border transition-all duration-300",
                                    badge.earned
                                        ? `${badge.bg} border-white/10 hover:border-white/20 hover:scale-110 cursor-help`
                                        : "bg-white/5 border-transparent opacity-30 grayscale"
                                )}>
                                    <badge.icon className={cn("w-5 h-5", badge.earned ? badge.color : "text-white")} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-black/90 border-white/10 text-xs">
                                <div className="font-bold text-white mb-0.5">{badge.name}</div>
                                <div className="text-white/70">{badge.description}</div>
                                {!badge.earned && <div className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">Locked</div>}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>

            {/* Progress Bar for next Badge */}
            <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>Next: Silver Milestone</span>
                    <span>75%</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/80 w-[75%] shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                </div>
            </div>
        </div>
    );
}
