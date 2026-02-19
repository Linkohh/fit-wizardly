import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { usePlanStore } from '@/stores/planStore';
import { Activity, AlertTriangle } from 'lucide-react';
import { MuscleGroup } from '@/types/fitness';
import { getMRVForMuscle } from '@/lib/progressionEngine';

export function VolumeHealth() {
    const { workoutLogs, currentPlan, currentWeek } = usePlanStore();

    // Calculate sets per muscle group for the CURRENT WEEK
    const data = useMemo(() => {
        if (!currentPlan) return [];

        const muscleSets = new Map<MuscleGroup, number>();

        // Filter logs for current week
        // Assuming logs have a clear way to determine week, or we filter by date relative to plan start
        // For simplicity/robustness in this demo, let's look at the last 7 days of logs
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentLogs = workoutLogs.filter(log => new Date(log.completedAt) >= oneWeekAgo);

        recentLogs.forEach(log => {
            log.exercises.forEach(exLog => {
                if (exLog.skipped) return;

                // Find muscle group for this exercise
                // We need to look up the exercise definition. 
                // In a real app, exerciseLog might snapshot the muscle group, or we lookup.
                // Fallback: try to find it in the current plan's days
                let muscles: MuscleGroup[] = [];

                for (const day of currentPlan.workoutDays) {
                    const found = day.exercises.find(e => e.exercise.id === exLog.exerciseId);
                    if (found) {
                        muscles = found.exercise.primaryMuscles;
                        break;
                    }
                }

                if (muscles.length > 0) {
                    // Count completed sets
                    const completedSets = exLog.sets.filter(s => s.completed).length;

                    // Distribute sets to primary muscles (fractional or full? usually full count for primary)
                    muscles.forEach(m => {
                        const current = muscleSets.get(m) || 0;
                        muscleSets.set(m, current + completedSets);
                    });
                }
            });
        });

        // Convert to array and sort by volume
        return Array.from(muscleSets.entries())
            .map(([name, sets]) => ({ name, sets }))
            .sort((a, b) => b.sets - a.sets)
            // Top 8 active muscles to keep chart clean
            .slice(0, 8);
    }, [workoutLogs, currentPlan]);

    const getBarColor = (muscleName: MuscleGroup, sets: number) => {
        const mrv = getMRVForMuscle(muscleName);
        if (mrv && sets > mrv) return '#ef4444'; // Above MRV
        if (mrv && sets >= Math.round(mrv * 0.7)) return '#10b981'; // High productive range
        return '#eab308'; // Below productive range
    };

    const hasOverreaching = data.some((d) => {
        const mrv = getMRVForMuscle(d.name);
        return mrv ? d.sets > mrv : false;
    });

    return (
        <Card variant="glass" className="col-span-1 lg:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="gradient-text flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Volume Health (Weekly)
                        </CardTitle>
                        <CardDescription>Target: 10-20 sets per muscle/week for growth.</CardDescription>
                    </div>
                    {hasOverreaching && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            High Systemic Fatigue
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    width={80}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card)/0.9)',
                                        borderColor: 'hsl(var(--border))',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '8px',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    formatter={(value, _name, props) => {
                                        const muscle = props.payload?.name as MuscleGroup;
                                        const mrv = getMRVForMuscle(muscle);
                                        return [
                                            `${value} sets${mrv ? ` (MRV ${mrv})` : ''}`,
                                            muscle.replaceAll('_', ' '),
                                        ];
                                    }}
                                />
                                <Bar dataKey="sets" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.name, entry.sets)} />
                                    ))}
                                </Bar>
                                <ReferenceLine x={10} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Min Effective', position: 'insideBottom', fill: '#10b981', fontSize: 10 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Activity className="w-12 h-12 mb-2 opacity-20" />
                            <p>No volume data for this week.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
