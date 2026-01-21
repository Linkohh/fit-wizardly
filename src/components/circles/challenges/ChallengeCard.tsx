/**
 * Challenge Card Component
 *
 * Displays a challenge with progress bar and participant info.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Users, Target, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CircleChallenge, Profile } from '@/types/supabase';

interface ChallengeCardProps {
    challenge: CircleChallenge & {
        participants?: { profile: Profile; score: number }[];
        userProgress?: number;
    };
    onClick?: () => void;
}

function getChallengeStatus(challenge: CircleChallenge): 'upcoming' | 'active' | 'completed' {
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'active';
}

function getDaysRemaining(endDate: string): number {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

const STATUS_CONFIG = {
    upcoming: {
        label: 'Upcoming',
        variant: 'secondary' as const,
        color: 'text-blue-500',
    },
    active: {
        label: 'Active',
        variant: 'default' as const,
        color: 'text-green-500',
    },
    completed: {
        label: 'Completed',
        variant: 'outline' as const,
        color: 'text-muted-foreground',
    },
};

const CHALLENGE_TYPE_LABELS: Record<string, string> = {
    workout_count: 'Total Workouts',
    total_volume: 'Total Volume',
    streak: 'Longest Streak',
    consistency: 'Consistency',
};

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
    const status = getChallengeStatus(challenge);
    const statusConfig = STATUS_CONFIG[status];
    const daysRemaining = status === 'active' ? getDaysRemaining(challenge.end_date) : 0;
    const participants = challenge.participants || [];
    const userProgress = challenge.userProgress || 0;

    // Calculate progress percentage (mock for now)
    const goalValue = 7; // Default goal
    const progressPercent = Math.min(100, (userProgress / goalValue) * 100);

    return (
        <Card
            className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                status === 'active' && 'border-primary/30 bg-primary/5',
                status === 'completed' && 'opacity-75'
            )}
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{challenge.title}</CardTitle>
                        {challenge.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {challenge.description}
                            </p>
                        )}
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Challenge info */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        {CHALLENGE_TYPE_LABELS[challenge.challenge_type || ''] || challenge.challenge_type}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDateRange(challenge.start_date, challenge.end_date)}
                    </div>
                    {status === 'active' && (
                        <div className="flex items-center gap-1.5 text-orange-500">
                            <Clock className="h-4 w-4" />
                            {daysRemaining} days left
                        </div>
                    )}
                </div>

                {/* Progress bar (for active challenges) */}
                {status === 'active' && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your progress</span>
                            <span className="font-medium">{userProgress} / {goalValue}</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                    </div>
                )}

                {/* Participants */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {participants.length} participants
                        </span>
                    </div>

                    {participants.length > 0 && (
                        <div className="flex -space-x-2">
                            {participants.slice(0, 4).map((p, i) => (
                                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={p.profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-[10px]">
                                        {p.profile?.display_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {participants.length > 4 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                                    +{participants.length - 4}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Winner (for completed challenges) */}
                {status === 'completed' && challenge.winner_id && participants.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                            Winner: {participants.find(p => p.profile?.id === challenge.winner_id)?.profile?.display_name || 'Unknown'}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
