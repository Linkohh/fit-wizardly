import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { usePlanStore } from '@/stores/planStore';
import { calculateOneRepMax } from '@/lib/progressionEngine';
import { format } from 'date-fns';
import { TrendingUp, Trophy } from 'lucide-react';

export function StrengthCurve() {
    const { workoutLogs, personalRecords } = usePlanStore();
    const [selectedExercise, setSelectedExercise] = useState<string>('Squat'); // Default, needs to be dynamic or 'Big 3'

    // Extract unique exercise names from logs for the filter
    const availableExercises = useMemo(() => {
        const names = new Set<string>();
        workoutLogs.forEach(log => {
            log.exercises.forEach(ex => names.add(ex.exerciseName));
        });
        return Array.from(names).sort();
    }, [workoutLogs]);

    // Calculate 1RM history for the selected exercise
    const data = useMemo(() => {
        const history: { date: string; e1rm: number; weight: number; reps: number }[] = [];

        // Sort logs by date ascending
        const sortedLogs = [...workoutLogs].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

        sortedLogs.forEach(log => {
            log.exercises.forEach(ex => {
                if (ex.exerciseName === selectedExercise) {
                    // Find best set (highest 1RM) for this workout
                    let best1RM = 0;
                    let bestSet = { weight: 0, reps: 0 };

                    ex.sets.forEach(set => {
                        if (set.completed && set.weight > 0 && set.reps > 0) {
                            const e1rm = calculateOneRepMax(set.weight, set.reps);
                            if (e1rm > best1RM) {
                                best1RM = e1rm;
                                bestSet = { weight: set.weight, reps: set.reps };
                            }
                        }
                    });

                    if (best1RM > 0) {
                        history.push({
                            date: format(new Date(log.completedAt), 'MMM d'),
                            e1rm: Math.round(best1RM),
                            weight: bestSet.weight,
                            reps: bestSet.reps
                        });
                    }
                }
            });
        });

        return history;
    }, [workoutLogs, selectedExercise]);

    // Find current PR for this exercise
    const currentPR = personalRecords.find(pr => pr.exerciseName === selectedExercise && pr.type === 'weight')?.newValue;

    return (
        <Card variant="glass" className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="gradient-text flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Strength Curve
                    </CardTitle>
                    <CardDescription>Estimated 1 Rep Max (e1RM) progression.</CardDescription>
                </div>
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger className="w-[180px] glass-card">
                        <SelectValue placeholder="Select Exercise" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableExercises.map(ex => (
                            <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                        ))}
                        {availableExercises.length === 0 && <SelectItem value="Squat">Squat (No Data)</SelectItem>}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                                        <stop offset="100%" stopColor="hsl(var(--secondary))" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
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
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card)/0.9)',
                                        borderColor: 'hsl(var(--border))',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value: number) => [`${value} lbs`, 'e1RM']}
                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                {currentPR && (
                                    <ReferenceLine
                                        y={currentPR}
                                        stroke="hsl(var(--accent))"
                                        strokeDasharray="3 3"
                                        label={{
                                            value: 'Current PR',
                                            position: 'insideTopRight',
                                            fill: 'hsl(var(--accent))',
                                            fontSize: 10
                                        }}
                                    />
                                )}
                                <Line
                                    type="monotone"
                                    dataKey="e1rm"
                                    stroke="url(#lineColor)"
                                    strokeWidth={3}
                                    dot={{ fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Trophy className="w-12 h-12 mb-2 opacity-20" />
                            <p>No log data for this exercise yet.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
