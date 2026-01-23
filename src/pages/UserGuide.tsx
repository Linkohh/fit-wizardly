import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Trophy, Users, Dumbbell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserGuide() {
    return (
        <main className="container max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">How to Use FitWizardly</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Everything you need to know about your new AI-powered fitness companion.
                </p>
            </div>

            <Tabs defaultValue="workouts" className="space-y-8">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1 bg-muted/50 gap-1 rounded-xl">
                    <TabsTrigger value="workouts" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 rounded-lg">
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Workouts & Logging
                    </TabsTrigger>
                    <TabsTrigger value="wisdom" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 rounded-lg">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Wisdom AI Coach
                    </TabsTrigger>
                    <TabsTrigger value="circles" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 rounded-lg">
                        <Users className="h-4 w-4 mr-2" />
                        Social Circles
                    </TabsTrigger>
                </TabsList>

                {/* WORKOUTS SECTION */}
                <TabsContent value="workouts" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Dumbbell className="h-6 w-6 text-primary" />
                                Tracking Your Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">1. Starting a Workout</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Go to the <strong>View Plan</strong> page. On your current training day, click the "Start Workout" button. This launches the active logging session.
                                    </p>

                                    <h3 className="font-semibold text-lg mb-2">2. Logging Sets</h3>
                                    <p className="text-muted-foreground mb-4">
                                        For each exercise, enter your <strong>Weight</strong> and <strong>Reps</strong>.
                                        Set your <strong>RIR (Reps in Reserve)</strong> to track intensity.
                                        <br />
                                        <em>Tip: 0 RIR means you couldn't do another rep. 2 RIR means you could do 2 more.</em>
                                    </p>
                                </div>
                                <div className="bg-muted p-4 rounded-xl flex items-center justify-center">
                                    {/* Placeholder for visual or component preview */}
                                    <div className="text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-3">
                                            <Trophy className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="font-medium">Automatic PR Tracking</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            FitWizardly automatically detects when you hit a new Personal Record for volume or 1RM.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-lg mb-2">Smart Progressions</h3>
                                <p className="text-muted-foreground">
                                    At the end of each week, the <strong>Weekly Review</strong> will analyze your performance.
                                    If you see a <span className="text-green-500 font-medium">green arrow</span> next to an exercise,
                                    our systems recommend increasing the weight for your next session.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-center">
                        <Button asChild className="gradient-primary text-white">
                            <Link to="/plan">Go to My Plan <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </TabsContent>


                {/* WISDOM AI SECTION */}
                <TabsContent value="wisdom" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-6 w-6 text-purple-500" />
                                Your AI Coach
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">How to Access</h3>
                                    <p className="text-muted-foreground mb-4">
                                        On the <strong>View Plan</strong> page, look for the floating purple bubble ✨ in the bottom right corner.
                                        Click it to open the Wisdom Chat.
                                    </p>

                                    <h3 className="font-semibold text-lg mb-2">What to Ask</h3>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-1">
                                        <li>"Why am I doing 12 reps?"</li>
                                        <li>"What muscles does this exercise work?"</li>
                                        <li>"Explain 'Stabilization Endurance' phase"</li>
                                    </ul>
                                </div>
                                <div className="bg-muted/50 p-6 rounded-xl">
                                    <h4 className="font-medium mb-2">Knowledge Level</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        The more you ask, the more you learn! Unlock badges like <strong>Exercise Scientist</strong> as you discover new concepts.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">Novice</span>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">Apprentice</span>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">Scholar</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-center">
                        <Button asChild variant="outline">
                            <Link to="/plan">Try Wisdom AI <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </TabsContent>


                {/* CIRCLES SECTION */}
                <TabsContent value="circles" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6 text-blue-500" />
                                Accountability Circles
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
                                    <p className="text-muted-foreground mb-4">
                                        1. Go to the <strong>Circles</strong> page.<br />
                                        2. Click "Sign In" and enter your email.<br />
                                        3. Click the magic link sent to your inbox.
                                    </p>

                                    <h3 className="font-semibold text-lg mb-2">Creating & Joining</h3>
                                    <p className="text-muted-foreground mb-4">
                                        <strong>Create a Circle</strong> to invite friends. You'll get a unique code (e.g., AB12CD).<br />
                                        <strong>Join a Circle</strong> by entering a code your friend shares with you.
                                    </p>
                                </div>
                                <div className="bg-muted/50 p-6 rounded-xl">
                                    <h4 className="font-medium mb-2">Activity Feed</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        When you complete a workout or hit a PR, it automatically posts to your circles!
                                        Encourage your friends and compete on the leaderboards.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        *Requires internet connection and successful sign-in.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-center">
                        <Button asChild className="gradient-primary text-white">
                            <Link to="/circles">Go to Circles <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </TabsContent>

            </Tabs>
        </main>
    );
}
