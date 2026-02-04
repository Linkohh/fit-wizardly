import { useCallback, useMemo } from 'react';
import { ExerciseSuggestions } from '@/components/wizard/ExerciseSuggestions';
import { useWizardStore } from '@/stores/wizardStore';
import { useWizardForm, anatomyStepSchema } from '@/hooks/useWizardForm';
import { FormError } from '@/components/ui/form-error';
import { MuscleSelector } from '@/features/mcl';
import { mapLegacyToMcl, mapMclToLegacy } from '@/lib/muscleMapping';
import { useThemeStore } from '@/stores/themeStore';

export function AnatomyPanel() {
    const { selections, setTargetMuscles } = useWizardStore();
    const themeMode = useThemeStore((state) => state.mode);

    // React Hook Form integration with Zustand sync
    const { watch, setValue, formState: { errors }, trigger } = useWizardForm({
        schema: anatomyStepSchema,
        defaultValues: {
            targetMuscles: selections.targetMuscles,
        },
        onSync: (values) => {
            if (values.targetMuscles !== undefined) setTargetMuscles(values.targetMuscles);
        },
    });

    // Watch target muscles for reactive updates
    const watchedTargetMuscles = watch('targetMuscles') || [];

    // Map Legacy Groups to MCL IDs for visualization
    const selectedMclIds = useMemo(() => mapLegacyToMcl(watchedTargetMuscles), [watchedTargetMuscles]);

    // Handle selection from MCL
    const handleSelectionChange = useCallback((newMclIds: string[]) => {
        // Map back to legacy groups
        const newGroups = mapMclToLegacy(newMclIds);

        setValue('targetMuscles', newGroups, { shouldValidate: true, shouldDirty: true });
        // Trigger validation immediately
        trigger('targetMuscles');

        // Update store directly for immediate feedback if needed (optional, handled by onSync usually)
        setTargetMuscles(newGroups);
    }, [setValue, setTargetMuscles, trigger]);

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
                {/* Validation error */}
                <FormError error={errors.targetMuscles?.message} />
            </div>

            {/* MCL Integration */}
            <div className="w-full min-h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-[#1a103c]/80 to-[#2d1b4e]/40 backdrop-blur-md">
                <MuscleSelector
                    selectedMuscles={selectedMclIds}
                    onSelectionChange={handleSelectionChange}
                    showPresets={true}
                    showInfoPanel={true}
                    showSelectionSidebar={true}
                    showLegend={false} // Cleaner look
                    theme={themeMode}
                    height="600px"
                    className="w-full bg-transparent"
                />
            </div>

            {/* Real-time Exercise Suggestions */}
            {watchedTargetMuscles.length > 0 && selections.equipment.length > 0 && (
                <ExerciseSuggestions
                    muscles={watchedTargetMuscles}
                    equipment={selections.equipment}
                    experienceLevel={selections.experienceLevel}
                    className="mt-6"
                />
            )}
        </div>
    );
}
