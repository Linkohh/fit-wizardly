import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useReadinessStore } from '@/stores/readinessStore';
import { Brain, Battery, Activity, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ReadinessModal() {
    const { hasLoggedToday, logReadiness } = useReadinessStore();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0); // 0: Input, 1: Result

    // Metrics state
    const [sleep, setSleep] = useState([7]);
    const [soreness, setSoreness] = useState([3]);
    const [stress, setStress] = useState([3]);
    const [energy, setEnergy] = useState([7]);

    useEffect(() => {
        // Check if logged today on mount
        const logged = hasLoggedToday();
        if (!logged) {
            // Small delay to not overwhelm user immediately on load
            const timer = setTimeout(() => setOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [hasLoggedToday]);

    const handleSubmit = () => {
        const metrics = {
            sleep: sleep[0],
            soreness: soreness[0],
            stress: stress[0],
            energy: energy[0]
        };
        logReadiness(metrics);
        setStep(1); // Show result
    };

    const handleClose = () => {
        setOpen(false);
        // Reset for next time (though won't show today)
        setTimeout(() => setStep(0), 500);
    };

    const calculateScore = () => {
        const sleepScore = sleep[0];
        const energyScore = energy[0];
        const sorenessScore = 11 - soreness[0];
        const stressScore = 11 - stress[0];
        const average = (sleepScore + energyScore + sorenessScore + stressScore) / 4;
        return Math.round(average * 10);
    };

    const score = calculateScore();

    const getVerdict = (s: number) => {
        if (s >= 85) return { text: "Peak Performance", color: "text-emerald-500" };
        if (s >= 70) return { text: "Ready to Train", color: "text-blue-500" };
        if (s >= 50) return { text: "Proceed with Caution", color: "text-yellow-500" };
        return { text: "Active Recovery", color: "text-red-500" };
    };

    const verdict = getVerdict(score);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-[425px] glass-card border-primary/20">
                <AnimatePresence mode="wait">
                    {step === 0 ? (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                    Daily Check-in
                                </DialogTitle>
                                <DialogDescription>
                                    Track your recovery to optimize your training.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-2">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="flex items-center gap-2"><Moon className="w-4 h-4 text-indigo-400" /> Sleep Quality</Label>
                                        <span className="text-sm font-medium text-muted-foreground">{sleep[0]}/10</span>
                                    </div>
                                    <Slider value={sleep} onValueChange={setSleep} min={1} max={10} step={1} className="[&>.range]:bg-indigo-500" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="flex items-center gap-2"><Activity className="w-4 h-4 text-red-400" /> Muscle Soreness</Label>
                                        <span className="text-sm font-medium text-muted-foreground">{soreness[0]}/10</span>
                                    </div>
                                    <Slider value={soreness} onValueChange={setSoreness} min={1} max={10} step={1} className="[&>.range]:bg-red-500" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="flex items-center gap-2"><Brain className="w-4 h-4 text-yellow-400" /> Stress Level</Label>
                                        <span className="text-sm font-medium text-muted-foreground">{stress[0]}/10</span>
                                    </div>
                                    <Slider value={stress} onValueChange={setStress} min={1} max={10} step={1} className="[&>.range]:bg-yellow-500" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="flex items-center gap-2"><Battery className="w-4 h-4 text-green-400" /> Energy Level</Label>
                                        <span className="text-sm font-medium text-muted-foreground">{energy[0]}/10</span>
                                    </div>
                                    <Slider value={energy} onValueChange={setEnergy} min={1} max={10} step={1} className="[&>.range]:bg-green-500" />
                                </div>
                            </div>

                            <Button onClick={handleSubmit} className="w-full gradient-primary shadow-glow">
                                Generate Readiness Score
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 py-4"
                        >
                            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-muted/30"></div>
                                <div
                                    className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-slow"
                                    style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
                                ></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl font-bold gradient-text">{score}</span>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Ready</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className={cn("text-2xl font-bold", verdict.color)}>{verdict.text}</h3>
                                <p className="text-muted-foreground text-sm">
                                    {score >= 70 ? "Your recovery is on point. Push hard today!" : "Consider a lighter session or active recovery today."}
                                </p>
                            </div>

                            <Button onClick={handleClose} variant="outline" className="w-full">
                                Close
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
