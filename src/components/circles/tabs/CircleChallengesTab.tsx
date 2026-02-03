/**
 * Circle Challenges Tab
 *
 * Shows active challenges with progress visualization.
 * Allows admins to create new challenges.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Plus, Trophy, Clock, CheckCircle } from 'lucide-react';
import { useCircle } from '../CircleContext';
import { useCircleStore } from '@/stores/circleStore';
import { ChallengeCard } from '../challenges/ChallengeCard';
import { CreateChallengeModal } from '../challenges/CreateChallengeModal';
import type { CircleChallenge } from '@/types/supabase';

type ChallengeFilter = 'active' | 'upcoming' | 'completed';

function getChallengeStatus(challenge: CircleChallenge): ChallengeFilter {
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'active';
}

export function CircleChallengesTab() {
    const { circle, isAdmin } = useCircle();
    const { challenges, fetchChallenges } = useCircleStore();
    const [filter, setFilter] = useState<ChallengeFilter>('active');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchChallenges(circle.id);
    }, [circle.id, fetchChallenges]);

    // Filter challenges by status
    const filteredChallenges = challenges.filter(c => getChallengeStatus(c) === filter);

    // Count challenges by status
    const activeChallenges = challenges.filter(c => getChallengeStatus(c) === 'active');
    const upcomingChallenges = challenges.filter(c => getChallengeStatus(c) === 'upcoming');
    const completedChallenges = challenges.filter(c => getChallengeStatus(c) === 'completed');

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-orange-500" />
                                Challenges
                            </CardTitle>
                            <CardDescription>
                                Compete with circle members in weekly challenges
                            </CardDescription>
                        </div>

                        {isAdmin && (
                            <Button
                                className="gradient-primary text-white"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Challenge
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Filter tabs */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as ChallengeFilter)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="active" className="gap-1.5">
                        <Clock className="h-4 w-4" />
                        Active ({activeChallenges.length})
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="gap-1.5">
                        <Target className="h-4 w-4" />
                        Upcoming ({upcomingChallenges.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="gap-1.5">
                        <CheckCircle className="h-4 w-4" />
                        Completed ({completedChallenges.length})
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Challenge list */}
            {filteredChallenges.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            {filter === 'active' && (
                                <>
                                    <Clock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Active Challenges</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                        {isAdmin
                                            ? "Create a challenge to get your circle competing!"
                                            : "Check back later for new challenges."}
                                    </p>
                                    {isAdmin && (
                                        <Button onClick={() => setShowCreateModal(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Challenge
                                        </Button>
                                    )}
                                </>
                            )}
                            {filter === 'upcoming' && (
                                <>
                                    <Target className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Upcoming Challenges</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        {isAdmin
                                            ? "Schedule a future challenge to keep motivation high!"
                                            : "No challenges scheduled yet."}
                                    </p>
                                </>
                            )}
                            {filter === 'completed' && (
                                <>
                                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Completed Challenges</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        Completed challenges will appear here with their winners.
                                    </p>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredChallenges.map((challenge) => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                        />
                    ))}
                </div>
            )}

            {/* Create Challenge Modal */}
            <CreateChallengeModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                circleId={circle.id}
            />
        </div>
    );
}
