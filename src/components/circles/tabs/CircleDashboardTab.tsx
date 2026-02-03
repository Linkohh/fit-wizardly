/**
 * Circle Dashboard Tab
 *
 * The "Home" view for a circle.
 * Displays high-level stats, active challenge progress, and quick actions.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Trophy,
    Flame,
    Target,
    ArrowRight,
    Dumbbell,
    Users,
    Calendar
} from "lucide-react";
import { useCircle } from "../CircleContext";
import { useCircleStore } from "@/stores/circleStore";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "react-router-dom";


export function CircleDashboardTab() {
    const { circle, isMember: _isMember } = useCircle();
    const { user } = useAuthStore();
    const { challenges } = useCircleStore();

    // Get active challenge (if any)
    const activeChallenge = challenges.find(c => {
        const now = new Date();
        return new Date(c.start_date) <= now && new Date(c.end_date) >= now;
    });

    // Calculate generic stats (placeholder for now until we have aggregated stats)
    const memberCount = circle.member_count || 0;
    // Mock check for "am I active this week?"
    const _isActiveThisWeek = true;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Streak</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3 Days</div>
                        <p className="text-xs text-muted-foreground">
                            +1 from last week
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Circle Members</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{memberCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Active community
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
                        <Target className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4/5</div>
                        <p className="text-xs text-muted-foreground">
                            Workouts completed
                        </p>
                        <Progress value={80} className="h-1 mt-2" />
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                    <CardContent className="pt-6">
                        <Button className="w-full gradient-primary shadow-lg group" asChild>
                            <Link to="/wizard">
                                <Dumbbell className="mr-2 h-4 w-4" />
                                Log Workout
                                <ArrowRight className="ml-2 h-4 w-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Main Content Area */}
                <div className="md:col-span-4 space-y-6">
                    {/* Active Challenge Banner */}
                    {activeChallenge ? (
                        <Card className="overflow-hidden border-orange-500/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Trophy className="h-24 w-24 text-orange-500" />
                            </div>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 uppercase tracking-wider">
                                        Active Challenge
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Ends {new Date(activeChallenge.end_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <CardTitle>{activeChallenge.title}</CardTitle>
                                <CardDescription>{activeChallenge.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Circle Progress</span>
                                            <span className="font-medium">65%</span>
                                        </div>
                                        <Progress value={65} className="h-2" />
                                    </div>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link to="challenges">View Leaderboard</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="py-8 text-center">
                                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                <h3 className="font-medium mb-1">No Active Challenges</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Spice things up by starting a group challenge!
                                </p>
                                <Button variant="outline" asChild>
                                    <Link to="challenges">Brows Challenges</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Activity Mini-Feed */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Recent Wins</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="feed">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Placeholder for mini feed items */}
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    Check the feed tab for the latest updates!
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Area */}
                <div className="md:col-span-3 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Your Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center font-bold text-white">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium">Member</div>
                                    <div className="text-xs text-muted-foreground">Joined recently</div>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold">0</div>
                                        <div className="text-xs text-muted-foreground">Workouts</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">0</div>
                                        <div className="text-xs text-muted-foreground">Points</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
