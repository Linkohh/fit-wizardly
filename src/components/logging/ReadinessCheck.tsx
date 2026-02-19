import { useMemo, useState } from 'react';
import { Battery, Brain, Moon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useReadinessStore } from '@/stores/readinessStore';
import type { ReadinessEntry, ReadinessRating } from '@/types/readiness';

interface ReadinessCheckProps {
    onComplete: (entry: ReadinessEntry) => void;
    onSkip: () => void;
}

export function ReadinessCheck({ onComplete, onSkip }: ReadinessCheckProps) {
    const { logReadiness } = useReadinessStore();
    const [sleepQuality, setSleepQuality] = useState<ReadinessRating>(3);
    const [muscleSoreness, setMuscleSoreness] = useState<ReadinessRating>(2);
    const [energyLevel, setEnergyLevel] = useState<ReadinessRating>(3);
    const [stressLevel, setStressLevel] = useState<ReadinessRating>(2);

    const projectedScore = useMemo(() => {
        const score = (sleepQuality + energyLevel + (6 - muscleSoreness) + (6 - stressLevel)) / 4;
        return Number(score.toFixed(2));
    }, [sleepQuality, muscleSoreness, energyLevel, stressLevel]);

    const handleSubmit = () => {
        const entry = logReadiness({
            sleepQuality,
            muscleSoreness,
            energyLevel,
            stressLevel,
        });
        onComplete(entry);
    };

    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Daily Readiness Check
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Quick check-in before training. Takes less than 10 seconds.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><Moon className="h-4 w-4 text-indigo-500" /> Sleep Quality</Label>
                                <span className="text-sm text-muted-foreground">{sleepQuality}/5</span>
                            </div>
                            <Slider
                                value={[sleepQuality]}
                                min={1}
                                max={5}
                                step={1}
                                onValueChange={(value) => setSleepQuality(value[0] as ReadinessRating)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><Battery className="h-4 w-4 text-emerald-500" /> Energy Level</Label>
                                <span className="text-sm text-muted-foreground">{energyLevel}/5</span>
                            </div>
                            <Slider
                                value={[energyLevel]}
                                min={1}
                                max={5}
                                step={1}
                                onValueChange={(value) => setEnergyLevel(value[0] as ReadinessRating)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><Zap className="h-4 w-4 text-orange-500" /> Muscle Soreness</Label>
                                <span className="text-sm text-muted-foreground">{muscleSoreness}/5</span>
                            </div>
                            <Slider
                                value={[muscleSoreness]}
                                min={1}
                                max={5}
                                step={1}
                                onValueChange={(value) => setMuscleSoreness(value[0] as ReadinessRating)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2"><Brain className="h-4 w-4 text-rose-500" /> Stress Level</Label>
                                <span className="text-sm text-muted-foreground">{stressLevel}/5</span>
                            </div>
                            <Slider
                                value={[stressLevel]}
                                min={1}
                                max={5}
                                step={1}
                                onValueChange={(value) => setStressLevel(value[0] as ReadinessRating)}
                            />
                        </div>
                    </div>

                    {projectedScore < 2.5 && (
                        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-200">
                            Consider a lighter session today — reduce volume by 20%.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button variant="outline" onClick={onSkip}>
                            Skip For Today
                        </Button>
                        <Button className="gradient-primary" onClick={handleSubmit}>
                            Start Workout
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
