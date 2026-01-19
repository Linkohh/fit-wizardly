import { useState, useEffect } from "react";
import { Plus, Minus, Droplets, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNutritionStore } from "@/stores/nutritionStore";

export function HydrationTracker() {
    const { dailyLog, updateHydration, profile } = useNutritionStore();

    const currentAmount = dailyLog?.water || 0;
    const targetAmount = profile?.dailyWaterGoal || 2500;

    const percentage = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
    const [showConfetti, setShowConfetti] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (currentAmount >= targetAmount && currentAmount > 0 && percentage >= 100 && !showConfetti) {
            triggerCelebration();
        }
    }, [currentAmount, targetAmount]);

    const triggerCelebration = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    };

    const handleUpdate = (amount: number) => {
        setIsAdding(true);
        updateHydration(Math.max(0, currentAmount + amount));
        setTimeout(() => setIsAdding(false), 300);
    };

    return (
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-between min-h-[300px]">

            {/* Confetti Overlay */}
            {showConfetti && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                    <div className="absolute inset-0 animate-pulse bg-blue-500/20" />
                    <div className="animate-bounce text-6xl">🎉</div>
                </div>
            )}

            {/* Background Liquid Effect */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-blue-500/10 transition-all duration-1000 ease-in-out blur-3xl pointer-events-none"
                style={{ height: `${percentage}%` }}
            />

            <div className="w-full flex justify-between items-start z-10">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-400" /> Hydration
                    </h3>
                    <p className="text-sm text-muted-foreground">Goal: {targetAmount}ml</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-blue-100">{currentAmount} <span className="text-sm font-normal text-muted-foreground">ml</span></div>
                    <div className={cn("text-xs font-medium transition-colors", percentage >= 100 ? "text-green-400" : "text-blue-400")}>
                        {Math.round(percentage)}%
                    </div>
                </div>
            </div>

            {/* Center Visual */}
            <div className="relative z-10 my-6">
                <div className={cn("w-40 h-40 rounded-full border-4 flex items-center justify-center relative bg-black/20 backdrop-blur-sm transition-colors overflow-hidden", percentage >= 100 ? "border-green-500/50 shadow-glow" : "border-white/10")}>

                    {/* Liquid Fill */}
                    <div
                        className={cn("absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out", percentage >= 100 ? "bg-gradient-to-t from-green-500 to-green-400" : "bg-gradient-to-t from-blue-600 to-blue-400")}
                        style={{ height: `${percentage}%`, opacity: 0.8 }}
                    />

                    <div className="z-20 text-center relative">
                        {percentage >= 100 ? (
                            <PartyPopper className="w-8 h-8 text-white mx-auto mb-1 animate-bounce" />
                        ) : (
                            <Droplets className={cn("w-8 h-8 text-white mx-auto mb-1 transition-all", isAdding ? "scale-125" : "scale-100")} />
                        )}
                        <span className="text-xs font-medium text-white/80">{percentage >= 100 ? "GOAL!" : "H2O"}</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-3 w-full z-10">
                <button
                    onClick={() => handleUpdate(250)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 border border-transparent transition-all group active:scale-95"
                >
                    <Plus className="w-4 h-4 mb-1 text-muted-foreground group-hover:text-blue-400" />
                    <span className="text-xs font-semibold">+250ml</span>
                </button>
                <button
                    onClick={() => handleUpdate(500)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 border border-transparent transition-all group active:scale-95"
                >
                    <Plus className="w-4 h-4 mb-1 text-muted-foreground group-hover:text-blue-400" />
                    <span className="text-xs font-semibold">+500ml</span>
                </button>
                <button
                    onClick={() => handleUpdate(-250)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-red-500/20 hover:border-red-500/50 border border-transparent transition-all group active:scale-95"
                >
                    <Minus className="w-4 h-4 mb-1 text-muted-foreground group-hover:text-red-400" />
                    <span className="text-xs font-semibold">Undo</span>
                </button>
            </div>

        </div>
    );
}
