/**
 * Activity Item Component
 *
 * Displays a single activity with reactions and comments.
 * Used in the Circle Feed to render workout logs, PRs, streaks, etc.
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Activity,
    Dumbbell,
    Trophy,
    Flame,
    UserPlus,
    MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactionButton } from './ReactionButton';
import { ActivityComments } from './ActivityComments';
import type {
    ActivityWithProfile,
    ActivityReaction,
    ActivityCommentWithProfile,
    ReactionType,
} from '@/types/supabase';

interface ActivityItemProps {
    activity: ActivityWithProfile;
    reactions?: ActivityReaction[];
    comments?: ActivityCommentWithProfile[];
    userReaction?: ReactionType | null;
    onReact?: (activityId: string, reactionType: ReactionType) => Promise<void>;
    onRemoveReaction?: (activityId: string, reactionType: ReactionType) => Promise<void>;
    onAddComment?: (activityId: string, content: string) => Promise<void>;
    onDeleteComment?: (commentId: string) => Promise<void>;
    showComments?: boolean;
}

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
    workout_logged: Dumbbell,
    pr_set: Trophy,
    streak: Flame,
    member_joined: UserPlus,
};

const ACTIVITY_COLORS: Record<string, string> = {
    workout_logged: 'text-primary bg-primary/10',
    pr_set: 'text-yellow-500 bg-yellow-500/10',
    streak: 'text-orange-500 bg-orange-500/10',
    member_joined: 'text-green-500 bg-green-500/10',
};

type ActivityPayload = {
    workoutName?: string;
    duration?: number;
    exerciseName?: string;
    streakDays?: number;
    memberName?: string;
    title?: string;
    exerciseCount?: number;
    totalVolume?: number;
} & Record<string, unknown>;

function formatActivityMessage(activity: ActivityWithProfile): string {
    const name = activity.profile?.display_name || 'Someone';
    const payload = (activity.payload ?? {}) as ActivityPayload;

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
}

function formatTimeAgo(dateStr: string): string {
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
}

export function ActivityItem({
    activity,
    reactions = [],
    comments = [],
    userReaction,
    onReact,
    onRemoveReaction,
    onAddComment,
    onDeleteComment,
    showComments: initialShowComments = false,
}: ActivityItemProps) {
    const [showComments, setShowComments] = useState(initialShowComments);
    const [isLoadingComments] = useState(false);

    const Icon = ACTIVITY_ICONS[activity.activity_type] || Activity;
    const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'text-muted-foreground bg-muted';
    const payload = (activity.payload ?? {}) as ActivityPayload;

    const handleReact = async (reactionType: ReactionType) => {
        if (onReact) {
            await onReact(activity.id, reactionType);
        }
    };

    const handleRemoveReaction = async (reactionType: ReactionType) => {
        if (onRemoveReaction) {
            await onRemoveReaction(activity.id, reactionType);
        }
    };

    const handleAddComment = async (content: string) => {
        if (onAddComment) {
            await onAddComment(activity.id, content);
        }
    };

    const toggleComments = () => {
        setShowComments(!showComments);
    };

    const commentCount = comments.length;

    return (
        <div className="p-4 border-b hover:bg-muted/30 transition-colors">
            <div className="flex gap-3">
                {/* Activity icon */}
                <div className={cn('p-2 rounded-full flex-shrink-0 h-fit', colorClass)}>
                    <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                    {/* User info and message */}
                    <div className="flex items-start gap-2 mb-1">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={activity.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                                {activity.profile?.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm break-words">
                                {formatActivityMessage(activity)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatTimeAgo(activity.created_at || '')}
                            </p>
                        </div>
                    </div>

                    {/* Workout details (if applicable) */}
                    {activity.activity_type === 'workout_logged' && activity.payload && (
                        <div className="mt-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                            <div className="flex gap-4">
                                {payload.exerciseCount && (
                                    <span>
                                        {payload.exerciseCount} exercises
                                    </span>
                                )}
                                {payload.totalVolume && (
                                    <span>
                                        {(payload.totalVolume / 1000).toFixed(1)}k lbs
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reactions and comments bar */}
                    <div className="flex items-center gap-2 mt-3">
                        <ReactionButton
                            reactions={reactions}
                            userReaction={userReaction}
                            onReact={handleReact}
                            onRemoveReaction={handleRemoveReaction}
                            disabled={!onReact}
                        />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 gap-1.5"
                            onClick={toggleComments}
                        >
                            <MessageCircle className="h-4 w-4" />
                            {commentCount > 0 && (
                                <span className="text-xs font-medium">{commentCount}</span>
                            )}
                        </Button>
                    </div>

                    {/* Comments section */}
                    {showComments && (
                        <ActivityComments
                            comments={comments}
                            onAddComment={handleAddComment}
                            onDeleteComment={onDeleteComment}
                            isLoading={isLoadingComments}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
