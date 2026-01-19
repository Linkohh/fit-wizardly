import { useState, useEffect } from 'react';
import { Calculator, Dumbbell, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function OneRepMaxCalculator() {
    const [weight, setWeight] = useState<string>('');
    const [reps, setReps] = useState<string>('');
    const [oneRepMax, setOneRepMax] = useState<number | null>(null);

    const calculateMax = () => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);

        if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) {
            setOneRepMax(null);
            return;
        }

        // Epley Formula: 1RM = w * (1 + r/30)
        // Brzycki Formula: 1RM = w * (36 / (37 - r))
        // We'll use Epley as a balanced standard for general pop
        const epley = w * (1 + r / 30);
        setOneRepMax(Math.round(epley));
    };

    // Auto-calculate when inputs change if valid
    useEffect(() => {
        if (weight && reps) {
            calculateMax();
        } else {
            setOneRepMax(null);
        }
    }, [weight, reps]);

    const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50];

    return (
        <Card className="w-full max-w-md mx-auto border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Calculator className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle>1-Rep Max Calculator</CardTitle>
                </div>
                <CardDescription>
                    Estimate your max strength to determine training loads for NASM Phase 4 implementation.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="weight" className="flex items-center gap-2">
                            <Dumbbell className="w-3.5 h-3.5" />
                            Weight (lbs/kg)
                        </Label>
                        <Input
                            id="weight"
                            type="number"
                            placeholder="e.g. 135"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="text-lg font-semibold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reps" className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reps Performed
                        </Label>
                        <Input
                            id="reps"
                            type="number"
                            placeholder="e.g. 5"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            className="text-lg font-semibold"
                        />
                    </div>
                </div>

                {oneRepMax !== null && (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-top-2">
                        <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/10">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Estimated 1RM</p>
                            <div className="text-4xl font-bold text-foreground tabular-nums">
                                {oneRepMax}
                                <span className="text-lg font-normal text-muted-foreground ml-1">lbs</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-foreground border-b pb-2">Load Percentages</h4>
                            <div className="grid grid-cols-5 gap-2 text-center text-sm">
                                {percentages.map((pct) => (
                                    <div key={pct} className={cn(
                                        "p-2 rounded-lg border",
                                        pct >= 85 ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400" :
                                            pct >= 70 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                                                "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                                    )}>
                                        <div className="font-bold">{pct}%</div>
                                        <div className="text-xs opacity-80 tabular-nums">{Math.round(oneRepMax * (pct / 100))}</div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center pt-2">
                                *Phase 4 (Max Strength) requires 85-100% load
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
