import { Target, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from './ProgressRing';
import { useAchievementStore } from '@/stores/achievementStore';
import { cn } from '@/lib/utils';

interface GoalVisualizationProps {
  className?: string;
}

export function GoalVisualization({ className }: GoalVisualizationProps) {
  const { weeklyGoal, weeklyProgress } = useAchievementStore();
  
  const progress = Math.min((weeklyProgress / weeklyGoal) * 100, 100);
  const remaining = Math.max(weeklyGoal - weeklyProgress, 0);
  const isComplete = weeklyProgress >= weeklyGoal;

  return (
    <Card variant="glass" className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Weekly Goal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ProgressRing 
            progress={progress} 
            size="lg" 
            label={`${weeklyProgress}/${weeklyGoal}`}
          />
          <div className="flex-1 space-y-2">
            {isComplete ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Goal achieved! 🎉</span>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {remaining === 1 
                    ? "Just 1 more workout plan to go!"
                    : `${remaining} workout plans to reach your goal`
                  }
                </p>
                <p className="text-xs text-muted-foreground/70">
                  You're making great progress!
                </p>
              </div>
            )}
            
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: weeklyGoal }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all duration-300',
                    i < weeklyProgress
                      ? 'bg-gradient-to-br from-primary to-secondary scale-100'
                      : 'bg-muted scale-90'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
