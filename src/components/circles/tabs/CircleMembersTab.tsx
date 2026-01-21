/**
 * Circle Members Tab
 *
 * Shows all circle members with their profiles and stats.
 * TODO: Enhance in Phase 5
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Users } from 'lucide-react';
import { useCircle } from '../CircleContext';
import { cn } from '@/lib/utils';

export function CircleMembersTab() {
    const { circle } = useCircle();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Members ({circle.member_count})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {circle.members.map((member) => {
                        const isAdmin = member.role === 'admin';
                        const profile = member.profile;

                        return (
                            <div
                                key={member.id}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                                    isAdmin
                                        ? 'bg-primary/5 border-primary/20'
                                        : 'bg-muted/30 border-border/50'
                                )}
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback>
                                        {profile?.display_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">
                                            {profile?.display_name || profile?.username || 'Unknown'}
                                        </span>
                                        {isAdmin && (
                                            <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Joined {new Date(member.joined_at || '').toLocaleDateString()}
                                    </p>
                                </div>

                                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                                    {isAdmin ? 'Admin' : 'Member'}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
