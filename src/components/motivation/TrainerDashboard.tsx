import { Users, Award, TrendingUp, FileText, Star, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrainerStore } from '@/stores/trainerStore';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

export type TrainerLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

interface TrainerLevelInfo {
  level: TrainerLevel;
  name: string;
  minClients: number;
  icon: typeof Star;
  color: string;
  bgColor: string;
}

const TRAINER_LEVELS: TrainerLevelInfo[] = [
  { level: 'bronze', name: 'Bronze Trainer', minClients: 0, icon: Medal, color: 'text-amber-600', bgColor: 'from-amber-600 to-amber-800' },
  { level: 'silver', name: 'Silver Trainer', minClients: 5, icon: Medal, color: 'text-slate-400', bgColor: 'from-slate-300 to-slate-500' },
  { level: 'gold', name: 'Gold Trainer', minClients: 10, icon: Star, color: 'text-yellow-500', bgColor: 'from-yellow-400 to-amber-500' },
  { level: 'platinum', name: 'Platinum Trainer', minClients: 25, icon: Award, color: 'text-purple-400', bgColor: 'from-purple-400 to-pink-500' },
];

function getTrainerLevel(clientCount: number): TrainerLevelInfo {
  for (let i = TRAINER_LEVELS.length - 1; i >= 0; i--) {
    if (clientCount >= TRAINER_LEVELS[i].minClients) {
      return TRAINER_LEVELS[i];
    }
  }
  return TRAINER_LEVELS[0];
}

function getNextLevel(clientCount: number): TrainerLevelInfo | null {
  const currentLevel = getTrainerLevel(clientCount);
  const currentIndex = TRAINER_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex < TRAINER_LEVELS.length - 1) {
    return TRAINER_LEVELS[currentIndex + 1];
  }
  return null;
}

interface TrainerLevelBadgeProps {
  className?: string;
  compact?: boolean;
}

export function TrainerLevelBadge({ className, compact = false }: TrainerLevelBadgeProps) {
  const { clients } = useTrainerStore();
  const level = getTrainerLevel(clients.length);
  const LevelIcon = level.icon;

  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        `bg-gradient-to-r ${level.bgColor} text-white`,
        className
      )}>
        <LevelIcon className="h-3 w-3" />
        {level.name}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r shadow-lg',
      level.bgColor,
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
        <LevelIcon className="h-6 w-6 text-white" />
      </div>
      <div>
        <div className="text-white font-bold">{level.name}</div>
        <div className="text-white/80 text-sm">{clients.length} client{clients.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
  );
}

interface TrainerDashboardProps {
  className?: string;
}

export function TrainerDashboard({ className }: TrainerDashboardProps) {
  const { clients, assignments, templates } = useTrainerStore();
  
  const level = getTrainerLevel(clients.length);
  const nextLevel = getNextLevel(clients.length);
  const LevelIcon = level.icon;
  
  // Calculate stats
  const totalAssignments = assignments.length;
  const activeClients = new Set(assignments.map(a => a.clientId)).size;
  const templateUsage = templates.reduce((acc, t) => {
    const uses = assignments.filter(a =>
      // This is a simplified check - in real app, would need more logic
      a.planId === t.planSnapshot.id
    ).length;
    return acc + uses;
  }, 0);

  // Animate stats with smooth count-up effect
  const animatedTotalClients = useCountUp(clients.length, 1000);
  const animatedActiveClients = useCountUp(activeClients, 1200);
  const animatedTotalAssignments = useCountUp(totalAssignments, 1400);
  const animatedTotalTemplates = useCountUp(templates.length, 1600);
  const animatedTemplateUsage = useCountUp(templateUsage, 1800);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Level Card */}
      <Card variant="glass" className="overflow-hidden">
        <div className={cn('p-6 bg-gradient-to-r', level.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <LevelIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{level.name}</h3>
                <p className="text-white/80">
                  {animatedTotalClients} client{animatedTotalClients !== 1 ? 's' : ''} managed
                </p>
              </div>
            </div>
            {nextLevel && (
              <div className="text-right text-white/80 text-sm">
                <p>{nextLevel.minClients - clients.length} more to {nextLevel.name}</p>
                <div className="mt-1 w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/60 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((clients.length - level.minClients) / (nextLevel.minClients - level.minClients)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="interactive">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-foreground">{animatedTotalClients}</div>
            <div className="text-xs text-muted-foreground">Total Clients</div>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-foreground">{animatedActiveClients}</div>
            <div className="text-xs text-muted-foreground">Active Clients</div>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <div className="text-2xl font-bold text-foreground">{animatedTotalAssignments}</div>
            <div className="text-xs text-muted-foreground">Plans Assigned</div>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold text-foreground">{animatedTotalTemplates}</div>
            <div className="text-xs text-muted-foreground">Templates Created</div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Message */}
      {totalAssignments > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You've helped <span className="font-bold text-foreground">{animatedActiveClients}</span> client{animatedActiveClients !== 1 ? 's' : ''} with{' '}
              <span className="font-bold text-foreground">{animatedTotalAssignments}</span> workout plan{animatedTotalAssignments !== 1 ? 's' : ''} this month!
              {templates.length > 0 && (
                <> Your templates have been used <span className="font-bold text-foreground">{animatedTemplateUsage}</span> time{animatedTemplateUsage !== 1 ? 's' : ''}.</>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
