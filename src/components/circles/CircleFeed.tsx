import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Activity,
    Dumbbell,
    Trophy,
    Flame,
    UserPlus,
    Copy,
    Check,
    RefreshCw,
} from 'lucide-react';
import { useCircleStore } from '@/stores/circleStore';
import type { CircleWithMembers, ActivityWithProfile } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface CircleFeedProps {
    circle: CircleWithMembers;
}

export function CircleFeed({ circle }: CircleFeedProps) {
    const { activities, isLoadingActivities, fetchActivities, subscribeToActivities } = useCircleStore();
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    // Pull-to-refresh functionality
    const { isRefreshing, pullDistance, isPulling } = usePullToRefresh({
        onRefresh: async () => {
            await fetchActivities(circle.id);
            toast({
                title: 'Feed refreshed',
                description: 'Latest activities loaded',
            });
        },
        threshold: 80,
        resistance: 2.5,
    });

    useEffect(() => {
        fetchActivities(circle.id);
        const unsubscribe = subscribeToActivities(circle.id);
        return unsubscribe;
    }, [circle.id, fetchActivities, subscribeToActivities]);

    const copyInviteCode = () => {
        if (circle.invite_code) {
            navigator.clipboard.writeText(circle.invite_code);
            setCopied(true);
            toast({
                title: 'Invite code copied!',
                description: 'Share this code with friends to invite them.',
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'workout_logged': return Dumbbell;
            case 'pr_set': return Trophy;
            case 'streak': return Flame;
            case 'member_joined': return UserPlus;
            default: return Activity;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'workout_logged': return 'text-primary bg-primary/10';
            case 'pr_set': return 'text-yellow-500 bg-yellow-500/10';
            case 'streak': return 'text-orange-500 bg-orange-500/10';
            case 'member_joined': return 'text-green-500 bg-green-500/10';
            default: return 'text-muted-foreground bg-muted';
        }
    };

    const formatActivityMessage = (activity: ActivityWithProfile) => {
        const name = activity.profile?.display_name || 'Someone';
        const payload = activity.payload as Record<string, any> || {};

        switch (activity.activity_type) {
            case 'workout_logged':
                return `${name} completed "${payload.workoutName}" (${payload.duration} min)`;
            case 'pr_set':
                return `${name} hit a new PR on ${payload.exerciseName}! 🎉`;
            case 'streak':
                return `${name} is on a ${payload.streakDays}-day streak! 🔥`;
            case 'member_joined':
                return `${payload.memberName || name} joined the circle!`;
            case 'challenge_created':
                return `${name} started a new challenge: ${payload.title}`;
            default:
                return `${name} did something awesome`;
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Card className="h-full">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{circle.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {circle.member_count} members
                        </p>
                    </div>

                    <Button variant="outline" size="sm" onClick={copyInviteCode}>
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4 mr-2" />
                                Invite Code
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                    {/* Pull-to-refresh indicator */}
                    {(isRefreshing || isPulling) && (
                        <div
                            className="flex justify-center items-center py-4 bg-gradient-to-b from-primary/5 to-transparent transition-all duration-200"
                            style={{
                                transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
                                opacity: isRefreshing ? 1 : Math.min(pullDistance / 80, 1)
                            }}
                        >
                            <RefreshCw
                                className={cn(
                                    "h-5 w-5 text-primary transition-transform duration-200",
                                    isRefreshing && "animate-spin",
                                    isPulling && "animate-pulse"
                                )}
                                style={{
                                    transform: `rotate(${pullDistance * 4}deg)`
                                }}
                            />
                            <span className="ml-2 text-sm font-medium text-primary">
                                {isRefreshing ? 'Refreshing...' : pullDistance >= 80 ? 'Release to refresh' : 'Pull to refresh'}
                            </span>
                        </div>
                    )}

                    {isLoadingActivities ? (
                        <div className="space-y-3 p-4 animate-fade-in">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex gap-3 p-4 rounded-lg border border-border/50 bg-card/50">
                                    {/* User avatar skeleton */}
                                    <Skeleton variant="shimmer" className="h-10 w-10 rounded-full flex-shrink-0" />

                                    <div className="flex-1 space-y-2">
                                        {/* Activity header */}
                                        <Skeleton variant="shimmer" className="h-4 w-full max-w-md rounded-md" />

                                        {/* Timestamp skeleton */}
                                        <Skeleton variant="shimmer" className="h-3 w-16 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No activity yet</p>
                            <p className="text-sm">Complete a workout to get things started!</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {activities.map((activity) => {
                                const Icon = getActivityIcon(activity.activity_type);
                                const colorClass = getActivityColor(activity.activity_type);

                                return (
                                    <div key={activity.id} className="p-4 flex gap-3 hover:bg-muted/30 transition-colors">
                                        <div className={cn('p-2 rounded-full flex-shrink-0', colorClass)}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">{formatActivityMessage(activity)}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatTimeAgo(activity.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
