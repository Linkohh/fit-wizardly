import { Flame, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAchievementStore } from '@/stores/achievementStore';

interface StreakTrackerProps {
  compact?: boolean;
  className?: string;
}

export function StreakTracker({ compact = false, className }: StreakTrackerProps) {
  const { currentStreak, longestStreak, totalPlansGenerated } = useAchievementStore();

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20', className)}>
        <Flame className={cn(
          'h-4 w-4',
          currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'
        )} />
        <span className="text-sm font-medium">
          {currentStreak} day{currentStreak !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <Card variant="glass" className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Current Streak */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              currentStreak > 0 
                ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30' 
                : 'bg-muted'
            )}>
              <Flame className={cn(
                'h-6 w-6',
                currentStreak > 0 ? 'text-white animate-pulse' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>

          {/* Best Streak */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{longestStreak}</div>
              <div className="text-xs text-muted-foreground">Best</div>
            </div>
          </div>

          {/* Total Plans */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{totalPlansGenerated}</div>
              <div className="text-xs text-muted-foreground">Total Plans</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
