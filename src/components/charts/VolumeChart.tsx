import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { Flame, TrendingUp } from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import type { WorkoutLog } from '@/types/fitness';

interface VolumeChartProps {
    planId?: string;
    height?: number;
}

export function VolumeChart({ planId, height = 200 }: VolumeChartProps) {
    const { workoutLogs, preferredWeightUnit } = usePlanStore();

    // Filter and process logs
    const logs = planId
        ? workoutLogs.filter(log => log.planId === planId)
        : workoutLogs;

    // Group by week and calculate weekly totals
    const weeklyData = processLogsToWeeklyData(logs);

    if (weeklyData.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Volume Progression
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Log workouts to see your volume trend</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const formatVolume = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k`;
        }
        return value.toString();
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Volume Progression
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                        {preferredWeightUnit}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={height}>
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                        />
                        <YAxis
                            tickFormatter={formatVolume}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            width={40}
                            className="text-muted-foreground"
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-card border rounded-lg shadow-lg p-3">
                                            <p className="font-medium">{label}</p>
                                            <p className="text-primary text-lg font-bold">
                                                {formatVolume(payload[0].value as number)} {preferredWeightUnit}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {(payload[0].payload as { workouts?: number }).workouts} workouts
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="volume"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#volumeGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Summary stats */}
                {weeklyData.length >= 2 && (
                    <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                        <div className="text-center">
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-semibold">
                                {formatVolume(weeklyData.reduce((sum, w) => sum + w.volume, 0))} {preferredWeightUnit}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground">Trend</p>
                            <p className={`font-semibold ${weeklyData[weeklyData.length - 1].volume > weeklyData[0].volume
                                    ? 'text-green-600'
                                    : 'text-orange-600'
                                }`}>
                                {weeklyData[weeklyData.length - 1].volume > weeklyData[0].volume ? '↑' : '↓'}
                                {' '}
                                {Math.abs(
                                    ((weeklyData[weeklyData.length - 1].volume - weeklyData[0].volume) /
                                        weeklyData[0].volume * 100)
                                ).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Helper function to process logs into weekly data points
function processLogsToWeeklyData(logs: WorkoutLog[]): Array<{
    week: number;
    label: string;
    volume: number;
    workouts: number;
}> {
    if (logs.length === 0) return [];

    // Sort logs by date
    const sortedLogs = [...logs].sort(
        (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    // Group by week
    const weekMap = new Map<number, { volume: number; workouts: number }>();

    const firstDate = new Date(sortedLogs[0].completedAt);
    const firstWeekStart = new Date(firstDate);
    firstWeekStart.setDate(firstDate.getDate() - firstDate.getDay());
    firstWeekStart.setHours(0, 0, 0, 0);

    sortedLogs.forEach(log => {
        const logDate = new Date(log.completedAt);
        const weekNumber = Math.floor(
            (logDate.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
        ) + 1;

        const existing = weekMap.get(weekNumber) || { volume: 0, workouts: 0 };
        existing.volume += log.totalVolume;
        existing.workouts += 1;
        weekMap.set(weekNumber, existing);
    });

    // Convert to array
    return Array.from(weekMap.entries())
        .map(([week, data]) => ({
            week,
            label: `Week ${week}`,
            volume: Math.round(data.volume),
            workouts: data.workouts,
        }))
        .sort((a, b) => a.week - b.week);
}
