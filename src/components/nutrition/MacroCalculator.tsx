import { useState, useEffect } from "react";
import { MoveRight, Calculator, Scale, Ruler, Activity, Target } from "lucide-react";
import { UserNutritionProfile, MacroTargets } from "@/types/nutrition";
import { cn } from "@/lib/utils";

type WeightUnit = 'kg' | 'lbs';
type HeightUnit = 'cm' | 'ft';

interface MacroCalculatorProps {
    onSave: (targets: MacroTargets, profile: UserNutritionProfile) => void;
    initialProfile?: UserNutritionProfile | null;
}

// Conversion helpers
const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
const lbsToKg = (lbs: number) => Math.round(lbs / 2.20462 * 10) / 10;
const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
};
const feetInchesToCm = (feet: number, inches: number) => Math.round((feet * 12 + inches) * 2.54);

export function MacroCalculator({ onSave, initialProfile }: MacroCalculatorProps) {
    const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
    const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');

    // Display values (in current unit)
    const [displayWeight, setDisplayWeight] = useState(initialProfile?.weight || 70);
    const [displayHeightCm, setDisplayHeightCm] = useState(initialProfile?.height || 175);
    const [displayFeet, setDisplayFeet] = useState(5);
    const [displayInches, setDisplayInches] = useState(9);

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

    // Initialize display values from initial profile
    useEffect(() => {
        if (initialProfile) {
            setDisplayWeight(initialProfile.weight);
            setDisplayHeightCm(initialProfile.height);
            const { feet, inches } = cmToFeetInches(initialProfile.height);
            setDisplayFeet(feet);
            setDisplayInches(inches);
        }
    }, [initialProfile]);

    // Recalculate on mount if profile exists
    useEffect(() => {
        if (initialProfile) {
            calculateMacros();
        }
    }, []);

    useEffect(() => {
        calculateMacros();
    }, [profile]);

    // Handle unit changes
    const handleWeightUnitChange = (newUnit: WeightUnit) => {
        if (newUnit === weightUnit) return;

        if (newUnit === 'lbs') {
            setDisplayWeight(kgToLbs(profile.weight));
        } else {
            setDisplayWeight(profile.weight);
        }
        setWeightUnit(newUnit);
    };

    const handleHeightUnitChange = (newUnit: HeightUnit) => {
        if (newUnit === heightUnit) return;

        if (newUnit === 'ft') {
            const { feet, inches } = cmToFeetInches(profile.height);
            setDisplayFeet(feet);
            setDisplayInches(inches);
        } else {
            setDisplayHeightCm(profile.height);
        }
        setHeightUnit(newUnit);
    };

    // Handle input changes
    const handleWeightChange = (value: number) => {
        setDisplayWeight(value);
        const weightInKg = weightUnit === 'lbs' ? lbsToKg(value) : value;
        setProfile({ ...profile, weight: weightInKg });
    };

    const handleHeightCmChange = (value: number) => {
        setDisplayHeightCm(value);
        setProfile({ ...profile, height: value });
    };

    const handleFeetChange = (feet: number) => {
        setDisplayFeet(feet);
        const cm = feetInchesToCm(feet, displayInches);
        setProfile({ ...profile, height: cm });
    };

    const handleInchesChange = (inches: number) => {
        setDisplayInches(inches);
        const cm = feetInchesToCm(displayFeet, inches);
        setProfile({ ...profile, height: cm });
    };

    const calculateMacros = () => {
        // Mifflin-St Jeor Equation (uses kg and cm internally)
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
                        {/* Weight with unit toggle */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Scale className="w-4 h-4 text-primary" /> Weight
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={displayWeight}
                                    onChange={(e) => handleWeightChange(Number(e.target.value))}
                                    className="flex-1 min-w-0 bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 ring-primary/50 outline-none transition-all"
                                />
                                <div className="flex rounded-xl overflow-hidden border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => handleWeightUnitChange('kg')}
                                        className={cn(
                                            "px-2 py-2 text-xs font-medium transition-all",
                                            weightUnit === 'kg'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-background/50 text-muted-foreground hover:bg-white/5"
                                        )}
                                    >
                                        kg
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleWeightUnitChange('lbs')}
                                        className={cn(
                                            "px-2 py-2 text-xs font-medium transition-all",
                                            weightUnit === 'lbs'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-background/50 text-muted-foreground hover:bg-white/5"
                                        )}
                                    >
                                        lbs
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Height with unit toggle */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-primary" /> Height
                            </label>
                            {heightUnit === 'cm' ? (
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={displayHeightCm}
                                        onChange={(e) => handleHeightCmChange(Number(e.target.value))}
                                        className="flex-1 min-w-0 bg-background/50 border border-white/10 rounded-xl p-3 focus:ring-2 ring-primary/50 outline-none transition-all"
                                    />
                                    <div className="flex rounded-xl overflow-hidden border border-white/10 bg-background/30 p-1 gap-1 h-11 items-center">
                                        <button
                                            type="button"
                                            onClick={() => handleHeightUnitChange('cm')}
                                            className={cn(
                                                "h-9 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                                                "bg-primary text-primary-foreground shadow-sm"
                                            )}
                                        >
                                            cm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleHeightUnitChange('ft')}
                                            className={cn(
                                                "h-9 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                                                "text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            ft
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <div className="flex gap-1 flex-1 min-w-0">
                                        <input
                                            type="number"
                                            value={displayFeet}
                                            onChange={(e) => handleFeetChange(Number(e.target.value))}
                                            className="flex-1 min-w-0 bg-background/50 border border-white/10 rounded-xl p-2 focus:ring-2 ring-primary/50 outline-none transition-all text-center"
                                            min={0}
                                            max={8}
                                            placeholder="ft"
                                        />
                                        <input
                                            type="number"
                                            value={displayInches}
                                            onChange={(e) => handleInchesChange(Number(e.target.value))}
                                            className="flex-1 min-w-0 bg-background/50 border border-white/10 rounded-xl p-2 focus:ring-2 ring-primary/50 outline-none transition-all text-center"
                                            min={0}
                                            max={11}
                                            placeholder="in"
                                        />
                                    </div>
                                    <div className="flex rounded-xl overflow-hidden border border-white/10 bg-background/30 p-1 gap-1 h-11 items-center">
                                        <button
                                            type="button"
                                            onClick={() => handleHeightUnitChange('cm')}
                                            className={cn(
                                                "h-9 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                                                "text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            cm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleHeightUnitChange('ft')}
                                            className={cn(
                                                "h-9 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                                                "bg-primary text-primary-foreground shadow-sm"
                                            )}
                                        >
                                            ft
                                        </button>
                                    </div>
                                </div>
                            )}
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
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' })}
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
                            onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as UserNutritionProfile['activityLevel'] })}
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
                                        "p-3 rounded-xl border border-white/5 transition-all capitalize",
                                        profile.goal === g ? "bg-primary text-primary-foreground shadow-glow" : "bg-background/30 hover:bg-white/5"
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
                        <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
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
                        className="w-full mt-4 bg-primary text-primary-foreground font-semibold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
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
            <div className="text-xl font-bold text-foreground mb-0.5">{amount}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></div>
        </div>
    )
}
