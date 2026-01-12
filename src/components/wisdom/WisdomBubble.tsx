import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { useWisdomStore } from '@/stores/wisdomStore';
import { WisdomChat } from './WisdomChat';
import { cn } from '@/lib/utils';

interface WisdomBubbleProps {
    className?: string;
}

export function WisdomBubble({ className }: WisdomBubbleProps) {
    const { isOpen, toggleOpen, learningProgress } = useWisdomStore();

    return (
        <>
            {/* Floating Bubble Button */}
            <div
                className={cn(
                    'fixed bottom-6 right-6 z-50',
                    className
                )}
            >
                <Button
                    onClick={toggleOpen}
                    size="lg"
                    className={cn(
                        'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
                        'hover:scale-110 hover:shadow-xl',
                        isOpen
                            ? 'bg-muted text-muted-foreground'
                            : 'gradient-primary text-white',
                        !isOpen && 'animate-pulse-subtle'
                    )}
                >
                    {isOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <div className="relative">
                            <Sparkles className="h-6 w-6" />
                            {learningProgress.questionsAsked === 0 && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 bg-pink-500 rounded-full animate-ping" />
                            )}
                        </div>
                    )}
                </Button>

                {/* Tooltip for new users */}
                {!isOpen && learningProgress.questionsAsked === 0 && (
                    <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap">
                        <div className="bg-foreground text-background text-sm py-2 px-3 rounded-lg shadow-lg animate-bounce-subtle">
                            <p className="font-medium">Ask Wisdom AI 💡</p>
                            <p className="text-xs opacity-80">Learn why your plan works</p>
                            <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-foreground" />
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Panel */}
            <WisdomChat />

            <style>{`
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1.5s infinite;
        }
      `}</style>
        </>
    );
}
