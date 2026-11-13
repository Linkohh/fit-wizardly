import { useMemo, useState } from "react";
import { CalendarDays, Copy, Save, Trash2, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNutritionStore } from "@/stores/nutritionStore";
import { copyableMeals, previousDate } from "@/lib/mealShortcuts";
import { MealEntry } from "@/types/nutrition";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SmartActionsProps {
    onLog: (meal: MealEntry | MealEntry[]) => void;
    onSaveTemplate: (meals: MealEntry[], name: string) => void;
}

export function SmartActions({ onLog, onSaveTemplate }: SmartActionsProps) {
    const { t } = useTranslation();
    const { getLastFullMeal, savedMeals, deleteMealTemplate, history, selectedDate, copyMealsFromDate } = useNutritionStore();
    const [isNamingTemplate, setIsNamingTemplate] = useState(false);
    const [templateName, setTemplateName] = useState("");

    // "Yesterday" is relative to the day being viewed, not the wall clock.
    const yesterday = previousDate(selectedDate);
    const yesterdayMealCount = useMemo(
        () => copyableMeals(history, yesterday).length,
        [history, yesterday]
    );

    const handleCopyYesterday = () => {
        const added = copyMealsFromDate(yesterday);
        if (added > 0) {
            toast.success(t('nutrition.shortcuts.copied_toast', { count: added }));
        }
    };

    const closeTemplateForm = () => {
        setIsNamingTemplate(false);
        setTemplateName("");
    };

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

    const handleSaveTemplate = () => {
        const name = templateName.trim();
        if (!name || lastMealGroup.length === 0) return;

        onSaveTemplate(lastMealGroup, name);
        toast.success(t('nutrition.shortcuts.template_saved'));
        closeTemplateForm();
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

            {/* Copy Yesterday Button */}
            <button
                onClick={handleCopyYesterday}
                disabled={yesterdayMealCount === 0}
                title={yesterdayMealCount === 0 ? t('nutrition.shortcuts.copy_yesterday_empty') : undefined}
                className="col-span-2 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-primary/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <CalendarDays className="w-4 h-4" />
                <span>
                    {yesterdayMealCount === 0
                        ? t('nutrition.shortcuts.copy_yesterday')
                        : t('nutrition.shortcuts.copy_yesterday_count', { count: yesterdayMealCount })}
                </span>
            </button>

            {/* Save the last meal as a template */}
            {lastMealGroup.length > 0 && !isNamingTemplate && (
                <button
                    onClick={() => setIsNamingTemplate(true)}
                    className="col-span-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-1 transition-colors"
                >
                    <Save className="w-3 h-3" />
                    <span>{t('nutrition.shortcuts.save_template')}</span>
                </button>
            )}

            {lastMealGroup.length > 0 && isNamingTemplate && (
                <form
                    className="col-span-2 flex items-center gap-2"
                    onSubmit={(event) => { event.preventDefault(); handleSaveTemplate(); }}
                >
                    <input
                        autoFocus
                        value={templateName}
                        onChange={(event) => setTemplateName(event.target.value)}
                        aria-label={t('nutrition.shortcuts.template_name')}
                        placeholder={t('nutrition.shortcuts.template_name')}
                        maxLength={60}
                        className="flex-1 min-w-0 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Button type="submit" size="sm" disabled={templateName.trim() === ""}>
                        {t('nutrition.shortcuts.save')}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={closeTemplateForm}>
                        {t('nutrition.shortcuts.cancel')}
                    </Button>
                </form>
            )}

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
