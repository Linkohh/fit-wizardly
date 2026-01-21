/**
 * Leaderboard Card Component
 *
 * Displays a member's rank and stats in the leaderboard.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Medal, Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/supabase';

interface LeaderboardCardProps {
    rank: number;
    profile: Profile;
    stats: {
        workouts: number;
        volume: number;
        streak: number;
    };
    isCurrentUser?: boolean;
}

const RANK_ICONS = {
    1: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    2: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/10' },
    3: { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/10' },
};

export function LeaderboardCard({
    rank,
    profile,
    stats,
    isCurrentUser = false,
}: LeaderboardCardProps) {
    const rankConfig = RANK_ICONS[rank as keyof typeof RANK_ICONS];
    const RankIcon = rankConfig?.icon;

    return (
        <div
            className={cn(
                'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                isCurrentUser
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card hover:bg-muted/30',
                rank <= 3 && 'border-l-4',
                rank === 1 && 'border-l-yellow-500',
                rank === 2 && 'border-l-gray-400',
                rank === 3 && 'border-l-amber-600'
            )}
        >
            {/* Rank */}
            <div className="w-10 flex-shrink-0 text-center">
                {RankIcon ? (
                    <div className={cn('inline-flex p-2 rounded-full', rankConfig.bg)}>
                        <RankIcon className={cn('h-5 w-5', rankConfig.color)} />
                    </div>
                ) : (
                    <span className="text-xl font-bold text-muted-foreground">
                        {rank}
                    </span>
                )}
            </div>

            {/* User */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                        {profile?.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="font-medium truncate">
                        {profile?.display_name || profile?.username || 'Unknown'}
                        {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {stats.streak > 0 && (
                            <span className="inline-flex items-center gap-1">
                                <Flame className="h-3 w-3 text-orange-500" />
                                {stats.streak} day streak
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-right">
                <div>
                    <p className="text-lg font-bold">{stats.workouts}</p>
                    <p className="text-xs text-muted-foreground">workouts</p>
                </div>
                <div>
                    <p className="text-lg font-bold">
                        {stats.volume >= 1000
                            ? `${(stats.volume / 1000).toFixed(1)}k`
                            : stats.volume}
                    </p>
                    <p className="text-xs text-muted-foreground">lbs</p>
                </div>
            </div>
        </div>
    );
}
