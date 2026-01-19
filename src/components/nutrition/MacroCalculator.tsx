import { useState, useEffect } from "react";
import { MoveRight, Calculator, Scale, Ruler, Activity, Target } from "lucide-react";
import { UserNutritionProfile, MacroTargets } from "@/types/nutrition";
import { cn } from "@/lib/utils";

interface MacroCalculatorProps {
    onSave: (targets: MacroTargets, profile: UserNutritionProfile) => void;
    initialProfile?: UserNutritionProfile | null;
}

export function MacroCalculator({ onSave, initialProfile }: MacroCalculatorProps) {
    const [profile, setProfile] = useState<UserNutritionProfile>({
        weight: initialProfile?.weight || 70,
        height: initialProfile?.height || 175,
        age: initialProfile?.age || 30,
        gender: initialProfile?.gender || 'male',
        activityLevel: initialProfile?.activityLevel || 'moderate',
        goal: initialProfile?.goal || 'maintain',
        dailyWaterGoal: initialProfile?.dailyWaterGoal || 2500,
    });

    const [result, setResult] = useState<MacroTargets | null>(null);

    // Recalculate on mount if profile exists
    useEffect(() => {
        if (initialProfile) {
            calculateMacros();
        }
    }, []);

    useEffect(() => {
        calculateMacros();
    }, [profile]);

    const calculateMacros = () => {
        // Mifflin-St Jeor Equation
        let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
        bmr += profile.gender === 'male' ? 5 : -161;

        // Activity Multipliers
        const multipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9,
        };

        const tdee = bmr * multipliers[profile.activityLevel];

        // Goal Adjustments
        let targetCalories = tdee;
        if (profile.goal === 'bulk') targetCalories += 400;
        if (profile.goal === 'cut') targetCalories -= 500;

        // Macro Split (Simplified High Protein)
        // Protein: 2g per kg bodyweight
        const protein = Math.round(profile.weight * 2.2);
        const proteinCals = protein * 4;

        // Fats: 0.8g per kg bodyweight
        const fats = Math.round(profile.weight * 0.9);
        const fatCals = fats * 9;

        // Carbs: Remaining
        const remainingCals = targetCalories - proteinCals - fatCals;
        const carbs = Math.max(0, Math.round(remainingCals / 4));

        setResult({
            calories: Math.round(targetCalories),
            protein,
            carbs,
            fats,
        });
    };

    const activityOptions = [
        { value: 'sedentary', label: 'Sedentary', desc: 'Office job, little exercise' },
        { value: 'light', label: 'Light', desc: '1-3 days/week' },
        { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
        { value: 'active', label: 'Active', desc: '6-7 days/week' },
        { value: 'very_active', label: 'Very Active', desc: 'Physical job + training' },
    ];

    return (
        <div className="glass-card p-6 md:p-8 rounded-3xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calculator className="w-32 h-32 text-primary" />
            </div>

            <div className="space-y-2 relative z-10">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-primary" />
                    Macro Calculator
                </h2>
                <p className="text-muted-foreground">Calculate your optimal nutrition targets based on your biology and goals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {/* INPUTS */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /> Weight (kg)</label>
                            <input
                                type="number"
                                value={profile.weight}
                                onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
                                className="w-full bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 ring-primary/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Ruler className="w-4 h-4 text-primary" /> Height (cm)</label>
                            <input
                                type="number"
                                value={profile.height}
                                onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
                                className="w-full bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 ring-primary/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Age</label>
                            <input
                                type="number"
                                value={profile.age}
                                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                                className="w-full bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 ring-primary/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Gender</label>
                            <select
                                value={profile.gender}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                                className="w-full bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 ring-primary/50 outline-none transition-all appearance-none"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Activity Level</label>
                        <select
                            value={profile.activityLevel}
                            onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as any })}
                            className="w-full bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 ring-primary/50 outline-none transition-all"
                        >
                            {activityOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label} - {opt.desc}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Goal</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['cut', 'maintain', 'bulk'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setProfile({ ...profile, goal: g })}
                                    className={cn(
                                        "p-3 rounded-xl border border-white/5 transition-all capitalization",
                                        profile.goal === g ? "bg-primary text-white shadow-glow" : "bg-background/30 hover:bg-white/5"
                                    )}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RESULTS */}
                <div className="bg-background/30 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-center gap-6 border border-white/5 relative overflow-hidden animate-in fade-in zoom-in duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />

                    <div className="text-center space-y-1 relative z-10 transition-all">
                        <span className="text-muted-foreground text-sm uppercase tracking-wider">Daily Target</span>
                        <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">
                            {result?.calories.toLocaleString()}
                        </div>
                        <span className="text-sm text-muted-foreground">kcal / day</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 relative z-10">
                        <MacroCard label="Protein" amount={result?.protein || 0} unit="g" color="text-blue-400" />
                        <MacroCard label="Carbs" amount={result?.carbs || 0} unit="g" color="text-green-400" />
                        <MacroCard label="Fats" amount={result?.fats || 0} unit="g" color="text-yellow-400" />
                    </div>

                    <button
                        onClick={() => result && onSave(result, profile)}
                        className="w-full mt-4 bg-white text-black font-semibold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                    >
                        {initialProfile ? "Update Targets" : "Start Tracking"} <MoveRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function MacroCard({ label, amount, unit, color }: { label: string, amount: number, unit: string, color: string }) {
    return (
        <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5 hover:bg-black/30 transition-colors">
            <div className={cn("text-xs font-semibold uppercase tracking-wider mb-1", color)}>{label}</div>
            <div className="text-xl font-bold text-white mb-0.5">{amount}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></div>
        </div>
    )
}
