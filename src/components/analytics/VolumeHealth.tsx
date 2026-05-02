import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { usePlanStore } from '@/stores/planStore';
import { Activity, AlertTriangle } from 'lucide-react';
import { MuscleGroup } from '@/types/fitness';
import { getMRVForMuscle } from '@/lib/progressionEngine';
import { formatIdentifierLabel } from '@/lib/displayText';

export function VolumeHealth() {
    const { workoutLogs, currentPlan } = usePlanStore();

    const data = useMemo(() => {
        if (!currentPlan) return [];

        const muscleSets = new Map<MuscleGroup, number>();

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentLogs = workoutLogs.filter(log => new Date(log.completedAt) >= oneWeekAgo);

        recentLogs.forEach(log => {
            log.exercises.forEach(exLog => {
                if (exLog.skipped) return;

                let muscles: MuscleGroup[] = [];

                for (const day of currentPlan.workoutDays) {
                    const found = day.exercises.find(e => e.exercise.id === exLog.exerciseId);
                    if (found) {
                        muscles = found.exercise.primaryMuscles;
                        break;
                    }
                }

                if (muscles.length > 0) {
                    const completedSets = exLog.sets.filter(s => s.completed).length;

                    muscles.forEach(m => {
                        const current = muscleSets.get(m) || 0;
                        muscleSets.set(m, current + completedSets);
                    });
                }
            });
        });

        // Convert to array and sort by volume
        return Array.from(muscleSets.entries())
            .map(([name, sets]) => ({ name, label: formatIdentifierLabel(name), sets }))
            .sort((a, b) => b.sets - a.sets)
            .slice(0, 8);
    }, [workoutLogs, currentPlan]);

    const getBarColor = (muscleName: MuscleGroup, sets: number) => {
        const mrv = getMRVForMuscle(muscleName);
        if (mrv && sets > mrv) return 'hsl(0 72% 51%)'; // Above MRV
        if (mrv && sets >= Math.round(mrv * 0.7)) return 'hsl(158 64% 52%)'; // High productive range
        return 'hsl(45 93% 47%)'; // Below productive range
    };

    const hasOverreaching = data.some((d) => {
        const mrv = getMRVForMuscle(d.name);
        return mrv ? d.sets > mrv : false;
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            whileHover={{ y: -2 }}
        >
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
                        <div className="flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Volume above target
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full mt-4 sm:h-[320px]">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 24, left: 18, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="label"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    width={92}
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
                                            formatIdentifierLabel(muscle),
                                        ];
                                    }}
                                />
                                <Bar dataKey="sets" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.name, entry.sets)} />
                                    ))}
                                </Bar>
                                <ReferenceLine x={10} stroke="hsl(158 64% 52%)" strokeDasharray="3 3" label={{ value: 'Min Effective', position: 'insideBottom', fill: 'hsl(158 64% 52%)', fontSize: 10 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/25 px-6 text-center text-muted-foreground">
                            <Activity className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">Log current-plan sets to see which muscle groups are getting enough work.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
        </motion.div>
    );
}
