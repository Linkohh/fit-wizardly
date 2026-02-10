import { useState, useRef, useEffect } from 'react';
import { useTrainerStore } from '@/stores/trainerStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User, Bot, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility, otherwise use classnames or manual string concatenation

interface ClientMessagesProps {
    clientId: string;
}

export function ClientMessages({ clientId }: ClientMessagesProps) {
    const { messages, sendMessage, markMessagesAsRead, getClient } = useTrainerStore();
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const client = getClient(clientId);
    const clientMessages = messages.filter(m => m.clientId === clientId).sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        // Mark as read when viewing
        markMessagesAsRead(clientId);
    }, [clientMessages.length, clientId, markMessagesAsRead]);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessage(clientId, newMessage, 'trainer');
        setNewMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!client) return null;

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {client.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{client.displayName}</CardTitle>
                        <CardDescription>Direct Message</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {clientMessages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-12">
                                <p>No messages yet.</p>
                                <p className="text-sm">Start the conversation!</p>
                            </div>
                        ) : (
                            clientMessages.map((msg) => {
                                const isTrainer = msg.sender === 'trainer';
                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-3 max-w-[80%]",
                                            isTrainer ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <Avatar className="h-8 w-8 mt-1">
                                            {isTrainer ? (
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    <Bot className="h-4 w-4" />
                                                </AvatarFallback>
                                            ) : (
                                                <AvatarFallback className="bg-muted">
                                                    {client.displayName.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>

                                        <div className={cn(
                                            "group relative px-4 py-2 rounded-2xl text-sm",
                                            isTrainer
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-muted text-foreground rounded-tl-none"
                                        )}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <div className={cn(
                                                "text-[10px] mt-1 flex items-center gap-1 opacity-70",
                                                isTrainer ? "justify-end text-primary-foreground/80" : "text-muted-foreground"
                                            )}>
                                                {format(new Date(msg.timestamp), 'h:mm a')}
                                                {isTrainer && (
                                                    msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50">
                    <div className="flex gap-2">
                        <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="min-h-[2.5rem] max-h-32 resize-none"
                            rows={1}
                        />
                        <Button
                            onClick={handleSend}
                            size="icon"
                            className={cn(
                                "h-10 w-10 shrink-0 gradient-primary transition-all",
                                !newMessage.trim() && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={!newMessage.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
