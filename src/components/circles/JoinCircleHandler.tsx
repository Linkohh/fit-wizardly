/**
 * Join Circle Handler
 *
 * Handles deep links for circle invites: /circles/join/:inviteCode
 * Automatically joins the user to the circle and redirects to the portal.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useCircleStore } from '@/stores/circleStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/use-toast';

type JoinStatus = 'loading' | 'success' | 'error' | 'already_member';

export function JoinCircleHandler() {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, isLoading: authLoading, setShowAuthModal } = useAuthStore();
    const { joinCircle, circles, fetchUserCircles } = useCircleStore();

    const [status, setStatus] = useState<JoinStatus>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [joinedCircleId, setJoinedCircleId] = useState<string | null>(null);
    const [circleName, setCircleName] = useState<string>('');

    useEffect(() => {
        async function handleJoin() {
            if (!inviteCode) {
                setStatus('error');
                setErrorMessage('Invalid invite link');
                return;
            }

            if (authLoading) {
                return; // Wait for auth to complete
            }

            if (!user) {
                // Store invite code and show auth modal
                sessionStorage.setItem('pendingInviteCode', inviteCode);
                setShowAuthModal(true);
                return;
            }

            // Check if already a member of a circle with this invite code
            await fetchUserCircles(user.id);
            const existingCircle = circles.find(c => c.invite_code === inviteCode.toUpperCase());

            if (existingCircle) {
                setStatus('already_member');
                setCircleName(existingCircle.name);
                setJoinedCircleId(existingCircle.id);
                return;
            }

            // Attempt to join
            const { error, circleId, circleName: name } = await joinCircleWithDetails(inviteCode);

            if (error) {
                if (error.message.includes('Already a member')) {
                    // Refetch to get the circle ID
                    await fetchUserCircles(user.id);
                    const circle = circles.find(c => c.invite_code === inviteCode.toUpperCase());
                    if (circle) {
                        setStatus('already_member');
                        setCircleName(circle.name);
                        setJoinedCircleId(circle.id);
                        return;
                    }
                }
                setStatus('error');
                setErrorMessage(error.message);
                return;
            }

            setStatus('success');
            setJoinedCircleId(circleId || null);
            setCircleName(name || 'the circle');

            toast({
                title: 'Welcome to the circle!',
                description: `You've joined ${name || 'the circle'}`,
            });

            // Redirect to circle portal after short delay
            if (circleId) {
                setTimeout(() => {
                    navigate(`/circles/${circleId}/feed`);
                }, 1500);
            }
        }

        handleJoin();
    }, [inviteCode, user, authLoading]);

    // Enhanced join that returns more details
    async function joinCircleWithDetails(code: string): Promise<{
        error: Error | null;
        circleId?: string;
        circleName?: string;
    }> {
        const result = await joinCircle(code);

        if (result.error) {
            return { error: result.error };
        }

        // Refetch circles to get the newly joined circle
        if (user) {
            await fetchUserCircles(user.id);
            const circle = useCircleStore.getState().circles.find(
                c => c.invite_code === code.toUpperCase()
            );
            return {
                error: null,
                circleId: circle?.id,
                circleName: circle?.name,
            };
        }

        return { error: null };
    }

    // Loading state
    if (status === 'loading' || authLoading) {
        return (
            <main className="container-content py-12">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-8 text-center">
                        <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Joining Circle...</h2>
                        <p className="text-muted-foreground">
                            {!user ? 'Please sign in to continue' : 'Processing your invite'}
                        </p>
                    </CardContent>
                </Card>
            </main>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <main className="container-content py-12">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">You're In!</h2>
                        <p className="text-muted-foreground mb-6">
                            Welcome to <span className="font-medium text-foreground">{circleName}</span>
                        </p>
                        {joinedCircleId ? (
                            <Button asChild className="gradient-primary text-white">
                                <Link to={`/circles/${joinedCircleId}/feed`}>
                                    Go to Circle
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link to="/circles">View Circles</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </main>
        );
    }

    // Already member state
    if (status === 'already_member') {
        return (
            <main className="container-content py-12">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Already a Member</h2>
                        <p className="text-muted-foreground mb-6">
                            You're already part of <span className="font-medium text-foreground">{circleName}</span>
                        </p>
                        {joinedCircleId ? (
                            <Button asChild className="gradient-primary text-white">
                                <Link to={`/circles/${joinedCircleId}/feed`}>
                                    Go to Circle
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link to="/circles">View Circles</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </main>
        );
    }

    // Error state
    return (
        <main className="container-content py-12">
            <Card className="max-w-md mx-auto">
                <CardContent className="p-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Couldn't Join Circle</h2>
                    <p className="text-muted-foreground mb-6">
                        {errorMessage || 'The invite link may be invalid or expired.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" asChild>
                            <Link to="/circles">View My Circles</Link>
                        </Button>
                        <Button asChild>
                            <Link to="/">Go Home</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
