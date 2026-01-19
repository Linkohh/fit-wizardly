import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown } from 'lucide-react';
import type { CircleWithMembers } from '@/types/supabase';
import { cn } from '@/lib/utils';

interface CircleCardProps {
    circle: CircleWithMembers;
    isSelected?: boolean;
    onClick?: () => void;
}

export function CircleCard({ circle, isSelected, onClick }: CircleCardProps) {
    return (
        <Card
            className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'hover:border-primary/30'
            )}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{circle.name}</h3>
                    <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {circle.member_count}/{circle.max_members}
                    </Badge>
                </div>

                {circle.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {circle.description}
                    </p>
                )}

                {/* Member avatars */}
                <div className="flex -space-x-2">
                    {circle.members.slice(0, 5).map((member) => (
                        <div
                            key={member.id}
                            className={cn(
                                'w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium',
                                member.role === 'admin'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                            )}
                            title={member.profile?.display_name || 'Member'}
                        >
                            {member.role === 'admin' ? (
                                <Crown className="h-3 w-3" />
                            ) : (
                                (member.profile?.display_name?.[0] || '?').toUpperCase()
                            )}
                        </div>
                    ))}
                    {circle.member_count > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                            +{circle.member_count - 5}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
