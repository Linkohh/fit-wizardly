import { Client } from '@/types/fitness';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight, MoreVertical, Trash2, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useTrainerStore } from '@/stores/trainerStore';

interface ClientCardProps {
    client: Client;
    onClick?: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
    const { deleteClient } = useTrainerStore();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this client?')) {
            deleteClient(client.id);
        }
    };

    return (
        <Card
            className="group relative overflow-hidden transition-all hover:border-primary/50 hover:bg-muted/5 cursor-pointer"
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.displayName}`} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold leading-none">
                            {client.displayName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            Joined {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Client
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                {client.notes ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {client.notes}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground/50 italic min-h-[2.5rem]">
                        No notes added.
                    </p>
                )}
            </CardContent>
            <CardFooter className="bg-muted/50 p-3">
                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Last active: Recently</span>
                    </div>
                    <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Profile <ChevronRight className="ml-1 h-3 w-3" />
                    </Badge>
                </div>
            </CardFooter>
        </Card>
    );
}
