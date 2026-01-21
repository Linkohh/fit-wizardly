/**
 * Circle Leaderboard Tab
 *
 * Weekly/monthly leaderboard showing member rankings.
 * Shows member standings based on workout activity.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, TrendingUp, Info } from 'lucide-react';
import { useCircle } from '../CircleContext';
import { useAuthStore } from '@/stores/authStore';
import { LeaderboardCard } from '../leaderboard/LeaderboardCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Period = 'week' | 'month' | 'all';

export function CircleLeaderboardTab() {
    const { circle } = useCircle();
    const { user } = useAuthStore();
    const [period, setPeriod] = useState<Period>('week');

    // Generate mock leaderboard data from members
    // TODO: Replace with actual aggregated workout stats when workout integration is complete
    const leaderboardData = circle.members
        .map((member) => ({
            profile: member.profile,
            userId: member.user_id,
            stats: {
                // Placeholder stats - will be calculated from actual workouts
                workouts: Math.floor(Math.random() * 7) + 1,
                volume: Math.floor(Math.random() * 50000) + 5000,
                streak: Math.floor(Math.random() * 14),
            },
        }))
        .sort((a, b) => b.stats.workouts - a.stats.workouts || b.stats.volume - a.stats.volume);

    return (
        <div className="space-y-6">
            {/* Period selector */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Leaderboard
                            </CardTitle>
                            <CardDescription>
                                See who's crushing it this {period}
                            </CardDescription>
                        </div>

                        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                            <TabsList>
                                <TabsTrigger value="week" className="gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Week
                                </TabsTrigger>
                                <TabsTrigger value="month" className="gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Month
                                </TabsTrigger>
                                <TabsTrigger value="all" className="gap-1.5">
                                    <TrendingUp className="h-4 w-4" />
                                    All Time
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
            </Card>

            {/* Info alert */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Leaderboard stats will update automatically as circle members complete workouts.
                    Currently showing placeholder data.
                </AlertDescription>
            </Alert>

            {/* Leaderboard */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    {leaderboardData.length === 0 ? (
                        <div className="text-center py-12">
                            <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Data Yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Complete workouts to appear on the leaderboard.
                            </p>
                        </div>
                    ) : (
                        leaderboardData.map((entry, index) => (
                            <LeaderboardCard
                                key={entry.userId}
                                rank={index + 1}
                                profile={entry.profile}
                                stats={entry.stats}
                                isCurrentUser={entry.userId === user?.id}
                            />
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
