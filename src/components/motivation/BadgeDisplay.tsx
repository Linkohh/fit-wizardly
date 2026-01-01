import { cn } from '@/lib/utils';
import type { Badge } from '@/stores/achievementStore';
import { BADGES, BadgeId } from '@/stores/achievementStore';

interface BadgeDisplayProps {
  badge: Badge | BadgeId;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
  showName?: boolean;
  className?: string;
}

const tierColors = {
  bronze: 'from-amber-600 to-amber-800 shadow-amber-500/30',
  silver: 'from-slate-300 to-slate-500 shadow-slate-400/30',
  gold: 'from-yellow-400 to-amber-500 shadow-yellow-500/30',
  platinum: 'from-purple-400 to-pink-500 shadow-purple-500/30',
};

const tierBorders = {
  bronze: 'ring-amber-500/50',
  silver: 'ring-slate-400/50',
  gold: 'ring-yellow-500/50',
  platinum: 'ring-purple-500/50',
};

const sizes = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-20 h-20 text-4xl',
};

export function BadgeDisplay({ 
  badge, 
  size = 'md', 
  locked = false,
  showName = false,
  className 
}: BadgeDisplayProps) {
  const badgeData = typeof badge === 'string' ? BADGES[badge] : badge;
  
  if (!badgeData) return null;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center ring-2 transition-all duration-300',
          sizes[size],
          locked 
            ? 'bg-muted text-muted-foreground grayscale opacity-50' 
            : cn(
                'bg-gradient-to-br shadow-lg hover:scale-110 cursor-pointer',
                tierColors[badgeData.tier],
                tierBorders[badgeData.tier]
              )
        )}
        title={`${badgeData.name}: ${badgeData.description}`}
      >
        <span className={locked ? 'opacity-30' : ''}>{badgeData.icon}</span>
      </div>
      {showName && (
        <span className={cn(
          'text-xs font-medium text-center max-w-16 leading-tight',
          locked ? 'text-muted-foreground' : 'text-foreground'
        )}>
          {badgeData.name}
        </span>
      )}
    </div>
  );
}

interface BadgeGridProps {
  badges: BadgeId[];
  unlockedBadges: BadgeId[];
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeGrid({ badges, unlockedBadges, size = 'md' }: BadgeGridProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
      {badges.map((badgeId) => (
        <BadgeDisplay
          key={badgeId}
          badge={badgeId}
          size={size}
          locked={!unlockedBadges.includes(badgeId)}
          showName
        />
      ))}
    </div>
  );
}
