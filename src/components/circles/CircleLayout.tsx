/**
 * Circle Layout
 *
 * Wrapper layout for the Circle Portal. Handles:
 * - Fetching circle data based on URL param
 * - Membership validation
 * - Providing circle context to child routes
 * - Rendering tab navigation and content via Outlet
 */

import { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, Copy, Check, Crown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCircleStore } from '@/stores/circleStore';
import { CircleContext, CircleContextValue } from './CircleContext';
import { CircleTabNav } from './CircleTabNav';
import { useToast } from '@/components/ui/use-toast';
import type { CircleWithMembers } from '@/types/supabase';

export function CircleLayout() {
    const { circleId } = useParams<{ circleId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const { fetchCircleById, subscribeToActivities } = useCircleStore();

    const [circle, setCircle] = useState<CircleWithMembers | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Determine user's role in the circle
    const currentMember = circle?.members.find(m => m.user_id === user?.id);
    const isAdmin = currentMember?.role === 'admin';
    const isMember = !!currentMember;

    // Fetch circle data
    const fetchCircle = useCallback(async () => {
        if (!circleId) {
            setError('No circle ID provided');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchCircleById(circleId);

            if (!data) {
                setError('Circle not found');
                setIsLoading(false);
                return;
            }

            // Check membership
            const memberCheck = data.members.some(m => m.user_id === user?.id);
            if (!memberCheck) {
                setError('You are not a member of this circle');
                setIsLoading(false);
                return;
            }

            setCircle(data);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching circle:', err);
            setError('Failed to load circle');
            setIsLoading(false);
        }
    }, [circleId, user?.id, fetchCircleById]);

    useEffect(() => {
        fetchCircle();
    }, [fetchCircle]);

    // Subscribe to real-time activities
    useEffect(() => {
        if (!circleId || !circle) return;
        const unsubscribe = subscribeToActivities(circleId);
        return unsubscribe;
    }, [circleId, circle, subscribeToActivities]);

    const copyInviteCode = () => {
        if (circle?.invite_code) {
            navigator.clipboard.writeText(circle.invite_code);
            setCopied(true);
            toast({
                title: 'Invite code copied!',
                description: 'Share this code with friends to invite them.',
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <main className="container-wide py-8 animate-fade-in">
                {/* Back button skeleton */}
                <Skeleton variant="shimmer" className="h-9 w-32 rounded-lg mb-6" />

                {/* Header skeleton */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <Skeleton variant="shimmer" className="h-16 w-16 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton variant="shimmer" className="h-7 w-48 rounded-lg" />
                                <Skeleton variant="shimmer" className="h-4 w-32 rounded-md" />
                            </div>
                            <Skeleton variant="shimmer" className="h-10 w-28 rounded-xl" />
                        </div>
                    </CardContent>
                </Card>

                {/* Tab nav skeleton */}
                <div className="flex gap-4 mb-6 border-b pb-3">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} variant="shimmer" className="h-8 w-24 rounded-md" />
                    ))}
                </div>

                {/* Content skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="shimmer" className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            </main>
        );
    }

    // Error state
    if (error || !circle) {
        return (
            <main className="container-content py-12">
                <Card className="p-8 text-center">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                        {error || 'Circle not found'}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        This circle may have been deleted or you may not have access.
                    </p>
                    <Button asChild>
                        <Link to="/circles">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Circles
                        </Link>
                    </Button>
                </Card>
            </main>
        );
    }

    // Build context value
    const contextValue: CircleContextValue = {
        circle,
        isAdmin,
        isMember,
        refetch: fetchCircle,
    };

    return (
        <CircleContext.Provider value={contextValue}>
            <main className="container-wide py-8">
                {/* Back button */}
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link to="/circles">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        All Circles
                    </Link>
                </Button>

                {/* Circle Header */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Circle avatar (first letter or icon) */}
                            <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl font-bold text-white">
                                    {circle.name.charAt(0).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold truncate">{circle.name}</h1>
                                    {isAdmin && (
                                        <Crown className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-muted-foreground">
                                    {circle.member_count} / {circle.max_members || 5} members
                                </p>
                                {circle.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {circle.description}
                                    </p>
                                )}
                            </div>

                            {/* Member avatars */}
                            <div className="flex -space-x-2 mr-4">
                                {circle.members.slice(0, 5).map((member) => (
                                    <Avatar
                                        key={member.id}
                                        className="h-8 w-8 border-2 border-background"
                                    >
                                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {member.profile?.display_name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {circle.members.length > 5 && (
                                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                        +{circle.members.length - 5}
                                    </div>
                                )}
                            </div>

                            {/* Invite button */}
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
                    </CardContent>
                </Card>

                {/* Tab Navigation */}
                <CircleTabNav isAdmin={isAdmin} />

                {/* Tab Content via Outlet */}
                <Outlet />
            </main>
        </CircleContext.Provider>
    );
}
