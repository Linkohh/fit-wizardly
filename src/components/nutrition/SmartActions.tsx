import { Copy, Save, Trash2, Utensils } from "lucide-react";
import { useNutritionStore } from "@/stores/nutritionStore";
import { MealEntry } from "@/types/nutrition";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SmartActionsProps {
    onLog: (meal: MealEntry | MealEntry[]) => void;
    onSaveTemplate: (meal: MealEntry) => void;
}

export function SmartActions({ onLog, onSaveTemplate }: SmartActionsProps) {
    const { getLastFullMeal, savedMeals, deleteMealTemplate } = useNutritionStore();

    // Smart Suggestion Logic based on time of day
    const hour = new Date().getHours();
    let suggestedType = 'snack';
    if (hour < 11) suggestedType = 'breakfast';
    else if (hour < 15) suggestedType = 'lunch';
    else if (hour < 21) suggestedType = 'dinner';

    // Get the last full meal of this type
    const lastMealGroup = getLastFullMeal(suggestedType);

    // Group name helper
    const getGroupName = () => {
        if (lastMealGroup.length === 0) return `Last ${suggestedType}`;
        if (lastMealGroup.length === 1) return `Last: ${lastMealGroup[0].name}`;
        return `Last ${suggestedType} (${lastMealGroup.length} items)`;
    };

    const handleCopyRecent = () => {
        if (lastMealGroup.length > 0) {
            // Regenerate IDs for new log
            const freshItems = lastMealGroup.map(item => ({
                ...item,
                id: Math.random().toString(),
                timestamp: new Date()
            }));
            onLog(freshItems);
            toast.success(`Copied ${suggestedType} to today`);
        } else {
            toast.error(`No previous ${suggestedType} found`);
        }
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            {/* Copy Previous Button */}
            <button
                onClick={handleCopyRecent}
                disabled={lastMealGroup.length === 0}
                className="col-span-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-500 hover:bg-blue-500/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Copy className="w-4 h-4" />
                <span>Copy {getGroupName()}</span>
            </button>

            {/* Saved Templates List */}
            {savedMeals.length > 0 && (
                <div className="col-span-2 space-y-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider ml-1">My Templates</div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {savedMeals.map(template => (
                            <div key={template.id} className="relative group flex-shrink-0">
                                <button
                                    onClick={() => onLog(template.items.map(i => ({ ...i, id: Math.random().toString(), timestamp: new Date() })))}
                                    className="bg-muted/50 hover:bg-primary/10 border border-border/50 hover:border-primary/30 rounded-xl p-3 flex flex-col gap-1 min-w-[100px] text-left transition-all"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Utensils className="w-3 h-3 text-primary" />
                                        <span className="font-medium text-sm truncate max-w-[80px]">{template.name}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{Math.round(template.totalCalories)} kcal</div>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteMealTemplate(template.id); }}
                                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
