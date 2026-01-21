/**
 * Reaction Button Component
 *
 * Displays reaction counts and allows users to add/remove reactions.
 * Supports multiple reaction types: like, fire, muscle, clap
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Heart, Flame, Dumbbell, HandMetal, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityReaction, ReactionType } from '@/types/supabase';

interface ReactionButtonProps {
    reactions: ActivityReaction[];
    userReaction?: ReactionType | null;
    onReact: (reactionType: ReactionType) => void;
    onRemoveReaction: (reactionType: ReactionType) => void;
    disabled?: boolean;
}

const REACTION_CONFIG: Record<ReactionType, {
    icon: typeof Heart;
    label: string;
    activeColor: string;
    emoji: string;
}> = {
    like: {
        icon: ThumbsUp,
        label: 'Like',
        activeColor: 'text-blue-500',
        emoji: '👍',
    },
    fire: {
        icon: Flame,
        label: 'Fire',
        activeColor: 'text-orange-500',
        emoji: '🔥',
    },
    muscle: {
        icon: Dumbbell,
        label: 'Strong',
        activeColor: 'text-purple-500',
        emoji: '💪',
    },
    clap: {
        icon: HandMetal,
        label: 'Clap',
        activeColor: 'text-green-500',
        emoji: '👏',
    },
};

export function ReactionButton({
    reactions,
    userReaction,
    onReact,
    onRemoveReaction,
    disabled = false,
}: ReactionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Group reactions by type with counts
    const reactionCounts = reactions.reduce((acc, r) => {
        acc[r.reaction_type as ReactionType] = (acc[r.reaction_type as ReactionType] || 0) + 1;
        return acc;
    }, {} as Record<ReactionType, number>);

    const totalReactions = reactions.length;
    const hasUserReacted = !!userReaction;

    const handleReactionClick = (type: ReactionType) => {
        if (userReaction === type) {
            onRemoveReaction(type);
        } else {
            onReact(type);
        }
        setIsOpen(false);
    };

    // Quick reaction (toggle like)
    const handleQuickReact = () => {
        if (userReaction) {
            onRemoveReaction(userReaction);
        } else {
            onReact('like');
        }
    };

    return (
        <div className="flex items-center gap-1">
            {/* Quick reaction button */}
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    'h-8 px-2 gap-1.5',
                    hasUserReacted && REACTION_CONFIG[userReaction!]?.activeColor
                )}
                onClick={handleQuickReact}
                disabled={disabled}
            >
                {userReaction ? (
                    <>
                        <span className="text-base">{REACTION_CONFIG[userReaction].emoji}</span>
                        {totalReactions > 0 && (
                            <span className="text-xs font-medium">{totalReactions}</span>
                        )}
                    </>
                ) : (
                    <>
                        <ThumbsUp className="h-4 w-4" />
                        {totalReactions > 0 && (
                            <span className="text-xs font-medium">{totalReactions}</span>
                        )}
                    </>
                )}
            </Button>

            {/* Reaction picker */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={disabled}
                    >
                        <span className="text-xs">+</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex gap-1">
                        {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((type) => {
                            const config = REACTION_CONFIG[type];
                            const count = reactionCounts[type] || 0;
                            const isActive = userReaction === type;

                            return (
                                <Button
                                    key={type}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        'h-10 px-3 flex-col gap-0.5 hover:scale-110 transition-transform',
                                        isActive && 'bg-muted'
                                    )}
                                    onClick={() => handleReactionClick(type)}
                                >
                                    <span className="text-xl">{config.emoji}</span>
                                    {count > 0 && (
                                        <span className="text-[10px] text-muted-foreground">
                                            {count}
                                        </span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Show reaction summary if there are multiple types */}
            {Object.keys(reactionCounts).length > 1 && (
                <div className="flex items-center -space-x-1 ml-1">
                    {(Object.entries(reactionCounts) as [ReactionType, number][])
                        .slice(0, 3)
                        .map(([type]) => (
                            <span key={type} className="text-sm">
                                {REACTION_CONFIG[type].emoji}
                            </span>
                        ))}
                </div>
            )}
        </div>
    );
}
