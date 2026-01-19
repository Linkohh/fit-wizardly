import { useState, useEffect } from "react";
import { MacroCalculator } from "@/components/nutrition/MacroCalculator";
import { HydrationTracker } from "@/components/nutrition/HydrationTracker";
import { MealSuggestions } from "@/components/nutrition/MealSuggestions";
import { FoodLogger } from "@/components/nutrition/FoodLogger";
import { MacroTargets, UserNutritionProfile, MealEntry, DailyNutritionLog } from "@/types/nutrition";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNutritionStore } from "@/stores/nutritionStore";

export default function NutritionPage() {
    // Store Integration
    const { profile, targets, dailyLog, setProfile, updateHydration, logMeal, checkNewDay } = useNutritionStore();
    const [isEditingCalculator, setIsEditingCalculator] = useState(false);

    // Check for day rollover on mount
    useEffect(() => {
        checkNewDay();
    }, [checkNewDay]);

    // Handler Wrappers
    const handleSaveProfile = (newTargets: MacroTargets, newProfile: UserNutritionProfile) => {
        setProfile(newProfile, newTargets);
        setIsEditingCalculator(false);
    };

    // Calculate current daily totals
    const currentTotals = dailyLog.meals.reduce((acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl animate-in fade-in duration-500">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-2 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 flex items-center gap-3">
                        Nutrition Center <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        Fuel your performance with precision. Track macros, hydration, and get personalized meal recommendations based on your goal.
                    </p>
                </div>
            </div>

            {!targets || isEditingCalculator ? (
                /* Onboarding State or Edit Mode */
                <div className="max-w-3xl mx-auto py-12 relative animate-in zoom-in-95 duration-300">
                    {isEditingCalculator && (
                        <button
                            onClick={() => setIsEditingCalculator(false)}
                            className="absolute -top-10 right-0 text-sm text-muted-foreground hover:text-white"
                        >
                            Cancel Editing
                        </button>
                    )}
                    <MacroCalculator onSave={handleSaveProfile} initialProfile={profile} />
                </div>
            ) : (
                /* Dashboard State */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Tracker & Hydration */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Daily Progress Summary */}
                        <div className="glass-card p-6 rounded-3xl">
                            <h3 className="font-semibold text-lg mb-4">Daily Progress</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <ProgressRing label="Calories" current={currentTotals.calories} target={targets.calories} color="text-white" />
                                <ProgressRing label="Protein" current={currentTotals.protein} target={targets.protein} color="text-blue-400" unit="g" />
                                <ProgressRing label="Carbs" current={currentTotals.carbs} target={targets.carbs} color="text-green-400" unit="g" />
                                <ProgressRing label="Fats" current={currentTotals.fats} target={targets.fats} color="text-yellow-400" unit="g" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <HydrationTracker
                                currentAmount={dailyLog.water}
                                targetAmount={profile?.dailyWaterGoal || 2500}
                                onUpdate={updateHydration}
                            />
                            <FoodLogger
                                onLogMeal={logMeal}
                                dayTotal={currentTotals}
                            />
                        </div>

                        {/* Recent Meals List */}
                        <div className="glass-card p-6 rounded-3xl">
                            <h3 className="font-semibold text-lg mb-4">Today's Log</h3>
                            {dailyLog.meals.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic py-4 text-center">No meals logged yet today.</p>
                            ) : (
                                <div className="space-y-3">
                                    {dailyLog.meals.map((meal, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div>
                                                <div className="font-medium text-sm">{meal.name}</div>
                                                <div className="text-xs text-muted-foreground capitalize">{meal.mealType} • {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm">{meal.calories} kcal</div>
                                                <div className="text-xs text-blue-400">{meal.protein}P • {meal.carbs}C • {meal.fats}F</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Calculator & Suggestions */}
                    <div className="space-y-6">
                        {/* Mini Calculator (Edit Mode) */}
                        <div className="group relative">
                            <button
                                onClick={() => setIsEditingCalculator(true)}
                                className="absolute top-4 right-4 text-xs text-muted-foreground hover:text-white z-10 underline"
                            >
                                Edit Targets
                            </button>
                            <div className="glass-card p-6 rounded-3xl opacity-80 hover:opacity-100 transition-opacity">
                                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Current Goal</div>
                                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary capitalize mb-4">
                                    {profile?.goal}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Calories</span> <span>{targets.calories}</span></div>
                                    <div className="w-full bg-white/10 h-1 rounded-full"><div className="bg-white h-full rounded-full" style={{ width: '100%' }} /></div>
                                </div>
                            </div>
                        </div>

                        <MealSuggestions
                            goal={profile?.goal || 'maintain'}
                            isWorkoutDay={dailyLog.isWorkoutDay}
                        />
                    </div>

                </div>
            )}
        </div>
    );
}

function ProgressRing({ label, current, target, color, unit = "" }: { label: string, current: number, target: number, color: string, unit?: string }) {
    const percentage = Math.min(100, (current / target) * 100);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-2">
            <div className="relative w-24 h-24 mb-2">
                <svg className="transform -rotate-90 w-24 h-24">
                    <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle
                        cx="48" cy="48" r={radius}
                        stroke="currentColor" strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-out", color)}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold">{current}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{unit}</span>
                </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-[10px] text-white/50">/ {target}{unit}</span>
        </div>
    )
}
