/**
 * Activity Comments Component
 *
 * Displays comments on an activity and provides input for new comments.
 * Supports real-time updates and optimistic UI.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityCommentWithProfile } from '@/types/supabase';
import { useAuthStore } from '@/stores/authStore';

interface ActivityCommentsProps {
    comments: ActivityCommentWithProfile[];
    onAddComment: (content: string) => Promise<void>;
    onDeleteComment?: (commentId: string) => Promise<void>;
    isLoading?: boolean;
}

export function ActivityComments({
    comments,
    onAddComment,
    onDeleteComment,
    isLoading = false,
}: ActivityCommentsProps) {
    const { user } = useAuthStore();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(newComment.trim());
            setNewComment('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!onDeleteComment || deletingId) return;

        setDeletingId(commentId);
        try {
            await onDeleteComment(commentId);
        } finally {
            setDeletingId(null);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    return (
        <div className="mt-3 space-y-3">
            {/* Comment list */}
            {comments.length > 0 && (
                <div className="space-y-2 pl-2 border-l-2 border-border/50">
                    {comments.map((comment) => {
                        const isOwn = comment.user_id === user?.id;
                        const isDeleting = deletingId === comment.id;

                        return (
                            <div
                                key={comment.id}
                                className={cn(
                                    'flex gap-2 group',
                                    isDeleting && 'opacity-50'
                                )}
                            >
                                <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={comment.profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-[10px]">
                                        {comment.profile?.display_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-medium">
                                            {comment.profile?.display_name || 'Unknown'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatTimeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/90 break-words">
                                        {comment.content}
                                    </p>
                                </div>

                                {/* Delete button (only for own comments) */}
                                {isOwn && onDeleteComment && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(comment.id)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && comments.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading comments...
                </div>
            )}

            {/* Comment input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="h-8 text-sm"
                    maxLength={500}
                    disabled={isSubmitting}
                />
                <Button
                    type="submit"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={!newComment.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </div>
    );
}
