import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Dumbbell, TrendingUp, Info } from 'lucide-react';
import { useCircleStore } from '@/stores/circleStore';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CircleLeaderboardTab() {
    const { getLeaderboard } = useCircleStore();
    const [period, setPeriod] = useState<'week' | 'month' | 'all-time'>('week');

    const leaderboardData = getLeaderboard(period);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Leaderboard
                            </CardTitle>
                            <CardDescription>
                                See who's crushing it this {period === 'all-time' ? 'time' : period}
                            </CardDescription>
                        </div>

                        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-[300px]">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="week">Weekly</TabsTrigger>
                                <TabsTrigger value="month">Monthly</TabsTrigger>
                                <TabsTrigger value="all-time">All Time</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4">
                {leaderboardData.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No enough data to show leaderboard yet.</p>
                            <p className="text-sm">Start logging workouts!</p>
                        </CardContent>
                    </Card>
                ) : (
                    leaderboardData.map((user, index) => (
                        <Card key={user.userId} className={`
                            transition-all hover:shadow-md
                            ${index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''}
                            ${index === 1 ? 'border-slate-400/50 bg-slate-400/5' : ''}
                            ${index === 2 ? 'border-orange-500/50 bg-orange-500/5' : ''}
                        `}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className={`
                                    flex h-8 w-8 items-center justify-center rounded-full font-bold
                                    ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                                    ${index === 1 ? 'bg-slate-400 text-white' : ''}
                                    ${index === 2 ? 'bg-orange-500 text-white' : ''}
                                    ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                                `}>
                                    {index + 1}
                                </div>

                                <Avatar className="h-10 w-10 border-2 border-background">
                                    <AvatarImage src={user.avatarUrl || undefined} />
                                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate">
                                            {user.displayName}
                                        </p>
                                        {index === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        Last active: {user.lastActive.getTime() === 0 ? 'Never' : user.lastActive.toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-right">
                                    <div>
                                        <div className="text-lg font-bold flex items-center justify-end gap-1">
                                            {user.workouts}
                                            <Dumbbell className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Workouts</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="text-lg font-bold flex items-center justify-end gap-1">
                                            {(user.volume / 1000).toFixed(1)}k
                                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Volume</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Leaderboard stats update automatically as circle members log workouts.
                </AlertDescription>
            </Alert>
        </div>
    );
}
