import React, { useState, useEffect } from 'react';
import { Calculator, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PlateCalculatorProps {
    initialWeight?: number;
    weightUnit?: 'lbs' | 'kg';
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

interface Plate {
    weight: number;
    color: string;
    count: number;
    height: number; // visual height relative to 45lb plate
}

const PLATES_LBS = [
    { weight: 45, color: '#3b82f6', height: 100 }, // Blue
    { weight: 35, color: '#eab308', height: 90 },  // Yellow
    { weight: 25, color: '#22c55e', height: 80 },  // Green
    { weight: 10, color: '#f8fafc', height: 60 },  // White/Grey
    { weight: 5, color: '#ef4444', height: 45 },   // Red - small
    { weight: 2.5, color: '#000000', height: 35 }, // Black - micro
];

const PLATES_KG = [
    { weight: 25, color: '#ef4444', height: 100 }, // Red
    { weight: 20, color: '#3b82f6', height: 100 }, // Blue
    { weight: 15, color: '#eab308', height: 90 },  // Yellow
    { weight: 10, color: '#22c55e', height: 80 },  // Green
    { weight: 5, color: '#f8fafc', height: 60 },   // White
    { weight: 2.5, color: '#000000', height: 45 }, // Black
    { weight: 1.25, color: '#94a3b8', height: 35 },// Silver
];

export function PlateCalculator({
    initialWeight = 45,
    weightUnit = 'lbs',
    isOpen,
    onOpenChange
}: PlateCalculatorProps) {
    const [targetWeight, setTargetWeight] = useState<string>(initialWeight.toString());
    const [barWeight, setBarWeight] = useState<number>(weightUnit === 'lbs' ? 45 : 20);
    const [plates, setPlates] = useState<Plate[]>([]);
    const [remainder, setRemainder] = useState<number>(0);

    // Re-calculate when inputs change
    useEffect(() => {
        calculatePlates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetWeight, barWeight, weightUnit]);

    // Update local state if prop changes (e.g. opening with a new value)
    useEffect(() => {
        if (initialWeight) setTargetWeight(initialWeight.toString());
    }, [initialWeight]);

    // Default bar weight adjustment if unit swaps
    useEffect(() => {
        if (weightUnit === 'lbs' && barWeight === 20) setBarWeight(45);
        if (weightUnit === 'kg' && barWeight === 45) setBarWeight(20);
    }, [weightUnit, barWeight]);

    const calculatePlates = () => {
        const target = parseFloat(targetWeight);
        if (isNaN(target) || target < barWeight) {
            setPlates([]);
            setRemainder(0);
            return;
        }

        let weightPerSide = (target - barWeight) / 2;
        const availablePlates = weightUnit === 'lbs' ? PLATES_LBS : PLATES_KG;
        const result: Plate[] = [];

        // Greedy algorithm for plate matching
        for (const plate of availablePlates) {
            const count = Math.floor(weightPerSide / plate.weight);
            if (count > 0) {
                result.push({ ...plate, count });
                weightPerSide -= count * plate.weight;
            }
        }

        setPlates(result);
        setRemainder(weightPerSide * 2); // Remainder is total (both sides)
    };

    const handleBarChange = (value: string) => {
        setBarWeight(parseInt(value));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Target Weight ({weightUnit})</Label>
                    <Input
                        type="number"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        className="text-lg font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Bar Weight</Label>
                    <ToggleGroup type="single" value={barWeight.toString()} onValueChange={(val) => val && handleBarChange(val)}>
                        <ToggleGroupItem value={weightUnit === 'lbs' ? "45" : "20"} className="flex-1">
                            {weightUnit === 'lbs' ? "45" : "20"}
                        </ToggleGroupItem>
                        <ToggleGroupItem value={weightUnit === 'lbs' ? "35" : "15"} className="flex-1">
                            {weightUnit === 'lbs' ? "35" : "15"}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            {/* Visualizer */}
            <div className="relative h-48 bg-secondary/30 rounded-lg flex items-center justify-center overflow-hidden border border-border/50">
                {/* Barbell Bar */}
                <div className="absolute w-full h-4 bg-zinc-400 dark:bg-zinc-600 z-0" />

                {/* Barbell Sleeve Stop */}
                <div className="absolute left-[10%] h-16 w-3 bg-zinc-500 dark:bg-zinc-500 z-10 rounded-sm" />

                {/* Plates */}
                <div className="absolute left-[10%] ml-4 flex items-center gap-[2px] z-20 h-full">
                    <AnimatePresence>
                        {plates.flatMap((plate, typeIdx) =>
                            Array.from({ length: plate.count }).map((_, i) => (
                                <motion.div
                                    key={`${plate.weight}-${i}`}
                                    initial={{ x: 50, opacity: 0, scaleY: 0.5 }}
                                    animate={{ x: 0, opacity: 1, scaleY: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25,
                                        delay: (typeIdx * 0.05) + (i * 0.05)
                                    }}
                                    className="w-4 sm:w-6 border-l border-r border-black/10 shadow-lg relative"
                                    style={{
                                        height: `${plate.height}%`,
                                        backgroundColor: plate.color,
                                    }}
                                >
                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-black/70 -rotate-90 whitespace-nowrap">
                                        {plate.weight}
                                    </span>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Remainder Warning */}
                {remainder > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded text-xs">
                        ⚠️ +{remainder.toFixed(1)} {weightUnit} needed
                    </div>
                )}
            </div>

            {/* Text Summary */}
            <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Per Side</h3>
                {plates.length === 0 ? (
                    <p className="text-muted-foreground italic">Enter a weight (min {barWeight})</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {plates.map((plate) => (
                            <div key={plate.weight} className="flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md shadow-sm">
                                <span className="font-bold text-lg">{plate.count}</span>
                                <span className="text-muted-foreground text-xs">x</span>
                                <span className="font-medium">{plate.weight}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export const PlateCalculatorDialog = ({
    initialWeight,
    weightUnit
}: {
    initialWeight: number,
    weightUnit: 'lbs' | 'kg'
}) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Calculator className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Plate Calculator</DialogTitle>
                </DialogHeader>
                <PlateCalculator initialWeight={initialWeight} weightUnit={weightUnit} />
            </DialogContent>
        </Dialog>
    )
}
