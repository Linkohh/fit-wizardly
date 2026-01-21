import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    Plus,
    LogIn,
    UserPlus,
    ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCircleStore } from '@/stores/circleStore';
import { CircleCard } from '@/components/circles/CircleCard';
import { CreateCircleModal } from '@/components/circles/CreateCircleModal';
import { JoinCircleModal } from '@/components/circles/JoinCircleModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { useState } from 'react';

export default function CirclesPage() {
    const navigate = useNavigate();
    const { user, profile, isLoading: authLoading, setShowAuthModal } = useAuthStore();
    // Use atomic selectors to prevent unnecessary re-renders
    const circles = useCircleStore((state) => state.circles);
    const isLoading = useCircleStore((state) => state.isLoading);
    const fetchUserCircles = useCircleStore((state) => state.fetchUserCircles);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserCircles(user.id);
        }
    }, [user]); // fetchUserCircles is a stable store action

    // Navigate to circle portal
    const handleCircleClick = (circleId: string) => {
        navigate(`/circles/${circleId}/feed`);
    };

    // Unauthenticated view
    if (!user && !authLoading) {
        return (
            <main className="container-content py-12">
                <AuthModal />

                <div className="text-center mb-12">
                    <div className="mx-auto w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-glow">
                        <Users className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Accountability Circles</h1>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        Join a small group of workout buddies who keep each other motivated with weekly check-ins and friendly challenges.
                    </p>
                </div>

                {/* Features preview */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Small Groups</h3>
                            <p className="text-sm text-muted-foreground">
                                3-5 members per circle for meaningful connections
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                                <ArrowRight className="h-6 w-6 text-secondary" />
                            </div>
                            <h3 className="font-semibold mb-2">Live Activity Feed</h3>
                            <p className="text-sm text-muted-foreground">
                                See when circle members complete workouts and hit PRs
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                                <Badge className="h-6 w-6 text-orange-500" />
                            </div>
                            <h3 className="font-semibold mb-2">Weekly Challenges</h3>
                            <p className="text-sm text-muted-foreground">
                                Compete for most volume, workouts, or longest streaks
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Button
                        size="lg"
                        className="gradient-primary text-white gap-2"
                        onClick={() => setShowAuthModal(true)}
                    >
                        <LogIn className="h-5 w-5" />
                        Sign In to Get Started
                    </Button>
                </div>
            </main>
        );
    }

    // Loading state
    if (authLoading || isLoading) {
        return (
            <main className="container-wide py-8 animate-fade-in">
                {/* Page header skeleton */}
                <div className="mb-8 space-y-2">
                    <Skeleton variant="shimmer" className="h-9 w-48 rounded-lg" />
                    <Skeleton variant="shimmer" className="h-4 w-72 rounded-md" />
                </div>

                {/* Action buttons skeleton */}
                <div className="flex gap-3 mb-8 justify-end">
                    <Skeleton variant="shimmer" className="h-10 w-24 rounded-xl" />
                    <Skeleton variant="shimmer" className="h-10 w-32 rounded-xl" />
                </div>

                {/* Circle cards skeleton - 2 column grid on larger screens */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Sidebar skeleton */}
                    <div className="lg:col-span-1 space-y-4">
                        <Skeleton variant="shimmer" className="h-5 w-24 rounded-md mb-4" />
                        {[1, 2].map(i => (
                            <Card key={i} className="p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <Skeleton variant="shimmer" className="h-12 w-12 rounded-full flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton variant="shimmer" className="h-5 w-32 rounded-md" />
                                        <Skeleton variant="shimmer" className="h-4 w-20 rounded-md" />
                                    </div>
                                </div>
                                <Skeleton variant="shimmer" className="h-4 w-full rounded-md mb-2" />
                                <Skeleton variant="shimmer" className="h-4 w-3/4 rounded-md" />
                            </Card>
                        ))}
                    </div>

                    {/* Feed skeleton */}
                    <div className="lg:col-span-2">
                        <Card className="p-6">
                            <Skeleton variant="shimmer" className="h-6 w-40 rounded-md mb-6" />
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 p-3 rounded-lg border border-border/50">
                                        <Skeleton variant="shimmer" className="h-10 w-10 rounded-full flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton variant="shimmer" className="h-4 w-32 rounded-md" />
                                            <Skeleton variant="shimmer" className="h-4 w-full max-w-md rounded-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    // Authenticated view
    return (
        <main className="container-wide py-8">
            <AuthModal />
            <CreateCircleModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
            <JoinCircleModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Your Circles</h1>
                    <p className="text-muted-foreground">
                        {circles.length === 0
                            ? "Join or create a circle to get started"
                            : `${circles.length} circle${circles.length !== 1 ? 's' : ''}`}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join
                    </Button>
                    <Button className="gradient-primary text-white" onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                    </Button>
                </div>
            </div>

            {circles.length === 0 ? (
                // Empty state
                <Card className="p-12 text-center">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No circles yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create your own circle and invite friends, or join an existing one with an invite code.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Join with Code
                        </Button>
                        <Button className="gradient-primary text-white" onClick={() => setShowCreateModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Circle
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {circles.map((circle) => (
                        <CircleCard
                            key={circle.id}
                            circle={circle}
                            onClick={() => handleCircleClick(circle.id)}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
