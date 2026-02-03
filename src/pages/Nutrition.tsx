import { useState } from "react";
import { MacroCalculator } from "@/components/nutrition/MacroCalculator";
import { HydrationTracker } from "@/components/nutrition/HydrationTracker";
import { MealSuggestions } from "@/components/nutrition/MealSuggestions";
import { FoodLogger } from "@/components/nutrition/FoodLogger";
import { NutritionInsights } from "@/components/nutrition/NutritionInsights";
import { NutritionLearn } from "@/components/nutrition/NutritionLearn";
import { SmartRemaining } from "@/components/nutrition/SmartRemaining";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MacroTargets, UserNutritionProfile } from "@/types/nutrition";
import { Sparkles, ArrowLeft, Trash2, UtensilsCrossed, ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutDashboard, BarChart3, BookOpen, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useNutritionStore } from "@/stores/nutritionStore";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getPriorityMacro } from "@/lib/nutritionUtils";
import { format, addDays, subDays, parseISO } from "date-fns";

export default function NutritionPage() {
    // Store Integration
    const { profile, targets, getCurrentLog, selectedDate, changeDate, setProfile, logMeal, removeMeal } = useNutritionStore();
    const [isEditingCalculator, setIsEditingCalculator] = useState(false);

    // Get the log for the currently selected date
    const dailyLog = getCurrentLog();

    // Handler Wrappers
    const handleSaveProfile = (newTargets: MacroTargets, newProfile: UserNutritionProfile) => {
        setProfile(newProfile, newTargets);
        setIsEditingCalculator(false);
    };

    const handleRemoveMeal = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeMeal(id);
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const current = parseISO(selectedDate);
        const newDate = direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        changeDate(newDate.toISOString().split('T')[0]);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    // Calculate current daily totals
    const currentTotals = dailyLog.meals.reduce((acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return (
        <div className="container-full py-8 space-y-8 animate-in fade-in duration-500">

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
                    {targets && !isEditingCalculator && (
                        <button
                            onClick={() => setIsEditingCalculator(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 mt-3 text-sm font-medium rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-muted-foreground hover:text-white"
                        >
                            <Settings2 className="w-4 h-4" />
                            Edit Goals
                        </button>
                    )}
                </div>

                {/* Date Navigation */}
                <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 self-start md:self-center">
                    <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 min-w-[140px] justify-center font-medium">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        <span>{isToday ? 'Today' : format(parseISO(selectedDate), 'MMM d, yyyy')}</span>
                    </div>
                    <button onClick={() => navigateDate('next')} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
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
                /* Tabbed Dashboard State */
                <Tabs defaultValue="dashboard" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 gap-1 rounded-xl max-w-md">
                        <TabsTrigger value="dashboard" className="py-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="py-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <BarChart3 className="w-4 h-4" /> Insights
                        </TabsTrigger>
                        <TabsTrigger value="learn" className="py-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <BookOpen className="w-4 h-4" /> Learn
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left Column: Tracker & Hydration */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Daily Progress Summary */}
                                <div className="glass-card p-6 rounded-3xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-lg">Daily Targets</h3>
                                        <span className="text-xs bg-white/5 px-2 py-1 rounded-full text-muted-foreground">
                                            {dailyLog.meals.length} meals logged
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <ProgressRing
                                            label="Calories"
                                            current={currentTotals.calories}
                                            target={targets.calories}
                                            color="text-white"
                                            showRemaining={true}
                                        />
                                        <ProgressRing
                                            label="Protein"
                                            current={currentTotals.protein}
                                            target={targets.protein}
                                            color="text-blue-400"
                                            unit="g"
                                            showRemaining={true}
                                        />
                                        <ProgressRing
                                            label="Carbs"
                                            current={currentTotals.carbs}
                                            target={targets.carbs}
                                            color="text-green-400"
                                            unit="g"
                                            showRemaining={true}
                                        />
                                        <ProgressRing
                                            label="Fats"
                                            current={currentTotals.fats}
                                            target={targets.fats}
                                            color="text-yellow-400"
                                            unit="g"
                                            showRemaining={true}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <HydrationTracker />
                                    <FoodLogger
                                        onLogMeal={logMeal}
                                        dayTotal={currentTotals}
                                    />
                                </div>

                                {/* Today's Log */}
                                <div className="glass-card p-6 rounded-3xl min-h-[300px]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-lg">Today's Log</h3>
                                    </div>

                                    {dailyLog.meals.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-4 animate-in fade-in zoom-in duration-500">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                <UtensilsCrossed className="w-8 h-8 opacity-50" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-white/80">Your plate is empty!</p>
                                                <p className="text-sm">Log your first meal to start hitting your goals.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {dailyLog.meals.map((meal) => (
                                                <div key={meal.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all animate-in slide-in-from-left-4 duration-300">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm text-white group-hover:text-primary transition-colors">{meal.name}</div>
                                                        <div className="text-xs text-muted-foreground capitalize flex gap-2">
                                                            <span>{meal.mealType}</span>
                                                            <span>•</span>
                                                            <span>{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="font-bold text-sm">{meal.calories} kcal</div>
                                                            <div className="text-[10px] text-muted-foreground space-x-1">
                                                                <span className="text-blue-400">{meal.protein}p</span>
                                                                <span className="text-green-400">{meal.carbs}c</span>
                                                                <span className="text-yellow-400">{meal.fats}f</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => handleRemoveMeal(meal.id, e)}
                                                            className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Remove meal"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Calculator & Suggestions */}
                            <div className="space-y-6">
                                {/* Current Goal Summary */}
                                <div className="glass-card p-6 rounded-3xl">
                                    <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Current Goal</div>
                                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary capitalize mb-4">
                                        {profile?.goal}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span>Calories Remaining</span> <span>{Math.max(0, targets.calories - currentTotals.calories)}</span></div>
                                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (currentTotals.calories / targets.calories) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <MealSuggestions
                                    goal={profile?.goal || 'maintain'}
                                    isWorkoutDay={dailyLog.isWorkoutDay}
                                />

                                <SmartRemaining
                                    remaining={{
                                        calories: Math.max(0, targets.calories - currentTotals.calories),
                                        protein: Math.max(0, targets.protein - currentTotals.protein),
                                        carbs: Math.max(0, targets.carbs - currentTotals.carbs),
                                        fats: Math.max(0, targets.fats - currentTotals.fats),
                                    }}
                                    priorityMacro={getPriorityMacro(
                                        {
                                            protein: Math.max(0, targets.protein - currentTotals.protein),
                                            carbs: Math.max(0, targets.carbs - currentTotals.carbs),
                                            fats: Math.max(0, targets.fats - currentTotals.fats),
                                        },
                                        targets
                                    )}
                                />
                            </div>

                        </div>
                    </TabsContent>

                    <TabsContent value="insights">
                        <NutritionInsights />
                    </TabsContent>

                    <TabsContent value="learn">
                        <NutritionLearn />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
