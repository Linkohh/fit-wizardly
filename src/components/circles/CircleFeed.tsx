import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Activity,
    Copy,
    Check,
    RefreshCw,
} from 'lucide-react';
import { useCircleStore } from '@/stores/circleStore';
import { useAuthStore } from '@/stores/authStore';
import type { CircleWithMembers, ReactionType } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { ActivityItem } from './feed/ActivityItem';

interface CircleFeedProps {
    circle: CircleWithMembers;
}

export function CircleFeed({ circle }: CircleFeedProps) {
    const { user } = useAuthStore();
    const {
        activities,
        isLoadingActivities,
        fetchActivities,
        subscribeToActivities,
        reactions,
        comments,
        fetchReactions,
        fetchComments,
        addReaction,
        removeReaction,
        addComment,
        deleteComment,
        getUserReaction,
    } = useCircleStore();
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    // Pull-to-refresh functionality
    const { isRefreshing, pullDistance, isPulling } = usePullToRefresh({
        onRefresh: async () => {
            await fetchActivities(circle.id);
            if (activities.length > 0) {
                await fetchReactions(activities.map(a => a.id));
            }
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

    // Fetch reactions when activities change
    useEffect(() => {
        if (activities.length > 0) {
            fetchReactions(activities.map(a => a.id));
        }
    }, [activities.length]);

    // Handlers for social interactions
    const handleReact = async (activityId: string, reactionType: ReactionType) => {
        await addReaction(activityId, reactionType);
    };

    const handleRemoveReaction = async (activityId: string, reactionType: ReactionType) => {
        await removeReaction(activityId, reactionType);
    };

    const handleAddComment = async (activityId: string, content: string) => {
        await addComment(activityId, content);
    };

    const handleDeleteComment = async (commentId: string) => {
        await deleteComment(commentId);
    };

    // Fetch comments for an activity when needed
    const _handleFetchComments = async (activityId: string) => {
        if (!comments.has(activityId)) {
            await fetchComments(activityId);
        }
    };

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
                                const activityReactions = reactions.get(activity.id) || [];
                                const activityComments = comments.get(activity.id) || [];
                                const userReaction = user ? getUserReaction(activity.id, user.id) : null;

                                return (
                                    <ActivityItem
                                        key={activity.id}
                                        activity={activity}
                                        reactions={activityReactions}
                                        comments={activityComments}
                                        userReaction={userReaction}
                                        onReact={handleReact}
                                        onRemoveReaction={handleRemoveReaction}
                                        onAddComment={handleAddComment}
                                        onDeleteComment={handleDeleteComment}
                                    />
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
