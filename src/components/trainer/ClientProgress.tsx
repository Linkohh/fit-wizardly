import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, BarChart, Bar } from "recharts";
import { TrendingUp, Dumbbell, Ruler, Activity } from "lucide-react";

// Mock data generators for realistic looks
const generateVolumeData = () => {
    const data = [];
    let volume = 12000;
    for (let i = 0; i < 12; i++) {
        volume += Math.floor(Math.random() * 2000) - 500;
        data.push({
            week: `Week ${i + 1}`,
            volume: volume,
            workouts: Math.floor(Math.random() * 2) + 2 // 2-4 workouts
        });
    }
    return data;
};

const generateStrengthData = () => {
    const data = [];
    let bench = 135;
    let squat = 185;
    let deadlift = 225;
    for (let i = 0; i < 12; i++) {
        bench += Math.random() > 0.3 ? 2.5 : 0;
        squat += Math.random() > 0.3 ? 5 : 0;
        deadlift += Math.random() > 0.3 ? 5 : 0;
        data.push({
            week: `Week ${i + 1}`,
            bench: Math.round(bench),
            squat: Math.round(squat),
            deadlift: Math.round(deadlift)
        });
    }
    return data;
};

const generateWeightData = () => {
    const data = [];
    let weight = 185;
    for (let i = 0; i < 12; i++) {
        weight -= Math.random() * 0.5;
        data.push({
            date: `Week ${i + 1}`,
            weight: Number(weight.toFixed(1))
        });
    }
    return data;
};

const volumeData = generateVolumeData();
const strengthData = generateStrengthData();
const weightData = generateWeightData();

export function ClientProgress() {
    return (
        <div className="space-y-6">
            {/* Summary Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">48,250 lbs</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-500 font-medium flex items-center inline-block">
                                +12.5% <TrendingUp className="h-3 w-3 ml-1 inline" />
                            </span>{" "}
                            from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Consistency</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92%</div>
                        <p className="text-xs text-muted-foreground">
                            Workout completion rate
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{weightData[weightData.length - 1].weight} lbs</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-500 font-medium flex items-center inline-block">
                                -4.2 lbs <TrendingUp className="h-3 w-3 ml-1 inline rotate-180" />
                            </span>{" "}
                            last 12 weeks
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="volume" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="volume">Volume Load</TabsTrigger>
                    <TabsTrigger value="strength">Strength Est.</TabsTrigger>
                    <TabsTrigger value="body">Body Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="volume">
                    <Card>
                        <CardHeader>
                            <CardTitle>Training Volume</CardTitle>
                            <CardDescription>Weekly tonnage lifted across all exercises</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="week"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="volume"
                                        stroke="hsl(var(--primary))"
                                        fillOpacity={1}
                                        fill="url(#colorVolume)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="strength">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estimated 1RM Trends</CardTitle>
                            <CardDescription>Projected max strength for key compound lifts</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={strengthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="week"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Line type="monotone" dataKey="squat" name="Squat" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="deadlift" name="Deadlift" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="bench" name="Bench Press" stroke="#ec4899" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="body">
                    <Card>
                        <CardHeader>
                            <CardTitle>Body Weight Trend</CardTitle>
                            <CardDescription>Weekly average body weight</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weightData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={['dataMin - 2', 'dataMax + 2']}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: 'hsl(var(--primary))' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
