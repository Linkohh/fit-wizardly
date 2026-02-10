import { useState } from 'react';
import { useMeasurementsStore } from '@/stores/measurementsStore';
import { BodyMeasurement } from '@/types/fitness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Plus, Trash2, Ruler } from 'lucide-react';

export function BodyTracker() {
    const { measurements, addMeasurement, deleteMeasurement, getHistoryByField } = useMeasurementsStore();
    const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [chest, setChest] = useState('');
    const [waist, setWaist] = useState('');
    const [hips, setHips] = useState('');
    const [arms, setArms] = useState('');
    const [thighs, setThighs] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newMeasurement: BodyMeasurement = {
            id: Math.random().toString(36).substr(2, 9),
            date,
            unit: 'imperial', // Defaulting to imperial for now, should come from user prefs
            weight: weight ? Number(weight) : undefined,
            bodyFat: bodyFat ? Number(bodyFat) : undefined,
            chest: chest ? Number(chest) : undefined,
            waist: waist ? Number(waist) : undefined,
            hips: hips ? Number(hips) : undefined,
            arms: arms ? Number(arms) : undefined,
            thighs: thighs ? Number(thighs) : undefined,
        };
        addMeasurement(newMeasurement);
        // Reset form
        setWeight('');
        setBodyFat('');
        setActiveTab('history');
    };

    const weightHistory = getHistoryByField('weight');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Ruler className="w-6 h-6 text-primary" />
                    Body Tracker
                </h2>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="log">Log New</TabsTrigger>
                    <TabsTrigger value="history">History & Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="log">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Measurement Entry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="weight">Weight (lbs)</Label>
                                        <Input
                                            id="weight"
                                            type="number"
                                            step="0.1"
                                            placeholder="0.0"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bodyFat">Body Fat (%)</Label>
                                        <Input
                                            id="bodyFat"
                                            type="number"
                                            step="0.1"
                                            placeholder="0.0"
                                            value={bodyFat}
                                            onChange={(e) => setBodyFat(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="text-sm font-medium text-muted-foreground pt-2">Circumference (in)</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="chest">Chest</Label>
                                        <Input id="chest" type="number" step="0.25" value={chest} onChange={(e) => setChest(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="waist">Waist</Label>
                                        <Input id="waist" type="number" step="0.25" value={waist} onChange={(e) => setWaist(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hips">Hips</Label>
                                        <Input id="hips" type="number" step="0.25" value={hips} onChange={(e) => setHips(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="arms">Arms</Label>
                                        <Input id="arms" type="number" step="0.25" value={arms} onChange={(e) => setArms(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="thighs">Thighs</Label>
                                        <Input id="thighs" type="number" step="0.25" value={thighs} onChange={(e) => setThighs(e.target.value)} />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full gradient-primary mt-4">
                                    <Plus className="w-4 h-4 mr-2" /> Save Log
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <div className="space-y-6">
                        {/* Chart */}
                        {weightHistory.length > 1 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Weight Trend</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={weightHistory}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            />
                                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['auto', 'auto']} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={2}
                                                dot={{ fill: 'hsl(var(--primary))' }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* List */}
                        <div className="space-y-3">
                            {measurements.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl glass-card border border-border/50">
                                    <div>
                                        <div className="font-semibold">{format(new Date(entry.date), 'MMMM d, yyyy')}</div>
                                        <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                                            {entry.weight && <span>{entry.weight} lbs</span>}
                                            {entry.bodyFat && <span>{entry.bodyFat}% BF</span>}
                                            {entry.waist && <span>Waist: {entry.waist}"</span>}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => deleteMeasurement(entry.id)} className="text-muted-foreground hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {measurements.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    No measurements logged yet.
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
