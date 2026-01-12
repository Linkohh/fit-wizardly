import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Send,
    Sparkles,
    User,
    BookOpen,
    Lightbulb,
    GraduationCap,
    Loader2,
} from 'lucide-react';
import { useWisdomStore } from '@/stores/wisdomStore';
import { usePlanStore } from '@/stores/planStore';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function WisdomChat() {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        isOpen,
        conversationHistory,
        isLoading,
        learningProgress,
        currentContext,
        askQuestion,
        getSuggestedQuestions,
    } = useWisdomStore();

    const { currentPlan } = usePlanStore();

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversationHistory]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const question = input.trim();
        setInput('');
        await askQuestion(question, currentPlan ?? undefined);
    };

    const handleSuggestionClick = async (suggestion: string) => {
        await askQuestion(suggestion, currentPlan ?? undefined);
    };

    const getLevelIcon = () => {
        switch (learningProgress.learningLevel) {
            case 'novice': return '🌱';
            case 'student': return '📚';
            case 'scholar': return '🎓';
            case 'expert': return '🧠';
            default: return '🌱';
        }
    };

    const suggestedQuestions = getSuggestedQuestions();

    if (!isOpen) return null;

    return (
        <Card className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] z-50 shadow-2xl border-primary/20 flex flex-col overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b py-3 px-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full gradient-primary">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Wisdom AI</CardTitle>
                            <p className="text-xs text-muted-foreground">Your training coach</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <span>{getLevelIcon()}</span>
                        <span className="capitalize">{learningProgress.learningLevel}</span>
                    </Badge>
                </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                {conversationHistory.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-medium mb-2">Ask me anything!</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            I can explain your workout plan, exercise science, and help you train smarter.
                        </p>

                        {/* Suggestions */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {suggestedQuestions.slice(0, 3).map((q, i) => (
                                <Button
                                    key={i}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => handleSuggestionClick(q)}
                                >
                                    <Lightbulb className="h-3 w-3 mr-1" />
                                    {q}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {conversationHistory.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    'flex gap-3',
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                                        <Sparkles className="h-4 w-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'rounded-2xl px-4 py-2 max-w-[80%]',
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-muted rounded-bl-sm'
                                    )}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm">{msg.content}</p>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                        <User className="h-4 w-4 text-secondary-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Follow-up suggestions */}
            {conversationHistory.length > 0 && !isLoading && (
                <div className="px-4 pb-2 flex-shrink-0">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {suggestedQuestions.slice(0, 2).map((q, i) => (
                            <Button
                                key={i}
                                variant="ghost"
                                size="sm"
                                className="text-xs whitespace-nowrap"
                                onClick={() => handleSuggestionClick(q)}
                            >
                                {q}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t flex-shrink-0">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your workout..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                        className="gradient-primary text-white"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Card>
    );
}
