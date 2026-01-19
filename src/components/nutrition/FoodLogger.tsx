import { useState } from "react";
import { Scan, Plus, Search, X } from "lucide-react";
import { MealEntry, MacroTargets } from "@/types/nutrition";
import { cn } from "@/lib/utils";

interface FoodLoggerProps {
    onLogMeal: (meal: MealEntry) => void;
    dayTotal: MacroTargets;
}

export function FoodLogger({ onLogMeal, dayTotal }: FoodLoggerProps) {
    const [mode, setMode] = useState<'view' | 'scan' | 'search'>('view');
    const [isScanning, setIsScanning] = useState(false);

    // Simulated scan handler
    const handleSimulatedScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            // Mock result
            const mockFood: MealEntry = {
                id: Math.random().toString(),
                name: "Oats & Whey Protein",
                calories: 320,
                protein: 24,
                carbs: 45,
                fats: 6,
                mealType: 'breakfast',
                timestamp: new Date()
            };
            onLogMeal(mockFood);
            setMode('view');
        }, 2000);
    };

    if (mode === 'scan') {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="absolute top-4 right-4 z-50">
                    <button onClick={() => setMode('view')} className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20"><X className="w-6 h-6" /></button>
                </div>

                <div className="relative w-full max-w-md aspect-[3/4] bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                    {/* Camera Simulator */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale" />

                    {/* Scanning UI Overlays */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-64 h-64 border-2 border-primary/50 rounded-3xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary -mt-1 -ml-1 rounded-tl-xl" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary -mt-1 -mr-1 rounded-tr-xl" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary -mb-1 -ml-1 rounded-bl-xl" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary -mb-1 -mr-1 rounded-br-xl" />

                            {/* Laser Scan Line */}
                            {isScanning && (
                                <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_linear_infinite]" />
                            )}
                        </div>
                        <p className="mt-8 text-white/80 font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                            {isScanning ? "Processing..." : "Align barcode within frame"}
                        </p>
                    </div>

                    <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                        <button
                            onClick={handleSimulatedScan}
                            disabled={isScanning}
                            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-white" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Scan className="w-5 h-5 text-primary" />
                    Food Logger
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setMode('search')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><Search className="w-4 h-4" /></button>
                    <button onClick={() => setMode('scan')} className="p-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors"><Scan className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Daily Summary Mini-View */}
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="bg-white/5 rounded-xl p-2">
                    <div className="text-muted-foreground text-xs mb-1">Cals</div>
                    <div className="font-bold">{dayTotal.calories}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                    <div className="text-blue-400 text-xs mb-1">PRO</div>
                    <div className="font-bold">{dayTotal.protein}g</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                    <div className="text-green-400 text-xs mb-1">CARB</div>
                    <div className="font-bold">{dayTotal.carbs}g</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                    <div className="text-yellow-400 text-xs mb-1">FAT</div>
                    <div className="font-bold">{dayTotal.fats}g</div>
                </div>
            </div>

            <button
                onClick={() => setMode('search')}
                className="w-full py-3 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:bg-white/5 hover:text-white transition-all"
            >
                <Plus className="w-4 h-4" /> Log Meal Manually
            </button>

            {mode === 'search' && (
                <div className="border-t border-white/10 pt-4 animate-in slide-in-from-top-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                            autoFocus
                            placeholder="Search foods (e.g., 'Chicken Breast')"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 ring-primary outline-none"
                        />
                    </div>
                    <button onClick={() => setMode('view')} className="text-xs text-center w-full mt-2 text-muted-foreground hover:text-white">Cancel</button>
                </div>
            )}
        </div>
    );
}
